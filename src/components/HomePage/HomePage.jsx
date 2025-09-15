import React, { useEffect, useState, useCallback } from "react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { chatSession } from "@/services/AImodel";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AI_PROMPT_HOTELS,
  AI_PROMPT_RECOMMENDATIONS,
  TripMoodOptions,
  SelectTravelerList,
  CityBudgets,
} from "@/constants/options";
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/services/fireBaseConfig";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Slider from "react-slider";
import { FaRupeeSign } from "react-icons/fa";
import { GetPlaceDetails } from "@/services/GlobalAPI";

/* ============
   JSON helpers
   ============ */

const stripCodeFences = (s) => s.replace(/^\s*```[\s\S]*?\n?|\n?```$/g, "").trim();
const normalizeQuotes = (s) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
const removeTrailingCommas = (s) => s.replace(/,\s*([\]}])/g, "$1");
const evalArithmeticSafely = (expr) => {
  if (!/^[\d\s+\-*/().]+$/.test(expr)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${expr});`);
    const v = fn();
    return typeof v === "number" && isFinite(v) ? v : null;
  } catch {
    return null;
  }
};
const computeInlineArithmetic = (s) =>
  s.replace(/(:\s*)(\(?[\d\s+\-*/().]+\)?)(\s*[,}\]])/g, (m, p1, expr, p3) => {
    if (/^\s*\d+(\.\d+)?\s*$/.test(expr)) return m;
    const val = evalArithmeticSafely(expr);
    return val === null ? m : `${p1}${val}${p3}`;
  });

const tryParseAIJson = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();
  s = stripCodeFences(s);
  s = normalizeQuotes(s);
  s = computeInlineArithmetic(s);
  s = removeTrailingCommas(s);
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch (e) {
    console.error("JSON.parse failed:", e);
    return null;
  }
};

/* =================
   Hotels normalizer
   ================= */

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

export const HomePage = () => {
  const [place, setPlace] = useState(null);
  const [startCity, setStartCity] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [formData, setFormData] = useState({
    noOfDays: 0,
    location: null,
    budget: 0,
    people: "",
    startCity: null,
    startDate: new Date(),
    mood: "",
    specificPlace: "",
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approxBudget, setApproxBudget] = useState(null);
  const [budget, setBudget] = useState(0);
  const [specificPlace, setSpecificPlace] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [recommendedDestinations, setRecommendedDestinations] = useState([]);
  const [photoUrls, setPhotoUrls] = useState({});

  const navigate = useNavigate();

  const PHOTO_REF_URL =
    "https://places.googleapis.com/v1/{NAME}/media?maxHeightPx=1000&maxWidthPx=1000&key=" +
    import.meta.env.VITE_GOOGLE_PLACE_APIKEY;

  const handleInputChanges = useCallback((name, value) => {
    const processedValue =
      name === "budget"
        ? parseInt(value, 10) || 0
        : name === "location" || name === "startCity"
        ? value
        : value || "";

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    if (name === "location" || name === "startCity") {
      updateApproxBudget(processedValue);
    }
    if (name === "specificPlace") {
      setSpecificPlace(value);
    }
    if (name === "mood") {
      setSelectedMood(value);
    }
  }, []);

  const updateApproxBudget = (value) => {
    const city = value?.label || value;
    if (CityBudgets[city]) {
      setApproxBudget(CityBudgets[city]);
      if (formData.budget === 0) {
        handleInputChanges("budget", CityBudgets[city].moderate);
        setBudget(CityBudgets[city].moderate);
      }
    } else {
      setApproxBudget(null);
    }
  };

  useEffect(() => {
    const fetchUserTripsAndRecommendations = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        navigate("/create-trip");
        return;
      }

      try {
        const q = query(collection(db, "AItrip"), where("userEmail", "==", user.email));
        const querySnapshot = await getDocs(q);
        const trips = [];
        querySnapshot.forEach((doc) => {
          trips.push({ id: doc.id, ...doc.data() });
        });

        if (trips.length > 0) {
          let recommendations = trips[0].recommendedDestinations || [];
          if (!recommendations.length) {
            const pastTrips = trips.map((trip) => ({
              location: trip.userSelection?.location?.label,
              budget: trip.userSelection?.budget,
              travelers: trip.userSelection?.people,
              days: trip.userSelection?.noOfDays,
            }));
            const prompt = AI_PROMPT_RECOMMENDATIONS
              .replace("{pastTrips}", JSON.stringify(pastTrips))
              .replace("{pastLocations}", pastTrips.map((t) => t.location).join(", "))
              .replace("{pastBudgets}", pastTrips.map((t) => t.budget).join(", "))
              .replace("{pastTravelers}", pastTrips.map((t) => t.travelers).join(", "))
              .replace("{pastDays}", pastTrips.map((t) => t.days).join(", "));

            const result = await chatSession.sendMessage(prompt);
            const recText = result?.response?.text();
            const parsed = tryParseAIJson(recText);
            recommendations = parsed?.RecommendedDestinations || [];
            const tripRef = doc(db, "AItrip", trips[0].id);
            await updateDoc(tripRef, { recommendedDestinations: recommendations });
          }
          setRecommendedDestinations(recommendations);

          recommendations.forEach((dest) => {
            if (dest.DestinationName) {
              fetchDestinationPhotos(dest.DestinationName);
            }
          });
        }
      } catch (error) {
        console.error("Error fetching trips or generating recommendations:", error);
      }
    };

    fetchUserTripsAndRecommendations();
  }, [navigate]);

  const fetchDestinationPhotos = async (destination) => {
    const data = { textQuery: destination };
    try {
      const result = await GetPlaceDetails(data);
      const photoUrl = PHOTO_REF_URL.replace("{NAME}", result.data.places[0].photos[4].name);
      setPhotoUrls((prev) => ({ ...prev, [destination]: photoUrl }));
    } catch (error) {
      console.error(`Error fetching photos for ${destination}:`, error);
      setPhotoUrls((prev) => ({ ...prev, [destination]: "/trip.jpg" }));
    }
  };

  const onGenerateTrip = async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      setOpenDialog(true);
      return;
    }

    if (
      !formData.noOfDays ||
      formData.noOfDays > 15 ||
      formData.noOfDays < 1 ||
      !formData.location ||
      !formData.budget ||
      !formData.people ||
      !formData.startCity ||
      !formData.startDate
    ) {
      toast("Please fill all required details!");
      return;
    }

    setLoading(true);
    toast("Patience is a virtue, and awesome things take time. We'll get you there soon!");

    const FINAL_PROMPT = AI_PROMPT_HOTELS
      .replace("{people}", formData.people)
      .replace("{location}", formData.location.label)
      .replace("{budget}", formData.budget)
      .replace("{mood}", selectedMood || "relaxed");

    try {
      const result = await chatSession.sendMessage(FINAL_PROMPT);
      const responseText = result?.response?.text();
      console.log("Raw AI Response for Hotels:", responseText);

      const parsed = tryParseAIJson(responseText);
      if (!parsed) {
        throw new Error("Could not parse AI response for hotels");
      }

      // Merge possible keys -> unified hotels list
      const hotelsRaw = parsed.hotels || parsed.budgetHotels || parsed.Hotels || [];
      const hotels = normalizeHotels(hotelsRaw);

      setLoading(false);
      await saveAiTrip(hotels);
    } catch (error) {
      console.error("Error generating trip:", error);
      setLoading(false);
      toast.error("Failed to generate trip. Please try again.");
    }
  };

  // Save normalized hotels into Firestore at tripData.hotels (always populated)
  const saveAiTrip = async (hotels) => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user"));
    const docId = Date.now().toString();
    try {
      await setDoc(doc(db, "AItrip", docId), {
        userSelection: {
          ...formData,
          specificPlace: specificPlace || "",
          mood: selectedMood || "",
        },
        tripData: {
          hotels, // normalized list ensures ViewTrip can render
        },
        userEmail: user?.email,
        id: docId,
      });
      setLoading(false);
      navigate("/view-trip/" + docId);
    } catch (error) {
      console.error("Error saving trip to Firestore:", error);
      setLoading(false);
      toast.error("Failed to save trip. Please try again.");
    }
  };

  const handleKeyDown = (event) => {
    if (event.keyCode === 38 || event.keyCode === 40) {
      event.preventDefault();
    }
  };

  return (
    <div className="w-full overflow-hidden px-3 md:px-16 lg:px-24 xl:px-48 font-serif bg-gray-900 text-white min-h-screen">
      <Card className="mt-12 shadow-2xl bg-gray-800 border-none rounded-2xl p-8">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-center text-white tracking-wide">
            Please Share Your Travel Preferences with Us 🏕🌴
          </CardTitle>
          <CardDescription className="pt-6 pb-4 text-center md:text-left font-light text-lg tracking-normal text-gray-300">
            Simply provide some basic information, and our trip planner will create a personalized itinerary tailored to your preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-8">
            <div className="grid gap-8">
              <div className="space-y-4">
                <Label htmlFor="startCity" className="text-xl font-medium text-green-400">
                  What is your start city?
                </Label>
                <div className="dark:text-slate-800 border-2 border-green-500 bg-gray-700 rounded-lg shadow-md">
                  <GooglePlacesAutocomplete
                    apiKey={import.meta.env.VITE_GOOGLE_PLACE_APIKEY}
                    selectProps={{
                      startCity,
                      onChange: (val) => {
                        setStartCity(val);
                        handleInputChanges("startCity", val);
                      },
                      placeholder: "Search for your start city...",
                      isClearable: true,
                    }}
                    className="text-black"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="name" className="text-xl font-medium text-green-400">
                  What is your preferred destination?
                </Label>
                <div className="dark:text-slate-800 border-2 border-green-500 bg-gray-700 rounded-lg shadow-md">
                  <GooglePlacesAutocomplete
                    apiKey={import.meta.env.VITE_GOOGLE_PLACE_APIKEY}
                    selectProps={{
                      place,
                      onChange: (val) => {
                        setPlace(val);
                        handleInputChanges("location", val);
                      },
                      placeholder: "Search for your destination...",
                      isClearable: true,
                    }}
                    className="text-black"
                  />
                </div>
              </div>

              {approxBudget && (
                <div className="space-y-4">
                  <Label htmlFor="approxBudget" className="text-xl font-medium text-green-400">
                    Approximate Budget
                  </Label>
                  <div className="p-4 bg-gray-700 rounded-lg shadow-md text-white">
                    <p>Low-cost: {approxBudget.low} INR</p>
                    <p>Moderate: {approxBudget.moderate} INR</p>
                    <p>Luxury: {approxBudget.luxury} INR</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Label htmlFor="days" className="text-xl font-medium text-green-400">
                  How many days do you plan to spend on your trip?
                </Label>
                <Input
                  id="days"
                  type="number"
                  placeholder="Ex. 3"
                  min="1"
                  max="15"
                  value={formData.noOfDays || ""}
                  onChange={(e) => handleInputChanges("noOfDays", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="border-2 border-green-500 bg-gray-700 text-white placeholder-gray-400 rounded-lg shadow-md focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="startDate" className="text-xl font-medium text-green-400">
                  When do you plan to start your trip?
                </Label>
                <DatePicker
                  selected={formData.startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    handleInputChanges("startDate", date);
                  }}
                  minDate={new Date()}
                  className="w-full border-2 border-green-500 bg-gray-700 text-white placeholder-gray-400 rounded-lg shadow-md p-2 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select start date"
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="budget" className="text-xl font-medium text-green-400">
                  What's your spending limit? (Excluding Flights)
                </Label>
                <div className="p-4 bg-gray-700 rounded-lg shadow-md">
                  <Slider
                    className="w-full h-4 mt-2"
                    thumbClassName="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
                    trackClassName="h-2 bg-gray-500 rounded-full"
                    value={budget}
                    min={approxBudget ? approxBudget.low : 0}
                    max={approxBudget ? approxBudget.luxury : 100000}
                    onChange={(value) => {
                      setBudget(value);
                      handleInputChanges("budget", value);
                    }}
                    renderThumb={(props) => (
                      <div {...props}>
                        <FaRupeeSign className="text-white" />
                      </div>
                    )}
                  />
                  <div className="text-white mt-4 text-lg font-medium">
                    Selected Budget: {budget} INR
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="noOfPeople" className="text-xl font-medium text-green-400">
                  Who are you planning to travel with on your next adventure?
                </Label>
                <div className="grid grid-cols-2 gap-4 mt-6 cursor-pointer text-lg items-center">
                  {SelectTravelerList.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleInputChanges("people", item.people)}
                      className={`p-4 border-2 border-green-500 bg-gray-700 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 ${
                        formData.people === item.people ? "shadow-xl border-green-600 bg-gray-600" : ""
                      }`}
                    >
                      <h2 className="font-bold text-white">
                        <span className="text-2xl text-green-400">{item.icon}</span> {item.title}
                      </h2>
                      <h2 className="text-gray-300 mt-2">{item.des}</h2>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="specificPlace" className="text-xl font-medium text-green-400">
                  Any specific place you want to add to the itinerary? (Optional)
                </Label>
                <Input
                  id="specificPlace"
                  type="text"
                  placeholder="Enter a specific place"
                  value={specificPlace}
                  onChange={(e) => handleInputChanges("specificPlace", e.target.value)}
                  className="border-2 border-green-500 bg-gray-700 text-white placeholder-gray-400 rounded-lg shadow-md focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="tripMood" className="text-xl font-medium text-green-400">
                  What kind of mood are you looking for in this trip?
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {TripMoodOptions.map((mood, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedMood(mood.value);
                        handleInputChanges("mood", mood.value);
                      }}
                      className={`p-4 border-2 border-green-500 bg-gray-700 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer ${
                        formData.mood === mood.value ? "shadow-xl border-green-600 bg-gray-600" : ""
                      }`}
                    >
                      <div className="text-center">
                        <span className="text-3xl mb-2 text-green-400">{mood.icon}</span>
                        <h3 className="text-lg font-semibold text-white">{mood.title}</h3>
                        <p className="text-sm text-gray-300 mt-1">{mood.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end mt-8">
          <Button
            disabled={loading}
            onClick={onGenerateTrip}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-xl font-semibold"
          >
            {loading ? <AiOutlineLoading3Quarters className="h-6 w-6 animate-spin" /> : "Generate Trip"}
          </Button>
        </CardFooter>
      </Card>

      {/* Recommended Destinations Section */}
      <Card className="mt-12 border-y-2 p-5 bg-gray-800 rounded-2xl shadow-lg">
        <h2 className="font-bold text-lg sm:text-lg md:text-2xl mt-7 md:mt-10 lg:mt-16 mb-2 text-blue-800 dark:text-customGreen text-center">
          🌟 Recommended Destinations 🌟
        </h2>
        {recommendedDestinations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 text-justify gap-3 md:gap-6 xl:gap-6 mt-4">
            {recommendedDestinations.map((dest, index) => {
              const destinationName = dest.DestinationName || "Unknown Destination";
              return (
                <div
                  key={index}
                  className="text-sm lg:text-base hover:scale-105 transition-all mb-2 border-[1px] md:border-2 dark:border-customGreen border-blue-700 rounded-lg px-2 bg-gray-700 cursor-pointer"
                  onClick={() => {
                    if (!dest.DestinationName) {
                      toast("Invalid destination name. Please try another.");
                      console.error("Invalid DestinationName:", dest);
                      return;
                    }
                    navigate(`/trip-details/${destinationName}`);
                  }}
                >
                  <img
                    src={photoUrls[destinationName] || "/trip.jpg"}
                    alt={destinationName}
                    className="h-48 w-full object-cover rounded-t-lg"
                    onError={(e) => (e.currentTarget.src = "/trip.jpg")}
                  />
                  <h3 className="font-semibold text-sm md:text-lg mt-2 text-white">{destinationName}</h3>
                  <p className="text-white mt-1">
                    <strong>Why:</strong> {dest.ReasonForRecommendation || "N/A"}
                  </p>
                  <p className="text-white mt-1">
                    <strong>Days:</strong> {dest.SuggestedNoOfDays || "N/A"}
                  </p>
                  <p className="text-white mt-1">
                    <strong>Budget:</strong> ₹{dest.SuggestedBudget || "N/A"} INR
                  </p>
                  <p className="text-white mt-1 mb-2">
                    <strong>For:</strong> {dest.SuggestedTravelerType || "N/A"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-300 mt-4">
            No recommended destinations available yet. Take a trip to get started!
          </p>
        )}
      </Card>
    </div>
  );
};

export default HomePage;
