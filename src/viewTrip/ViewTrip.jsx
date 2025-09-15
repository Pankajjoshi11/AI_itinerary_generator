import { db } from "@/services/fireBaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { InfoSection } from "../components/Trip/InfoSection";
import { Flights } from "../components/Flights/Flights";
import { Itinerary } from "../components/Trip/Itinerary";
import { Packing } from "../components/Packing/Packing";
import PdfMaker from "../components/Trip/Pdfmaker";
import { Card } from "@/components/ui/card";
import Chatbot from "../components/chatbot/Chatbot";
import EventList from "../components/EventList/Event";
import Map from "@/components/Map/Map";
import { AI_PROMPT_ITINERARY, AI_PROMPT_FLIGHTS, AI_PROMPT_PACKING } from "../constants/options";
import { chatSession } from "@/services/AImodel";
import emailjs from "emailjs-com";
import { Shopping } from "../components/Shopping/Shopping";

// Array of 10 local image paths (stored in public/images/)
const localHotelImages = [
  "/images/hotel1.jpg",
  "/images/hotel2.jpg",
  "/images/hotel3.jpg",
  "/images/hotel4.jpg",
  "/images/hotel5.jpg",
  "/images/hotel6.jpg",
  "/images/hotel7.jpg",
  "/images/hotel8.jpg",
  "/images/hotel9.jpg",
  "/images/hotel10.jpg",
];

/* =======================
   Helpers: robust AI JSON
   ======================= */

const stripCodeFences = (s) => s.replace(/^\s*```[\s\S]*?\n?|\n?```$/g, "").trim();
const normalizeQuotes = (s) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
const removeTrailingCommas = (s) => s.replace(/,\s*([\]}])/g, "$1");

const evalArithmeticSafely = (expr) => {
  if (!/^[\d\s+\-*/().]+$/.test(expr)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${expr});`);
    const val = fn();
    return typeof val === "number" && isFinite(val) ? val : null;
  } catch {
    return null;
  }
};

const computeInlineArithmetic = (s) =>
  s.replace(/(:\s*)(\(?[\d\s+\-*/().]+\)?)(\s*[,}\]])/g, (m, p1, expr, p3) => {
    if (/^\s*\d+(\.\d+)?\s*$/.test(expr)) return m;
    const computed = evalArithmeticSafely(expr);
    return computed === null ? m : `${p1}${computed}${p3}`;
  });

const tryParseAIJson = (rawText) => {
  if (!rawText || typeof rawText !== "string") return null;
  let s = rawText.trim();
  s = stripCodeFences(s);
  s = normalizeQuotes(s);
  s = computeInlineArithmetic(s);
  s = removeTrailingCommas(s);
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = s.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch (e) {
    console.error("Final JSON.parse failed:", e);
    return null;
  }
};

// Accept both result shapes
const extractItineraryAndBudget = (obj) => {
  if (!obj || typeof obj !== "object") {
    return { itinerary: [], budget: null, startDate: undefined };
  }
  if (obj.tripItinerary) {
    const ti = obj.tripItinerary;
    return {
      itinerary: Array.isArray(ti.itinerary) ? ti.itinerary : [],
      budget: ti.ApproximateTotalBudget ?? ti.Breakdown ?? null,
      startDate: ti.startDate,
    };
  }
  const budget =
    (typeof obj.ApproximateTotalBudget === "object" && obj.ApproximateTotalBudget) ||
    (typeof obj.Breakdown === "object" && obj.Breakdown) ||
    null;
  return {
    itinerary: Array.isArray(obj.itinerary) ? obj.itinerary : [],
    budget,
    startDate: obj.tripDetails?.startDate,
  };
};

// Normalize itinerary (Activities → activities)
const normalizeItinerary = (itinerary) => {
  if (!Array.isArray(itinerary)) return [];
  return itinerary.map((day, idx) => {
    const acts = Array.isArray(day?.activities)
      ? day.activities
      : Array.isArray(day?.Activities)
      ? day.Activities
      : [];
    return {
      Day: day?.Day || `Day ${idx + 1}`,
      activities: acts.map((a) => ({
        PlaceName: a?.PlaceName ?? "",
        PlaceDetails: a?.PlaceDetails ?? "",
        PlaceImageURL: a?.PlaceImageURL ?? "",
        GeoCoordinates: a?.GeoCoordinates ?? null,
        TicketPricing: a?.TicketPricing ?? "",
        TravelTime: a?.TravelTime ?? "",
        HowToTravel: a?.HowToTravel ?? "",
        BestTimeToVisit: a?.BestTimeToVisit ?? "",
      })),
    };
  });
};

// Normalize hotels list: support hotels | budgetHotels and common key variants
const normalizeHotels = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((h) => {
    const lat =
      h?.GeoCoordinates?.latitude ??
      h?.latitude ??
      h?.lat ??
      (typeof h?.GeoCoordinates?.lat === "number" ? h.GeoCoordinates.lat : undefined);
    const lng =
      h?.GeoCoordinates?.longitude ??
      h?.longitude ??
      h?.lng ??
      (typeof h?.GeoCoordinates?.lng === "number" ? h.GeoCoordinates.lng : undefined);
    // Always keep Price as a string like "1234 INR" so existing UI works
    let priceStr = "";
    if (typeof h?.Price === "string") priceStr = h.Price;
    else if (typeof h?.price === "string") priceStr = h.price;
    else if (typeof h?.Price === "number") priceStr = `${h.Price} INR`;
    else if (typeof h?.price === "number") priceStr = `${h.price} INR`;

    return {
      HotelName: h?.HotelName ?? h?.name ?? h?.title ?? "",
      HotelAddress: h?.HotelAddress ?? h?.address ?? "",
      Price: priceStr || "0 INR",
      HotelImageURL: h?.HotelImageURL ?? h?.imageUrl ?? h?.image ?? "",
      GeoCoordinates:
        lat != null && lng != null
          ? { latitude: Number(lat), longitude: Number(lng) }
          : h?.GeoCoordinates || null,
      Rating: h?.Rating ?? h?.rating ?? "",
      Description: h?.Description ?? h?.description ?? "",
    };
  });
};

/* =======================
   Component
   ======================= */

export const ViewTrip = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [itineraryGenerated, setItineraryGenerated] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showFlights, setShowFlights] = useState(false);
  const [showPacking, setShowPacking] = useState(false);
  const [showShopping, setShowShopping] = useState(false);
  const [loadingItinerary, setLoadingItinerary] = useState(false);

  useEffect(() => {
    if (tripId) {
      getTripData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const getTripData = async () => {
    try {
      const docRef = doc(db, "AItrip", tripId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const tripData = docSnap.data();
        console.log("Fetched Trip Data from Firestore:", tripData);

        const normalizedItin = normalizeItinerary(tripData?.tripData?.itinerary);
        const hotelsRaw =
          (Array.isArray(tripData?.tripData?.hotels) && tripData.tripData.hotels) ||
          (Array.isArray(tripData?.tripData?.budgetHotels) && tripData.tripData.budgetHotels) ||
          [];
        const normalizedHotelList = normalizeHotels(hotelsRaw);

        const mergedTrip = {
          id: docSnap.id,
          ...tripData,
          tripData: {
            ...tripData?.tripData,
            itinerary: normalizedItin,
            // ensure hotels are always readable at tripData.hotels
            hotels: normalizedHotelList,
          },
        };

        setTrip(mergedTrip);
        if (mergedTrip.selectedHotel) setSelectedHotel(mergedTrip.selectedHotel);
      } else {
        toast("No trip found");
        setTrip(null);
      }
    } catch (err) {
      console.error("Error fetching trip:", err);
      toast.error("Failed to load trip. Please try again.");
    }
  };

  const handleHotelSelect = (hotel) => {
    setSelectedHotel(hotel);
    saveSelectedHotel(hotel);
  };

  const saveSelectedHotel = async (hotel) => {
    if (!tripId) return;
    try {
      await setDoc(doc(db, "AItrip", tripId), { selectedHotel: hotel }, { merge: true });
      setTrip((prev) => ({ ...prev, selectedHotel: hotel }));
    } catch (err) {
      console.error("Failed to save selected hotel:", err);
      toast.error("Failed to save hotel. Please try again.");
    }
  };

  const safeParseDateISO = (maybeDate) => {
    if (!maybeDate) return null;
    if (maybeDate?.seconds) {
      const d = new Date(maybeDate.seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
    const d =
      typeof maybeDate === "string" ? new Date(maybeDate) : maybeDate instanceof Date ? maybeDate : null;
    return d && !isNaN(d.getTime()) ? d : null;
  };

  const getFormattedStartDate = (userSelection) => {
    const d = safeParseDateISO(userSelection?.startDate);
    return d ? d.toISOString().split("T")[0] : "unspecified date";
  };

  const parseINR = (str) => {
    if (!str) return 0;
    const n = parseInt(String(str).replace(/[^0-9]/g, ""), 10);
    return isNaN(n) ? 0 : n;
  };

  const generateItinerary = async () => {
    if (!selectedHotel) {
      toast.error("Please select a hotel before generating the itinerary.");
      return;
    }

    try {
      setLoadingItinerary(true);
      const { userSelection, tripData } = trip || {};
      const formattedDate = getFormattedStartDate(userSelection);

      const startingGeoCoordinates = selectedHotel?.GeoCoordinates
        ? `${selectedHotel.GeoCoordinates.latitude},${selectedHotel.GeoCoordinates.longitude}`
        : "";

      const prompt = AI_PROMPT_ITINERARY
        .replace("{noOfDays}", String(userSelection?.noOfDays || 3))
        .replace("{people}", userSelection?.people || "1 People")
        .replace("{location}", userSelection?.location?.label || "unknown location")
        .replace("{budget}", String(userSelection?.budget || "Moderate"))
        .replace("{startingGeoCoordinates}", startingGeoCoordinates)
        .replace("{startDate}", formattedDate)
        .replace("{specificPlace}", userSelection?.specificPlace || "none specified");

      const result = await chatSession.sendMessage(prompt);
      const responseText = result?.response?.text();
      console.log("Raw AI Response:", responseText);

      const parsed = tryParseAIJson(responseText);
      if (!parsed) {
        console.error("AI response could not be parsed into JSON. Using empty itinerary.");
      }

      const { itinerary: rawItinerary, budget: rawBudget, startDate: aiStart } =
        extractItineraryAndBudget(parsed || {});
      const itineraryData = normalizeItinerary(rawItinerary);

      const aiActivityTransportCost = Number(rawBudget?.ActivityAndTransportCost) || 0;

      // nights = days - 1 (min 1)
      const days = Number(trip?.userSelection?.noOfDays) || 1;
      const nights = Math.max(1, days - 1);
      const hotelPricePerNight = parseINR(selectedHotel?.Price);
      const calculatedHotelCost = nights * hotelPricePerNight;

      const userBudget = Number(trip?.userSelection?.budget) || 0;
      const remainingBudget = userBudget - calculatedHotelCost;

      let activityTransportCost = aiActivityTransportCost;
      if (remainingBudget > 0 && remainingBudget < activityTransportCost && activityTransportCost > 0) {
        const scaleFactor = remainingBudget / activityTransportCost;
        itineraryData.forEach((day) => {
          day.activities.forEach((activity) => {
            if (
              activity?.TicketPricing &&
              typeof activity.TicketPricing === "string" &&
              !/free/i.test(activity.TicketPricing)
            ) {
              const priceInr = parseINR(activity.TicketPricing);
              const scaled = Math.round(priceInr * scaleFactor);
              activity.TicketPricing = `${scaled} INR`;
            }
          });
        });
        activityTransportCost = remainingBudget;
      } else if (remainingBudget <= 0) {
        activityTransportCost = 0;
      } else {
        activityTransportCost = Math.max(0, aiActivityTransportCost);
      }

      const rawTotal = calculatedHotelCost + activityTransportCost;

      let finalActivityTransportCost = activityTransportCost;
      if (userBudget > 0 && calculatedHotelCost > userBudget) {
        finalActivityTransportCost = 0;
      }

      const displayTotal =
        userBudget > 0
          ? Math.min(calculatedHotelCost + finalActivityTransportCost, userBudget)
          : calculatedHotelCost + finalActivityTransportCost;

      const costBreakdown = {
        HotelCost: calculatedHotelCost,
        ActivityAndTransportCost: finalActivityTransportCost,
      };

      console.log("Normalized Itinerary Data:", itineraryData);
      console.log("Raw Total Budget:", rawTotal);
      console.log("Display Total Budget (capped):", displayTotal);
      console.log("Cost Breakdown:", costBreakdown);

      await setDoc(
        doc(db, "AItrip", tripId),
        {
          tripData: {
            ...tripData,
            itinerary: itineraryData,
            approximateTotalBudget: displayTotal,
            rawTotalBudget: rawTotal,
            costBreakdown,
            budgetCap: userBudget || null,
            hotelNights: nights,
            // Keep hotels present if already saved
            hotels: Array.isArray(tripData?.hotels) ? tripData.hotels : tripData?.hotels ?? [],
          },
          selectedHotel: selectedHotel,
        },
        { merge: true }
      );

      setTrip((prev) => ({
        ...prev,
        tripData: {
          ...prev?.tripData,
          itinerary: itineraryData,
          approximateTotalBudget: displayTotal,
          rawTotalBudget: rawTotal,
          costBreakdown,
          budgetCap: userBudget || null,
          hotelNights: nights,
        },
        selectedHotel,
      }));

      setItineraryGenerated(true);
      setLoadingItinerary(false);

      const startDateForEmail = aiStart || formattedDate;
      const itineraryText = `
Trip Itinerary for ${trip?.userSelection?.location?.label || "Unknown Location"}
Start Date: ${startDateForEmail}
Selected Hotel: ${selectedHotel?.HotelName || "Unknown Hotel"}
Approximate Budget (excluding flights): ₹${displayTotal} INR
Cost Breakdown:
- Hotel Cost: ₹${costBreakdown.HotelCost} INR
- Activities & Transport Cost: ₹${costBreakdown.ActivityAndTransportCost} INR

${itineraryData
  .map(
    (day, index) => `
Day ${index + 1} (${day.Day}):
${(day.activities || [])
  .map(
    (activity) => `
- ${activity.PlaceName || "Unknown"}: ${activity.PlaceDetails || ""}
  Ticket: ${activity.TicketPricing || "N/A"}
  Travel Time: ${activity.TravelTime || "N/A"}
  Best Time to Visit: ${activity.BestTimeToVisit || "N/A"}
  How to Travel: ${activity.HowToTravel || "N/A"}
  Coordinates: ${
    activity?.GeoCoordinates
      ? `Lat ${activity.GeoCoordinates.latitude}, Lon ${activity.GeoCoordinates.longitude}`
      : "N/A"
  }
`
  )
  .join("")}
`
  )
  .join("")}`;

      sendEmail(itineraryText);
    } catch (err) {
      console.error("Failed to generate itinerary:", err);
      setLoadingItinerary(false);
      toast.error("Failed to generate itinerary. Please try again.");
    }
  };

  const sendEmail = (itineraryText) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.email) {
        console.error("No user email found in localStorage");
        return;
      }
      const start = safeParseDateISO(trip?.userSelection?.startDate);
      const startStr = start ? start.toLocaleDateString() : "Unspecified Date";

      const emailData = {
        email: user.email || "",
        tripId: tripId || "",
        destination: trip?.userSelection?.location?.label || "Unknown Destination",
        startDate: startStr,
        itinerary: itineraryText || "No itinerary available",
      };

      emailjs
        .send("service_nue47xc", "template_rbvlgqc", emailData, "v0_0UndGhSgkGDJGb")
        .then(
          (result) => {
            console.log("Email sent successfully!", result.text);
            toast.success("Itinerary email sent successfully!");
          },
          (error) => {
            console.error("Failed to send email. Error details:", error);
            toast.error(`Failed to send itinerary email. Error: ${error.text || error.message}`);
          }
        );
    } catch (err) {
      console.error("sendEmail error:", err);
    }
  };

  const generateFlights = async () => {
    try {
      const { userSelection, tripData } = trip || {};
      const formattedDate = getFormattedStartDate(userSelection);

      const prompt = AI_PROMPT_FLIGHTS
        .replace("{people}", userSelection?.people || "1 People")
        .replace("{fromLocation}", userSelection?.startCity?.label || "unknown start city")
        .replace("{toLocation}", userSelection?.location?.label || "unknown location")
        .replace("{date}", formattedDate)
        .replace("{budget}", String(userSelection?.budget || "unspecified budget"));

      const result = await chatSession.sendMessage(prompt);
      const responseText = result?.response?.text();
      console.log("Raw responseText:", responseText);

      const responseJSON = tryParseAIJson(responseText) || {};
      const asArray = Array.isArray(responseJSON)
        ? responseJSON
        : Array.isArray(responseJSON?.flights)
        ? responseJSON.flights
        : [];

      const flightsArray = asArray.map((flight) => ({
        ...flight,
        BookingURL:
          typeof flight?.BookingURL === "string" && flight.BookingURL.startsWith("http")
            ? flight.BookingURL
            : flight?.BookingURL
            ? `https://${flight.BookingURL}`
            : "",
      }));

      console.log("Normalized flightsArray:", flightsArray);

      await setDoc(
        doc(db, "AItrip", tripId),
        {
          tripData: {
            ...tripData,
            flights: flightsArray,
          },
        },
        { merge: true }
      );

      setTrip((prev) => ({
        ...prev,
        tripData: {
          ...prev?.tripData,
          flights: flightsArray,
        },
      }));
      setShowFlights(true);
    } catch (err) {
      console.error("generateFlights error:", err);
      toast.error("Failed to generate flights. Please try again.");
    }
  };

  const generatePackingList = async () => {
    try {
      const { userSelection, tripData } = trip || {};

      const formattedDate = getFormattedStartDate(userSelection);
      const dateObj = formattedDate !== "unspecified date" ? new Date(formattedDate) : null;
      const month = dateObj ? dateObj.getMonth() + 1 : null;

      const season =
        month && month >= 3 && month <= 5
          ? "spring"
          : month && month >= 6 && month <= 8
          ? "summer"
          : month && month >= 9 && month <= 11
          ? "autumn"
          : "winter";

      const itineraryActivities = Array.isArray(tripData?.itinerary)
        ? tripData.itinerary
            .flatMap((day, index) =>
              (day?.activities || []).map(
                (a) => `Day ${index + 1}: Visit ${a?.PlaceName || "Unknown"} (${a?.PlaceDetails || "No details"})`
              )
            )
            .join(", ")
        : "No itinerary provided";

      console.log("Itinerary Activities for Packing:", itineraryActivities);

      const prompt = AI_PROMPT_PACKING
        .replace("{location}", userSelection?.location?.label || "unknown location")
        .replace("{noOfDays}", String(userSelection?.noOfDays || 3))
        .replace("{startDate}", formattedDate)
        .replace("{season}", season)
        .replace("{itineraryActivities}", itineraryActivities);

      const result = await chatSession.sendMessage(prompt);
      const responseText = result?.response?.text();
      console.log("Raw Packing Response:", responseText);

      const responseJSON = tryParseAIJson(responseText) || {};
      const normalizedPackingList = {};
      if (typeof responseJSON === "object" && responseJSON !== null) {
        Object.keys(responseJSON).forEach((key) => {
          if (key.startsWith("Day")) {
            normalizedPackingList[key] = {
              Clothing: Array.isArray(responseJSON[key]?.Clothing) ? responseJSON[key].Clothing : [],
              Cosmetics: Array.isArray(responseJSON[key]?.Cosmetics) ? responseJSON[key].Cosmetics : [],
              OtherEssentials: Array.isArray(responseJSON[key]?.OtherEssentials)
                ? responseJSON[key].OtherEssentials
                : [],
            };
          }
        });
      } else {
        const days = Number(userSelection?.noOfDays) || 3;
        for (let i = 1; i <= days; i++) {
          normalizedPackingList[`Day ${i}`] = { Clothing: [], Cosmetics: [], OtherEssentials: [] };
        }
      }

      await setDoc(
        doc(db, "AItrip", tripId),
        {
          tripData: {
            ...tripData,
            packingList: normalizedPackingList,
          },
        },
        { merge: true }
      );

      setTrip((prev) => ({
        ...prev,
        tripData: {
          ...prev?.tripData,
          packingList: normalizedPackingList,
        },
      }));
      setShowPacking(true);
    } catch (err) {
      console.error("generatePackingList error:", err);
      toast.error("Failed to generate packing list. Please try again.");
    }
  };

  const handleShowEvents = () => setShowEvents(true);
  const handleShowFlights = () => generateFlights();
  const handleShowPacking = () => generatePackingList();
  const handleShowShopping = () => setShowShopping(true);

  const stableTrip = useMemo(() => trip, [trip]);

  const hotelPricePerNight = parseINR(selectedHotel?.Price);
  const daysForBudget = Number(stableTrip?.userSelection?.noOfDays) || 1;
  const nightsForBudget = Math.max(1, daysForBudget - 1);

  return (
    <div className="container my-4">
      <Card className="border-x-2 p-5">
        <InfoSection trip={stableTrip} />

        {stableTrip && !selectedHotel ? (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Select a Hotel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stableTrip?.tripData?.hotels?.length ? (
                stableTrip.tripData.hotels.map((hotel, index) => (
                  <div
                    key={`${hotel?.HotelName || "hotel"}-${index}`}
                    className="border p-4 rounded-lg cursor-pointer hover:bg-gray-500"
                    onClick={() => handleHotelSelect(hotel)}
                    role="button"
                  >
                    <img
                      src={localHotelImages[index % localHotelImages.length]}
                      alt={hotel?.HotelName || "Hotel"}
                      className="w-full h-40 object-cover rounded"
                      onError={(e) => {
                        console.log(
                          `Image failed to load: ${localHotelImages[index % localHotelImages.length]}`
                        );
                        e.currentTarget.src = "/images/default.jpg";
                      }}
                    />
                    <h3 className="text-lg font-semibold mt-2">{hotel?.HotelName || "Unnamed Hotel"}</h3>
                    <p>{hotel?.HotelAddress || "No address"}</p>
                    <p>{hotel?.Price || "Price N/A"}</p>
                    <p>Rating: {hotel?.Rating ?? "N/A"}</p>
                    <p>{hotel?.Description || ""}</p>
                  </div>
                ))
              ) : (
                <div className="text-gray-400">No hotels found for this trip.</div>
              )}
            </div>
          </div>
        ) : selectedHotel && !itineraryGenerated ? (
          <>
            <div className="mt-6 p-6 bg-gray-800 rounded-lg shadow-xl">
              <h2 className="text-2xl font-bold mb-4 text-white">Your Selected Hotel</h2>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <img
                    src={localHotelImages[0]}
                    alt={selectedHotel?.HotelName || "Selected Hotel"}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      console.log(`Image failed to load: ${localHotelImages[0]}`);
                      e.currentTarget.src = "/images/default.jpg";
                    }}
                  />
                </div>
                <div className="md:w-2/3 space-y-3">
                  <h3 className="text-xl font-semibold text-white">{selectedHotel?.HotelName || "Unnamed Hotel"}</h3>
                  <p className="text-gray-300">{selectedHotel?.HotelAddress || "No address"}</p>
                  <p className="text-green-400 font-semibold">{selectedHotel?.Price || "Price N/A"}</p>
                  <p className="text-yellow-400">
                    Rating: {selectedHotel?.Rating ?? "N/A"} <span aria-hidden>⭐</span>
                  </p>
                  <p className="text-gray-400">{selectedHotel?.Description || ""}</p>
                </div>
              </div>
            </div>
            <button
              onClick={generateItinerary}
              className="bg-blue-700 text-white px-4 py-2 rounded mt-4 hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loadingItinerary}
            >
              {loadingItinerary ? "Generating..." : "Generate Itinerary"}
            </button>
          </>
        ) : itineraryGenerated ? (
          <>
            <div className="mt-6 p-6 bg-gray-800 rounded-lg shadow-xl">
              <h2 className="text-2xl font-bold mb-4 text-white">Your Selected Hotel</h2>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <img
                    src={localHotelImages[0]}
                    alt={selectedHotel?.HotelName || "Selected Hotel"}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      console.log(`Image failed to load: ${localHotelImages[0]}`);
                      e.currentTarget.src = "/images/default.jpg";
                    }}
                  />
                </div>
                <div className="md:w-2/3 space-y-3">
                  <h3 className="text-xl font-semibold text-white">{selectedHotel?.HotelName || "Unnamed Hotel"}</h3>
                  <p className="text-gray-300">{selectedHotel?.HotelAddress || "No address"}</p>
                  <p className="text-green-400 font-semibold">{selectedHotel?.Price || "Price N/A"}</p>
                  <p className="text-yellow-400">
                    Rating: {selectedHotel?.Rating ?? "N/A"} <span aria-hidden>⭐</span>
                  </p>
                  <p className="text-gray-400">{selectedHotel?.Description || ""}</p>
                </div>
              </div>
            </div>

            <Itinerary trip={stableTrip} />

            <div className="mt-6">
              <Map trip={stableTrip} />
            </div>

            <div className="mt-4">
              <p className="text-lg font-semibold text-blue-800 dark:text-customGreen">
                Approximate Total Budget (excluding flights): ₹{stableTrip?.tripData?.approximateTotalBudget || 0} INR
              </p>

              {stableTrip?.tripData?.budgetCap &&
                Number(stableTrip?.tripData?.rawTotalBudget) >
                  Number(stableTrip?.tripData?.budgetCap) && (
                  <p className="text-sm text-amber-400 mt-1">
                    Note: Actual computed cost is ₹
                    {Number(stableTrip.tripData.rawTotalBudget).toLocaleString()} but capped to your budget of ₹
                    {Number(stableTrip.tripData.budgetCap).toLocaleString()}.
                  </p>
                )}

              <div className="mt-3 text-gray-300">
                <p>Cost Breakdown:</p>
                <ul className="list-disc pl-5">
                  <li>
                    Hotel Cost ({nightsForBudget} night{nightsForBudget > 1 ? "s" : ""} x ₹{hotelPricePerNight} per
                    night): ₹{stableTrip?.tripData?.costBreakdown?.HotelCost || 0} INR
                  </li>
                  <li>
                    Activities &amp; Transport Cost: ₹
                    {stableTrip?.tripData?.costBreakdown?.ActivityAndTransportCost || 0} INR
                  </li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-white">Loading hotels...</p>
        )}

        <div className="mt-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleShowEvents}
              className="bg-customGreen text-white px-4 py-2 rounded mt-4 hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!itineraryGenerated}
            >
              Show Local Events
            </button>
            <button
              onClick={handleShowFlights}
              className="bg-blue-700 text-white px-4 py-2 rounded mt-4 hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!itineraryGenerated}
            >
              Show Flights
            </button>
            <button
              onClick={handleShowPacking}
              className="bg-purple-700 text-white px-4 py-2 rounded mt-4 hover:bg-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!itineraryGenerated}
            >
              Packing Details
            </button>
            <button
              onClick={handleShowShopping}
              className="bg-purple-700 text-white px-4 py-2 rounded mt-4 hover:bg-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!itineraryGenerated}
            >
              Shopping Sites
            </button>
            {itineraryGenerated && (
              <div className="mt-4">
                <PdfMaker trip={trip} selectedHotel={selectedHotel} />
              </div>
            )}
          </div>
        </div>
      </Card>

      {stableTrip ? (
        <Chatbot tripId={stableTrip.id} destination={stableTrip?.userSelection?.location?.label} />
      ) : (
        <div className="fixed bottom-5 right-5 bg-white p-4 shadow-lg rounded-xl">
          <p>Loading trip data...</p>
        </div>
      )}

      {showEvents && stableTrip && (
        <div className="mt-6">
          <EventList
            location={stableTrip?.userSelection?.location?.label}
            startDate={stableTrip?.userSelection?.startDate}
            noOfDays={stableTrip?.userSelection?.noOfDays}
          />
        </div>
      )}

      {showFlights && stableTrip && (
        <div className="mt-6">
          <Flights trip={stableTrip} />
        </div>
      )}

      {showPacking && stableTrip && (
        <div className="mt-6">
          <Packing trip={stableTrip} />
        </div>
      )}

      {showShopping && stableTrip && (
        <div className="mt-6">
          <Shopping trip={stableTrip} tripId={tripId} />
        </div>
      )}
    </div>
  );
};

export default ViewTrip;
