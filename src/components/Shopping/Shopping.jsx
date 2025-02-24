import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { db } from "@/services/fireBaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { AI_PROMPT_SHOPPING } from "../../constants/options";
import { chatSession } from "@/services/AImodel";

export const Shopping = ({ trip, tripId }) => {
    const [shoppingList, setShoppingList] = useState({ ShoppingSpots: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (trip && tripId && shoppingList.ShoppingSpots.length === 0) {
            generateShoppingList();
        }
    }, [trip, tripId, shoppingList.ShoppingSpots.length]); // Only run if shoppingList is empty

    const generateShoppingList = async () => {
        setLoading(true);
        setError(null);

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

        const itineraryActivities = tripData?.itinerary
            ? tripData.itinerary.map((day, index) => 
                `Day ${index + 1}: Visit ${day.PlaceName} (${day.PlaceDetails})`
              ).join(", ")
            : "No itinerary provided";

        const prompt = AI_PROMPT_SHOPPING
            .replace("{location}", userSelection?.location?.label || "unknown location")
            .replace("{noOfDays}", userSelection?.noOfDays || "3")
            .replace("{startDate}", formattedDate)
            .replace("{season}", season)
            .replace("{itineraryActivities}", itineraryActivities)
            .replace("{budget}", userSelection?.budget || "Moderate");

        try {
            const result = await chatSession.sendMessage(prompt);
            const responseText = result?.response?.text();
            console.log("Raw Shopping Response:", responseText);

            let responseJSON;
            try {
                responseJSON = JSON.parse(responseText);
                console.log("Parsed Shopping Response:", responseJSON);
            } catch (parseError) {
                console.error("Parsing error:", parseError);
                responseJSON = { ShoppingSpots: [] };
            }

            const shoppingSpots = (responseJSON.ShoppingSpots || []).map(spot => ({
                ...spot,
                NearestItineraryLocation: spot.NearestItineraryLocation || "No nearest location specified"
            }));
            setShoppingList({ ShoppingSpots: shoppingSpots });

            // Update Firestore with the shopping list
            await setDoc(
                doc(db, "AItrip", tripId),
                {
                    tripData: {
                        ...tripData,
                        shoppingList: { ShoppingSpots: shoppingSpots },
                    },
                },
                { merge: true }
            );
        } catch (error) {
            console.error("Error generating shopping list:", error);
            setError("Failed to generate shopping recommendations. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-y-2 p-5">
            <h1 className="font-bold text-lg sm:text-lg md:text-2xl mt-7 md:mt-10 lg:mt-16 mb-2 text-blue-800 dark:text-customGreen">
                🛍️ Shopping Recommendations 🛍️
            </h1>
            {loading ? (
                <p className="text-center text-white">Loading shopping recommendations...</p>
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : shoppingList.ShoppingSpots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 text-justify gap-3 md:gap-6 xl:gap-6 mt-4">
                    {shoppingList.ShoppingSpots.map((spot, index) => (
                        <div
                            key={index}
                            className="text-sm lg:text-base hover:scale-105 transition-all mb-2 border-[1px] md:border-2 dark:border-customGreen border-blue-700 rounded-lg px-2"
                        >
                            <h2 className="font-semibold text-sm md:text-lg mt-2">
                                {spot.PlaceName || "Unnamed Shopping Spot"}
                            </h2>
                            <div className="mt-2">
                                <h3 className="font-semibold">Details:</h3>
                                <p className="pl-5">{spot.PlaceDetails || "No details available"}</p>
                            </div>
                            <div className="mt-2">
                                <h3 className="font-semibold">Recommended Day & Nearest Location:</h3>
                                <p className="pl-5">
                                    Day: {spot.RecommendedDay || "No recommended day"}<br />
                                    Nearest Itinerary Location: {spot.NearestItineraryLocation}
                                </p>
                            </div>
                            {/* <div className="mt-2">
                                <h3 className="font-semibold">Coordinates:</h3>
                                <p className="pl-5">
                                    Latitude: {spot.GeoCoordinates?.latitude || 0}, Longitude: {spot.GeoCoordinates?.longitude || 0}
                                </p>
                                <a
                                    href={`https://www.google.com/maps?q=${spot.GeoCoordinates?.latitude || 0},${spot.GeoCoordinates?.longitude || 0}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-600 mt-1 inline-block"
                                >
                                    View on Map
                                </a>
                            </div> */}
                            {/* {spot.PlaceImageURL && (
                                <div className="mt-2">
                                    <img
                                        src={spot.PlaceImageURL}
                                        alt={`${spot.PlaceName || "Shopping Spot"} image`}
                                        className="w-full h-40 object-cover rounded-lg"
                                        onError={(e) => (e.target.src = "/default-shopping.jpg")} // Fallback image
                                        aria-label={`${spot.PlaceName || "Shopping Spot"} shopping location image`}
                                    />
                                </div>
                            )} */}
                        </div>
                    ))}
                </div>
            ) : (
                <p>No shopping recommendations available.</p>
            )}
        </Card>
    );
};

export default Shopping;