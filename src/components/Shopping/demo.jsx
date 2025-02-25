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

export const ViewTrip = () => {
    const { tripId } = useParams();
    const [trip, setTrip] = useState(null);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [itineraryGenerated, setItineraryGenerated] = useState(false);
    const [showEvents, setShowEvents] = useState(false);
    const [showFlights, setShowFlights] = useState(false);
    const [showPacking, setShowPacking] = useState(false);
    const [loadingItinerary, setLoadingItinerary] = useState(false); // Loading state for itinerary

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
            // Set selectedHotel if it exists in the document
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
        // Save the selected hotel to Firestore immediately
        saveSelectedHotel(hotel);
    };

    const saveSelectedHotel = async (hotel) => {
        if (tripId) {
            await setDoc(
                doc(db, "AItrip", tripId),
                {
                    selectedHotel: hotel, // Store the selected hotel in the trip document
                },
                { merge: true }
            );
            setTrip((prev) => ({
                ...prev,
                selectedHotel: hotel, // Update local state
            }));
        }
    };

    const generateItinerary = async () => {
        setLoadingItinerary(true); // Start loading
        const { userSelection, tripData } = trip || {};
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

        // Ensure selectedHotel has GeoCoordinates, fall back to an empty string if not
        const startingGeoCoordinates = selectedHotel?.GeoCoordinates
            ? `${selectedHotel.GeoCoordinates.latitude},${selectedHotel.GeoCoordinates.longitude}`
            : "";

        const prompt = AI_PROMPT_ITINERARY
            .replace("{noOfDays}", userSelection?.noOfDays || "4") // Match your trip object (4 days)
            .replace("{people}", userSelection?.people || "5-10 People") // Match your trip object
            .replace("{location}", userSelection?.location?.label || "New Delhi, India") // Match your trip object location (Delhi)
            .replace("{budget}", userSelection?.budget || "Moderate") // Match your trip object
            .replace("{HotelName}", selectedHotel?.HotelName || "Unknown Hotel") // Use selected hotel name
            .replace("{startingGeoCoordinates}", startingGeoCoordinates) // Use selected hotel's coordinates
            .replace("{startDate}", formattedDate)
            .replace("{specificPlace}", userSelection?.specificPlace || "");
            // .replace("{mood}", userSelection?.mood || "relaxing"); // Default to "relaxing" if not specified

        console.log("Generated Prompt:", prompt); // Log the prompt for debugging

        let responseText = "";
        try {
            const result = await chatSession.sendMessage(prompt);
            responseText = result?.response?.text() || ""; // Safely get response text, default to empty string if undefined
            console.log("Raw AI Response:", responseText);
        } catch (error) {
            console.error("Error fetching AI response:", error);
            responseText = ""; // Set to empty string on error
        }

        let responseJSON;
        try {
            responseJSON = responseText ? JSON.parse(responseText) : { itinerary: [], ApproximateTotalBudget: 0 };
            console.log("Parsed AI Response:", responseJSON);
        } catch (e) {
            console.error("Parsing error:", e);
            responseJSON = { itinerary: [], ApproximateTotalBudget: 0 };
        }

        // Extract and normalize the itinerary data from the response to match your trip object and components
        let itineraryData = [];
        if (Array.isArray(responseJSON.trip?.itinerary) || Array.isArray(responseJSON.itinerary)) {
            itineraryData = (responseJSON.trip?.itinerary || responseJSON.itinerary).map((day, index) => ({
                Day: day.Day || `2025-02-${27 + index}`, // Use Day from response or default to your trip object's dates
                Activities: (day.Activities || []).map(activity => ({
                    PlaceName: activity.PlaceName || "",
                    PlaceDetails: activity.PlaceDetails || "",
                    PlaceImageURL: activity.PlaceImageURL || "",
                    GeoCoordinates: activity.GeoCoordinates || { latitude: 0, longitude: 0 },
                    TicketPricing: activity.TicketPricing || "",
                    TravelTime: activity.TravelTime || "",
                    BestTimeToVisit: activity.BestTimeToVisit || "",
                    HowToTravel: activity.HowToTravel || ""
                }))
            }));
        } else if ((typeof responseJSON.trip?.itinerary === "object" && responseJSON.trip?.itinerary !== null) || 
                   (typeof responseJSON.itinerary === "object" && responseJSON.itinerary !== null)) {
            itineraryData = Object.values(responseJSON.trip?.itinerary || responseJSON.itinerary).map((day, index) => ({
                Day: day.Day || `2025-02-${27 + index}`,
                Activities: (day.Activities || []).map(activity => ({
                    PlaceName: activity.PlaceName || "",
                    PlaceDetails: activity.PlaceDetails || "",
                    PlaceImageURL: activity.PlaceImageURL || "",
                    GeoCoordinates: activity.GeoCoordinates || { latitude: 0, longitude: 0 },
                    TicketPricing: activity.TicketPricing || "",
                    TravelTime: activity.TravelTime || "",
                    BestTimeToVisit: activity.BestTimeToVisit || "",
                    HowToTravel: activity.HowToTravel || ""
                }))
            }));
        }

        // Extract budget (handle the case where ApproximateTotalBudget is in trip or at the root level)
        const budget = responseJSON.trip?.ApproximateTotalBudget || responseJSON.ApproximateTotalBudget || 0;

        console.log("Processed Itinerary Data:", itineraryData);
        console.log("Budget:", budget);

        await setDoc(
            doc(db, "AItrip", tripId),
            {
                tripData: {
                    ...tripData,
                    hotels: tripData.hotels || [], // Ensure hotels are preserved
                    itinerary: itineraryData,
                    approximateTotalBudget: budget,
                },
                selectedHotel: selectedHotel, // Ensure selectedHotel is saved with the itinerary
            },
            { merge: true }
        );

        setTrip((prev) => {
            const newTrip = {
                ...prev,
                tripData: {
                    ...prev.tripData,
                    hotels: tripData.hotels || [],
                    itinerary: itineraryData,
                    approximateTotalBudget: budget,
                },
                selectedHotel: selectedHotel, // Update local state with selected hotel
            };
            console.log("Updated Trip State:", newTrip);
            return newTrip;
        });
        setItineraryGenerated(true);
        setLoadingItinerary(false); // End loading

        // Prepare itinerary text for email
        const itineraryText = `
Trip Itinerary for ${userSelection?.location?.label || "Unknown Location"}
Start Date: ${formattedDate}
Selected Hotel: ${selectedHotel?.HotelName || "Not specified"}
Approximate Budget (excluding flights): ₹${budget} INR

${itineraryData.map((day, index) => `
Day ${index + 1} (${day.Day}):
${day.Activities.map(activity => `
- ${activity.PlaceName}: ${activity.PlaceDetails}
  Ticket: ${activity.TicketPricing}
  Travel Time: ${activity.TravelTime}
  Best Time to Visit: ${activity.BestTimeToVisit}
  How to Travel: ${activity.HowToTravel}
  Coordinates: Lat ${activity.GeoCoordinates.latitude}, Lon ${activity.GeoCoordinates.longitude}
`).join("")}
`).join("")}`;

        sendEmail(itineraryText); // Send itinerary as text in email
    };

    const generateFlights = async () => {
        const { userSelection, tripData } = trip || {};
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
        const responseText = result?.response?.text() || ""; // Safely get response text, default to empty string
        console.log("Raw responseText:", responseText);

        let responseJSON;
        try {
            responseJSON = responseText ? JSON.parse(responseText) : [];
            console.log("Parsed Flights Response:", responseJSON);
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
        const { userSelection, tripData } = trip || {};

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

        const itineraryActivities = tripData?.itinerary && Array.isArray(tripData.itinerary)
            ? tripData.itinerary.map((day, index) => 
                `Day ${index + 1}: Visit ${day.Activities.map(act => act.PlaceName).join(", ")} (${day.Activities.map(act => act.PlaceDetails).join("; ")})`
              ).join(", ")
            : "No itinerary provided";

        const prompt = AI_PROMPT_PACKING
            .replace("{location}", userSelection?.location?.label || "unknown location")
            .replace("{noOfDays}", userSelection?.noOfDays || "4") // Match your trip object (4 days)
            .replace("{startDate}", formattedDate)
            .replace("{season}", season)
            .replace("{itineraryActivities}", itineraryActivities);

        const result = await chatSession.sendMessage(prompt);
        const responseText = result?.response?.text() || ""; // Safely get response text, default to empty string
        console.log("Raw Packing Response:", responseText);

        let responseJSON;
        try {
            responseJSON = responseText ? JSON.parse(responseText) : {};
            console.log("Parsed Packing Response:", responseJSON);
        } catch (e) {
            console.error("Failed to parse responseText:", e);
            responseJSON = {};
        }

        await setDoc(
            doc(db, "AItrip", tripId),
            {
                tripData: {
                    ...tripData,
                    packingList: responseJSON || {},
                },
            },
            { merge: true }
        );

        setTrip((prev) => ({
            ...prev,
            tripData: {
                ...prev.tripData,
                packingList: responseJSON || {},
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

    const stableTrip = useMemo(() => trip, [trip]);

    const sendEmail = (itineraryText) => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.email) {
            console.error("No user email found in localStorage");
            return;
        }

        emailjs.send(
            "service_nue47xc", // Service ID
            "template_rbvlgqc", // Template ID
            { 
                email: user.email, 
                tripId: tripId,
                destination: trip?.userSelection?.location?.label || "Unknown Destination",
                startDate: trip?.userSelection?.startDate ? new Date(trip.userSelection.startDate.seconds * 1000).toLocaleDateString() : "Unspecified Date",
                itinerary: itineraryText // Include the itinerary text in the email
            }, // Include trip details and itinerary in the email
            "v0_0UndGhSgkGDJGb" // User ID
        )
        .then(
            (result) => {
                console.log("Email sent successfully!", result.text);
                toast.success("Itinerary email sent successfully!");
            },
            (error) => {
                console.error("Failed to send email.", error);
                toast.error("Failed to send itinerary email.");
            }
        );
    };

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
                                        src={hotel.HotelImageURL}
                                        alt={hotel.HotelName}
                                        className="w-full h-40 object-cover rounded"
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
                        <Hotels trip={{ ...stableTrip, tripData: { hotels: [selectedHotel] } }} />
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
                        <Hotels trip={{ ...stableTrip, tripData: { hotels: [selectedHotel] } }} />
                        <Itinerary trip={stableTrip} />
                        <div className="mt-6">
                            <Map trip={stableTrip} />
                        </div>
                        <div className="mt-4">
                            <p className="text-lg font-semibold text-blue-800 dark:text-customGreen">
                                Approximate Total Budget (excluding flights): ₹{stableTrip?.tripData?.approximateTotalBudget || 0} INR
                            </p>
                        </div>
                    </>
                ) : (
                    <p className="text-center text-white">Loading hotels...</p>
                )}

                <div className="flex gap-4 mt-6">
                    <button
                        onClick={handleShowEvents}
                        className="bg-customGreen text-white px-4 py-2 rounded hover:bg-green-600 transition-all"
                        disabled={!itineraryGenerated}
                    >
                        Show Local Events
                    </button>
                    <button
                        onClick={handleShowFlights}
                        className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition-all"
                        disabled={!itineraryGenerated}
                    >
                        Show Flights
                    </button>
                    <button
                        onClick={handleShowPacking}
                        className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800 transition-all"
                        disabled={!itineraryGenerated}
                    >
                        Packing Details
                    </button>
                    {itineraryGenerated && (
                        <div>
                            <PdfMaker trip={trip} selectedHotel={selectedHotel} />
                        </div>
                    )}
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
        </div>
    );
};

export default ViewTrip;