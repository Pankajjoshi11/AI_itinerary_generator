import { db } from "@/services/fireBaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { InfoSection } from "../components/Trip/InfoSection";
import { Hotels } from "../components/Trip/Hotels";
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
    }, [tripId]);

    const getTripData = async () => {
        const docRef = doc(db, "AItrip", tripId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const tripData = docSnap.data();
            console.log("Fetched Trip Data from Firestore:", tripData);
            setTrip({ id: docSnap.id, ...tripData });
            if (tripData.selectedHotel) {
                setSelectedHotel(tripData.selectedHotel);
            }
        } else {
            toast("No trip found");
            setTrip(null);
        }
    };

    const handleHotelSelect = (hotel) => {
        setSelectedHotel(hotel);
        saveSelectedHotel(hotel);
    };

    const saveSelectedHotel = async (hotel) => {
        if (tripId) {
            await setDoc(
                doc(db, "AItrip", tripId),
                { selectedHotel: hotel },
                { merge: true }
            );
            setTrip((prev) => ({
                ...prev,
                selectedHotel: hotel,
            }));
        }
    };

    const generateItinerary = async () => {
        if (!selectedHotel) {
            toast.error("Please select a hotel before generating the itinerary.");
            return;
        }

        setLoadingItinerary(true);
        const { userSelection, tripData } = trip;
        let formattedDate;
        if (userSelection?.startDate) {
            let dateObj;
            if (userSelection.startDate.seconds) {
                dateObj = new Date(userSelection.startDate.seconds * 1000);
            } else if (typeof userSelection.startDate === "string") {
                dateObj = new Date(userSelection.startDate);
            } else if (userSelection.startDate instanceof Date) {
                dateObj = userSelection.startDate;
            }
            formattedDate = dateObj && !isNaN(dateObj.getTime())
                ? dateObj.toISOString().split("T")[0]
                : "unspecified date";
        } else {
            formattedDate = "unspecified date";
        }

        const hotelName = selectedHotel?.HotelName || "Unknown Hotel";
        const startingGeoCoordinates = selectedHotel?.GeoCoordinates
            ? `${selectedHotel.GeoCoordinates.latitude},${selectedHotel.GeoCoordinates.longitude}`
            : "";

        const prompt = AI_PROMPT_ITINERARY
            .replace("{noOfDays}", userSelection?.noOfDays || "3")
            .replace("{people}", userSelection?.people || "1 People")
            .replace("{location}", userSelection?.location?.label || "unknown location")
            .replace("{budget}", userSelection?.budget || "Moderate")
            .replace("{startingGeoCoordinates}", startingGeoCoordinates)
            .replace("{startDate}", formattedDate)
            .replace("{specificPlace}", userSelection?.specificPlace || "none specified");

        const result = await chatSession.sendMessage(prompt);
        const responseText = result?.response?.text();
        console.log("Raw AI Response:", responseText);

        let responseJSON;
        try {
            responseJSON = JSON.parse(responseText);
            console.log("Parsed AI Response:", responseJSON);
        } catch (e) {
            console.error("Parsing error:", e);
            responseJSON = { 
                tripItinerary: { 
                    itinerary: [], 
                    ApproximateTotalBudget: { HotelCost: 0, ActivityAndTransportCost: 0, Breakdown: { HotelCost: 0, ActivityAndTransportCost: 0 }, Total: 0 } 
                } 
            };
        }

        const tripItinerary = responseJSON.tripItinerary || {};
        const itineraryData = tripItinerary.itinerary || [];
        const budgetData = tripItinerary.ApproximateTotalBudget || { HotelCost: 0, ActivityAndTransportCost: 0, Breakdown: { HotelCost: 0, ActivityAndTransportCost: 0 }, Total: 0 };
        const aiHotelCost = budgetData.HotelCost || 0;
        const aiActivityTransportCost = budgetData.ActivityAndTransportCost || 0;
        const aiTotalBudget = budgetData.Total || (aiHotelCost + aiActivityTransportCost);

        // Calculate hotel cost using selectedHotel.Price (allow exceeding budget)
        const hotelPricePerNight = parseInt(selectedHotel.Price.replace(/[^0-9]/g, "")) || 0;
        const calculatedHotelCost = userSelection.noOfDays * hotelPricePerNight;

        // Calculate remaining budget for activities and transport (can be negative or exceed)
        const userBudget = userSelection.budget || 0;
        const remainingBudget = userBudget - calculatedHotelCost;

        // Adjust activity and transport costs based on AI suggestion or remaining budget
        let activityTransportCost = aiActivityTransportCost;
        if (remainingBudget < activityTransportCost && remainingBudget > 0) {
            const scaleFactor = remainingBudget / activityTransportCost;
            itineraryData.forEach((day) => {
                day.activities.forEach((activity) => {
                    if (activity.TicketPricing && activity.TicketPricing !== "Free") {
                        const price = parseInt(activity.TicketPricing.replace(" INR", ""));
                        activity.TicketPricing = `${Math.round(price * scaleFactor)} INR`;
                    }
                });
            });
            activityTransportCost = remainingBudget;
        } else {
            activityTransportCost = Math.max(0, aiActivityTransportCost); // Ensure non-negative
        }

        const adjustedTotalBudget = calculatedHotelCost + activityTransportCost;
        const costBreakdown = {
            HotelCost: calculatedHotelCost,
            ActivityAndTransportCost: activityTransportCost,
        };

        console.log("Itinerary Data:", itineraryData);
        console.log("Adjusted Total Budget:", adjustedTotalBudget);
        console.log("Cost Breakdown:", costBreakdown);

        await setDoc(
            doc(db, "AItrip", tripId),
            {
                tripData: {
                    ...tripData,
                    itinerary: itineraryData,
                    approximateTotalBudget: adjustedTotalBudget,
                    costBreakdown: costBreakdown,
                },
                selectedHotel: selectedHotel,
            },
            { merge: true }
        );

        setTrip((prev) => {
            const newTrip = {
                ...prev,
                tripData: {
                    ...prev.tripData,
                    itinerary: itineraryData,
                    approximateTotalBudget: adjustedTotalBudget,
                    costBreakdown: costBreakdown,
                },
                selectedHotel: selectedHotel,
            };
            console.log("Updated Trip State:", newTrip);
            return newTrip;
        });
        setItineraryGenerated(true);
        setLoadingItinerary(false);

        const startDate = tripItinerary.startDate || formattedDate;
        const itineraryText = `
Trip Itinerary for ${userSelection?.location?.label || "Unknown Location"}
Start Date: ${startDate}
Selected Hotel: ${selectedHotel?.HotelName || "Not specified"}
Approximate Budget (excluding flights): ₹${adjustedTotalBudget} INR
Cost Breakdown:
- Hotel Cost: ₹${costBreakdown.HotelCost} INR
- Activities & Transport Cost: ₹${costBreakdown.ActivityAndTransportCost} INR

${itineraryData.map((day, index) => `
Day ${index + 1} (${day.Day}, ${startDate.split("-")[1]}/${startDate.split("-")[2]}/${startDate.split("-")[0]}):
${day.activities.map(activity => `
- ${activity.PlaceName}: ${activity.PlaceDetails}
  Ticket: ${activity.TicketPricing}
  Travel Time: ${activity.TravelTime}
  Best Time to Visit: ${activity.BestTimeToVisit}
  How to Travel: ${activity.HowToTravel}
  Coordinates: Lat ${activity.GeoCoordinates.latitude}, Lon ${activity.GeoCoordinates.longitude}
`).join("")}
`).join("")}`;

        sendEmail(itineraryText);
    };

    const sendEmail = (itineraryText) => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.email) {
            console.error("No user email found in localStorage");
            return;
        }

        const emailData = {
            email: user.email || "",
            tripId: tripId || "",
            destination: trip?.userSelection?.location?.label || "Unknown Destination",
            startDate: trip?.userSelection?.startDate 
                ? new Date(trip.userSelection.startDate.seconds * 1000).toLocaleDateString() || "Unspecified Date"
                : "Unspecified Date",
            itinerary: itineraryText || "No itinerary available"
        };

        emailjs.send(
            "service_nue47xc",
            "template_rbvlgqc",
            emailData,
            "v0_0UndGhSgkGDJGb"
        )
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
    };

    const generateFlights = async () => {
        const { userSelection, tripData } = trip;
        let formattedDate;
        if (userSelection?.startDate) {
            let dateObj;
            if (userSelection.startDate.seconds) {
                dateObj = new Date(userSelection.startDate.seconds * 1000);
            } else if (typeof userSelection.startDate === "string") {
                dateObj = new Date(userSelection.startDate);
            } else if (userSelection.startDate instanceof Date) {
                dateObj = userSelection.startDate;
            }
            formattedDate = dateObj && !isNaN(dateObj.getTime())
                ? dateObj.toISOString().split("T")[0]
                : "unspecified date";
        } else {
            formattedDate = "unspecified date";
        }

        const prompt = AI_PROMPT_FLIGHTS
            .replace("{people}", userSelection?.people || "1 People")
            .replace("{fromLocation}", userSelection?.startCity?.label || "unknown start city")
            .replace("{toLocation}", userSelection?.location?.label || "unknown location")
            .replace("{date}", formattedDate)
            .replace("{budget}", userSelection?.budget || "unspecified budget");

        const result = await chatSession.sendMessage(prompt);
        const responseText = result?.response?.text();
        console.log("Raw responseText:", responseText);

        let responseJSON;
        try {
            responseJSON = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse responseText:", e);
            responseJSON = [];
        }

        const flightsArray = Array.isArray(responseJSON)
            ? responseJSON.map(flight => ({
                ...flight,
                BookingURL: flight.BookingURL.startsWith("http")
                    ? flight.BookingURL
                    : `https://${flight.BookingURL}`
            }))
            : responseJSON?.flights && Array.isArray(responseJSON.flights)
            ? responseJSON.flights.map(flight => ({
                ...flight,
                BookingURL: flight.BookingURL.startsWith("http")
                    ? flight.BookingURL
                    : `https://${flight.BookingURL}`
            }))
            : [];

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
                ...prev.tripData,
                flights: flightsArray,
            },
        }));
        setShowFlights(true);
    };

    const generatePackingList = async () => {
        const { userSelection, tripData } = trip;

        let formattedDate;
        if (userSelection?.startDate) {
            let dateObj;
            if (userSelection.startDate.seconds) {
                dateObj = new Date(userSelection.startDate.seconds * 1000);
            } else if (typeof userSelection.startDate === "string") {
                dateObj = new Date(userSelection.startDate);
            } else if (userSelection.startDate instanceof Date) {
                dateObj = userSelection.startDate;
            }
            formattedDate = dateObj && !isNaN(dateObj.getTime())
                ? dateObj.toISOString().split("T")[0]
                : "unspecified date";
        } else {
            formattedDate = "unspecified date";
        }

        const month = new Date(formattedDate).getMonth() + 1;
        const season = 
            month >= 3 && month <= 5 ? "spring" :
            month >= 6 && month <= 8 ? "summer" :
            month >= 9 && month <= 11 ? "autumn" :
            "winter";

        const itineraryActivities = tripData?.itinerary
            ? tripData.itinerary.map((day, index) => 
                `Day ${index + 1}: Visit ${day.PlaceName} (${day.PlaceDetails})`
              ).join(", ")
            : "No itinerary provided";

        console.log("Itinerary Activities for Packing:", itineraryActivities);

        const prompt = AI_PROMPT_PACKING
            .replace("{location}", userSelection?.location?.label || "unknown location")
            .replace("{noOfDays}", userSelection?.noOfDays || "3")
            .replace("{startDate}", formattedDate)
            .replace("{season}", season)
            .replace("{itineraryActivities}", itineraryActivities);

        const result = await chatSession.sendMessage(prompt);
        const responseText = result?.response?.text();
        console.log("Raw Packing Response:", responseText);

        let responseJSON;
        try {
            responseJSON = JSON.parse(responseText);
            console.log("Parsed Packing Response:", responseJSON);
        } catch (e) {
            console.error("Parsing error for packing list:", e);
            responseJSON = {};
        }

        const normalizedPackingList = {};
        if (typeof responseJSON === "object" && responseJSON !== null) {
            Object.keys(responseJSON).forEach(key => {
                if (key.startsWith("Day")) {
                    normalizedPackingList[key] = {
                        Clothing: Array.isArray(responseJSON[key]?.Clothing) ? responseJSON[key].Clothing : [],
                        Cosmetics: Array.isArray(responseJSON[key]?.Cosmetics) ? responseJSON[key].Cosmetics : [],
                        OtherEssentials: Array.isArray(responseJSON[key]?.OtherEssentials) ? responseJSON[key].OtherEssentials : []
                    };
                }
            });
        } else {
            console.warn("Unexpected packing list format:", responseJSON);
            for (let i = 1; i <= (userSelection?.noOfDays || 3); i++) {
                normalizedPackingList[`Day ${i}`] = {
                    Clothing: [],
                    Cosmetics: [],
                    OtherEssentials: []
                };
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
                ...prev.tripData,
                packingList: normalizedPackingList,
            },
        }));
        setShowPacking(true);
    };

    const handleShowEvents = () => {
        setShowEvents(true);
    };

    const handleShowFlights = () => {
        generateFlights();
    };

    const handleShowPacking = () => {
        generatePackingList();
    };

    const handleShowShopping = () => {
        setShowShopping(true);
    };

    const stableTrip = useMemo(() => trip, [trip]);

    return (
        <div className="container my-4">
            <Card className="border-x-2 p-5">
                <InfoSection trip={stableTrip} />

                {stableTrip && !selectedHotel ? (
                    <div className="mt-6">
                        <h2 className="text-xl font-bold mb-4">Select a Hotel</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stableTrip.tripData?.hotels?.map((hotel, index) => (
                                <div
                                    key={index}
                                    className="border p-4 rounded-lg cursor-pointer hover:bg-gray-500"
                                    onClick={() => handleHotelSelect(hotel)}
                                >
                                    <img
                                        src={localHotelImages[index % localHotelImages.length]}
                                        alt={hotel.HotelName}
                                        className="w-full h-40 object-cover rounded"
                                        onError={(e) => {
                                            console.log(`Image failed to load: ${localHotelImages[index % localHotelImages.length]}`);
                                            e.target.src = "/images/default.jpg";
                                        }}
                                    />
                                    <h3 className="text-lg font-semibold mt-2">{hotel.HotelName}</h3>
                                    <p>{hotel.HotelAddress}</p>
                                    <p>{hotel.Price}</p>
                                    <p>Rating: {hotel.Rating}</p>
                                    <p>{hotel.Description}</p>
                                </div>
                            ))}
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
                                        alt={selectedHotel.HotelName}
                                        className="w-full h-48 object-cover rounded-lg"
                                        onError={(e) => {
                                            console.log(`Image failed to load: ${localHotelImages[0]}`);
                                            e.target.src = "/images/default.jpg";
                                        }}
                                    />
                                </div>
                                <div className="md:w-2/3 space-y-3">
                                    <h3 className="text-xl font-semibold text-white">{selectedHotel.HotelName}</h3>
                                    <p className="text-gray-300">{selectedHotel.HotelAddress}</p>
                                    <p className="text-green-400 font-semibold">{selectedHotel.Price}</p>
                                    <p className="text-yellow-400">Rating: {selectedHotel.Rating} ⭐</p>
                                    <p className="text-gray-400">{selectedHotel.Description}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={generateItinerary}
                            className="bg-blue-700 text-white px-4 py-2 rounded mt-4 hover:bg-blue-800 transition-all"
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
                                        alt={selectedHotel.HotelName}
                                        className="w-full h-48 object-cover rounded-lg"
                                        onError={(e) => {
                                            console.log(`Image failed to load: ${localHotelImages[0]}`);
                                            e.target.src = "/images/default.jpg";
                                        }}
                                    />
                                </div>
                                <div className="md:w-2/3 space-y-3">
                                    <h3 className="text-xl font-semibold text-white">{selectedHotel.HotelName}</h3>
                                    <p className="text-gray-300">{selectedHotel.HotelAddress}</p>
                                    <p className="text-green-400 font-semibold">{selectedHotel.Price}</p>
                                    <p className="text-yellow-400">Rating: {selectedHotel.Rating} ⭐</p>
                                    <p className="text-gray-400">{selectedHotel.Description}</p>
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
                            <div className="mt-2 text-gray-300">
                                <p>Cost Breakdown:</p>
                                <ul className="list-disc pl-5">
                                    <li>
                                        Hotel Cost ({stableTrip?.userSelection?.noOfDays} days x ₹{parseInt(selectedHotel.Price.replace(/[^0-9]/g, ""))} per night): ₹{stableTrip?.tripData?.costBreakdown?.HotelCost || 0} INR
                                    </li>
                                    <li>
                                        Activities & Transport Cost: ₹{stableTrip?.tripData?.costBreakdown?.ActivityAndTransportCost || 0} INR
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="text-center text-white">Loading hotels...</p>
                )}

                <div className="mt-6">
                    <div className="flex gap-4">
                        <button
                            onClick={handleShowEvents}
                            className="bg-customGreen text-white px-4 py-2 rounded mt-4 hover:bg-green-600 transition-all"
                            disabled={!itineraryGenerated}
                        >
                            Show Local Events
                        </button>
                        <button
                            onClick={handleShowFlights}
                            className="bg-blue-700 text-white px-4 py-2 rounded mt-4 hover:bg-blue-800 transition-all"
                            disabled={!itineraryGenerated}
                        >
                            Show Flights
                        </button>
                        <button
                            onClick={handleShowPacking}
                            className="bg-purple-700 text-white px-4 py-2 rounded mt-4 hover:bg-purple-800 transition-all"
                            disabled={!itineraryGenerated}
                        >
                            Packing Details
                        </button>
                        <button
                            onClick={handleShowShopping}
                            className="bg-purple-700 text-white px-4 py-2 rounded mt-4 hover:bg-purple-800 transition-all"
                            disabled={!itineraryGenerated}
                        >
                            Shopping Sites
                        </button>
                        {itineraryGenerated && (
                            <div>
                                <PdfMaker trip={trip} selectedHotel={selectedHotel} />
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {stableTrip ? (
                <Chatbot
                    tripId={stableTrip.id}
                    destination={stableTrip.userSelection?.location?.label}
                />
            ) : (
                <div className="fixed bottom-5 right-5 bg-white p-4 shadow-lg rounded-xl">
                    <p>Loading trip data...</p>
                </div>
            )}

            {showEvents && stableTrip && (
                <div className="mt-6">
                    <EventList
                        location={stableTrip.userSelection?.location?.label}
                        startDate={stableTrip.userSelection?.startDate}
                        noOfDays={stableTrip.userSelection?.noOfDays}
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