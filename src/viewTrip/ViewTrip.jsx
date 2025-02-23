import { db } from "@/services/fireBaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { InfoSection } from "../components/Trip/InfoSection";
import { Hotels } from "../components/Trip/Hotels";
import { Flights } from "../components/Flights/Flights";
import { Itinerary } from "../components/Trip/Itinerary";
import { Card } from "@/components/ui/card";
import Chatbot from "../components/chatbot/Chatbot";
import EventList from "../components/EventList/Event";
import Map from "@/components/Map/Map";
import { AI_PROMPT_ITINERARY, AI_PROMPT_FLIGHTS } from "../constants/options";
import { chatSession } from "@/services/AImodel";

export const ViewTrip = () => {
    const { tripId } = useParams();
    const [trip, setTrip] = useState(null);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [itineraryGenerated, setItineraryGenerated] = useState(false);
    const [showEvents, setShowEvents] = useState(false);
    const [showFlights, setShowFlights] = useState(false);

    useEffect(() => {
        if (tripId) {
            getTripData();
        }
    }, [tripId]);

    const getTripData = async () => {
        const docRef = doc(db, "AItrip", tripId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            setTrip({ id: docSnap.id, ...docSnap.data() });
        } else {
            toast("No trip found");
            setTrip(null);
        }
    };

    const generateItinerary = async () => {
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

        const prompt = AI_PROMPT_ITINERARY
            .replace("{noOfDays}", userSelection?.noOfDays || "3")
            .replace("{people}", userSelection?.people || "1 People")
            .replace("{location}", userSelection?.location?.label || "unknown location")
            .replace("{budget}", userSelection?.budget || "Moderate")
            .replace("{startingGeoCoordinates}", selectedHotel.GeoCoordinates)
            .replace("{startDate}", formattedDate)
            .replace("{specificPlace}", userSelection?.specificPlace || "none specified");

        const result = await chatSession.sendMessage(prompt);
        const responseText = result?.response?.text();
        const responseJSON = JSON.parse(responseText);

        await setDoc(
            doc(db, "AItrip", tripId),
            {
                tripData: {
                    ...tripData,
                    itinerary: responseJSON.itinerary || [],
                    approximateTotalBudget: responseJSON.ApproximateTotalBudget || 0,
                },
            },
            { merge: true }
        );

        setTrip((prev) => ({
            ...prev,
            tripData: {
                ...prev.tripData,
                itinerary: responseJSON.itinerary || [],
                approximateTotalBudget: responseJSON.ApproximateTotalBudget || 0,
            },
        }));
        setItineraryGenerated(true);
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

    const handleHotelSelect = (hotel) => {
        setSelectedHotel(hotel);
    };

    const handleShowEvents = () => {
        setShowEvents(true);
    };

    const handleShowFlights = () => {
        generateFlights();
    };

    return (
        <div className="container my-4">
            <Card className="border-x-2 p-5">
                <InfoSection trip={trip} />

                {trip && !selectedHotel ? (
                    <div className="mt-6">
                        <h2 className="text-xl font-bold mb-4">Select a Hotel</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {trip.tripData?.hotels.map((hotel, index) => (
                                <div
                                    key={index}
                                    className="border p-4 rounded-lg cursor-pointer hover:bg-gray-100"
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
                        <Hotels trip={{ ...trip, tripData: { hotels: [selectedHotel] } }} />
                        <button
                            onClick={generateItinerary}
                            className="bg-blue-700 text-white px-4 py-2 rounded mt-4 hover:bg-blue-800 transition-all"
                        >
                            Generate Itinerary
                        </button>
                    </>
                ) : itineraryGenerated ? (
                    <>
                        <Hotels trip={{ ...trip, tripData: { hotels: [selectedHotel] } }} />
                        <Itinerary trip={trip} />
                        <div className="mt-4">
                            <p className="text-lg font-semibold text-blue-800 dark:text-customGreen">
                                Approximate Total Budget (excluding flights): ₹{trip?.tripData?.approximateTotalBudget || 0} INR
                            </p>
                        </div>
                    </>
                ) : (
                    <p>Loading hotels...</p>
                )}

                <div className="mt-6">
                    <Map tripId={tripId} />
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleShowEvents}
                        className="bg-customGreen text-white px-4 py-2 rounded mt-4 hover:bg-green-600 transition-all"
                    >
                        Show Local Events
                    </button>
                    <button
                        onClick={handleShowFlights}
                        className="bg-blue-700 text-white px-4 py-2 rounded mt-4 hover:bg-blue-800 transition-all"
                    >
                        Show Flights
                    </button>
                </div>
            </Card>

            {trip ? (
                <Chatbot
                    tripId={trip.id}
                    destination={trip.userSelection?.location?.label}
                />
            ) : (
                <div className="fixed bottom-5 right-5 bg-white p-4 shadow-lg rounded-xl">
                    <p>Loading trip data...</p>
                </div>
            )}

            {showEvents && trip && (
                <div className="mt-6">
                    <EventList location={trip.userSelection?.location?.label} />
                </div>
            )}

            {showFlights && trip && (
                <div className="mt-6">
                    <Flights trip={trip} />
                </div>
            )}
        </div>
    );
};