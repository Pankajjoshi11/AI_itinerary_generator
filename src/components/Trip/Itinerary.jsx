import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export const Itinerary = ({ trip }) => {
  const handleImageError = (e) => {
    e.target.src = "/landing.png";
    e.target.onerror = null;
  };

  // Check if trip, tripData, and itinerary exist and are in the correct format
  if (!trip || !trip.tripData || !trip.tripData.itinerary) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-gray-900 text-white text-center">
        <p>No itinerary available. Please generate an itinerary first.</p>
      </div>
    );
  }

  // Handle cases where itinerary might not be an array
  let itineraryArray = [];
  if (Array.isArray(trip.tripData.itinerary)) {
    itineraryArray = trip.tripData.itinerary;
  } else if (typeof trip.tripData.itinerary === "object" && trip.tripData.itinerary !== null) {
    // If it's an object, try to convert it to an array (e.g., if it's a single day or nested structure)
    itineraryArray = Object.values(trip.tripData.itinerary).flat();
  } else {
    console.warn("Itinerary is not in an expected format:", trip.tripData.itinerary);
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-gray-900 text-white text-center">
        <p>Invalid itinerary format. Please check the data.</p>
      </div>
    );
  }

  // Get startDate from tripData or userSelection to calculate dates for each day
  const startDate = trip.tripData?.startDate || 
    (trip.userSelection?.startDate && typeof trip.userSelection.startDate === "string" 
      ? trip.userSelection.startDate 
      : new Date().toISOString().split("T")[0]);

  // Calculate Approximate Total Budget with fallback and string formatting
  const approximateTotalBudget = trip?.tripData?.approximateTotalBudget || 0;
  const formattedBudget = typeof approximateTotalBudget === "string" 
    ? approximateTotalBudget 
    : `${approximateTotalBudget} INR`;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-gray-900 text-white">
      <Card className="mb-8 shadow-lg bg-gray-800 border-none">
        <CardHeader>
          <h1 className="text-3xl font-bold text-center text-white flex items-center justify-center">
            <span className="mr-2 text-yellow-500">🏖️</span> Trip Itinerary <span className="ml-2 text-yellow-500">🏖️</span>
          </h1>
        </CardHeader>
        <CardContent>
          {itineraryArray.map((day, dayIndex) => {
            // Calculate the date for this day based on startDate
            const baseDate = new Date(startDate);
            baseDate.setDate(baseDate.getDate() + dayIndex);
            const formattedDate = baseDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

            return (
              <section key={dayIndex} className="mb-12 border-b border-gray-700 pb-6 last:border-b-0">
                <h2 className="text-2xl font-semibold mb-4 flex items-center text-white">
                  <span className="mr-2 text-green-400">🗓️</span>
                  {day.Day || `Day ${dayIndex + 1}`} ({formattedDate})
                </h2>
                {/* Big, visible line before activities */}
                <div className="w-full h-1 bg-green-400 rounded-full mb-6"></div>
                <div className="space-y-6">
                  {(day.Activities || day.activities || []).map((activity, activityIndex) => (
                    <Link
                      key={activityIndex}
                      to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${activity.PlaceName} ${trip.userSelection?.location?.label || 'Delhi, India'}`
                      )}`}
                      target="_blank"
                      className="block"
                    >
                      <Card className="overflow-hidden hover:shadow-xl transition-shadow bg-gray-800 border-gray-700">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold mb-2 flex items-center text-pink-400">
                            <span className="mr-2 text-green-400">📍</span>
                            {activity.PlaceName || "Unnamed Place"}
                          </h3>
                          <p className="text-gray-300 mb-4">{activity.PlaceDetails || "No details available"}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-700 rounded-lg shadow-md">
                              <p className="font-semibold text-green-400">Best Time to Visit</p>
                              <p className="text-gray-200 mt-1">{activity.BestTimeToVisit || "Not specified"}</p>
                            </div>
                            <div className="p-4 bg-gray-700 rounded-lg shadow-md">
                              <p className="font-semibold text-green-400">Ticket Pricing</p>
                              <p className="text-gray-200 mt-1">{activity.TicketPricing || "Not specified"}</p>
                            </div>
                            <div className="p-4 bg-gray-700 rounded-lg shadow-md">
                              <p className="font-semibold text-green-400">Travel Info</p>
                              <p className="text-gray-200 mt-1">
                                {activity.TravelTime || activity.HowToTravel 
                                  ? `${activity.HowToTravel?.match(/^(Taxi|Walk|Train|Bus|Car)/i)?.[0] || "Unknown"} ${activity.TravelTime ? `(${activity.TravelTime}) from ${activity.HowToTravel?.replace(/^(Taxi|Walk|Train|Bus|Car) from /i, '') || 'Unknown'}` : 'Not specified'}`
                                  : "Not specified"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
          {/* Display Approximate Total Budget at the bottom of the itinerary */}
          <div className="mt-8 text-center">
            <p className="text-xl font-semibold text-blue-800 dark:text-customGreen">
              Approximate Total Budget (excluding flights): ₹{formattedBudget}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Itinerary;