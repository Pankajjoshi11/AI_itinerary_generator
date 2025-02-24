import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export const Itinerary = ({ trip }) => {
  const handleImageError = (e) => {
    e.target.src = "/landing.png";
    e.target.onerror = null; 
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-gray-900 text-white">
      <Card className="mb-8 shadow-lg bg-gray-800 border-none">
        <CardHeader>
          <h1 className="text-3xl font-bold text-center text-white">
            🏖️ Trip Itinerary 🏖️
          </h1>
        </CardHeader>
        <CardContent>
          {trip?.tripData?.itinerary?.map((day, dayIndex) => (
            <section key={dayIndex} className="mb-12 border-b border-gray-700 pb-6 last:border-b-0">
              <h2 className="text-2xl font-semibold mb-4 flex items-center text-white">
                <span className="mr-2">🗓️</span>
                {day.Day}
              </h2>
              {/* Big, visible line before activities */}
              <div className="w-full h-1 bg-green-400 rounded-full mb-6"></div>
              <div className="space-y-6">
                {day.Activities?.map((activity, activityIndex) => (
                  <Link
                    key={activityIndex}
                    to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${activity.PlaceName} ${trip?.location }`
                    )}`}
                    target="_blank"
                    className="block"
                  >
                    <Card className="overflow-hidden hover:shadow-xl transition-shadow bg-gray-800 border-gray-700">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-2 flex items-center text-white">
                          <span className="mr-2 text-green-400">📍</span>
                          {activity.PlaceName}
                        </h3>
                        <p className="text-gray-300 mb-4">{activity.PlaceDetails}</p>
                        
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
                                ? `${activity.HowToTravel?.match(/^(Taxi|Walk|Train|Bus|Car)/i)?.[0] || "Unknown"} ${activity.TravelTime ? `${activity.TravelTime} from ${activity.HowToTravel?.replace(/^(Taxi|Walk|Train|Bus|Car) from /i, '') || 'Unknown'}` : 'Not specified'}`
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
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Itinerary;