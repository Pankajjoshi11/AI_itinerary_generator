import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export const Itinerary = ({ trip }) => {
  const handleImageError = (e) => {
    e.target.src = "/landing.png";
    e.target.onerror = null; 
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
		<img src="" />
      <Card className="mb-8">
        <CardHeader>
          <h1 className="text-3xl font-bold text-center">
            🏖️ Trip Itinerary 🏖️
          </h1>
        </CardHeader>
        <CardContent>
          {trip?.tripData?.itinerary?.map((day, dayIndex) => (
            <div key={dayIndex} className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="mr-2">🗓️</span>
                {day.Day}
              </h2>
              <div className="space-y-6">
                {day.Activities?.map((activity, activityIndex) => (
                  <Card key={activityIndex} className="overflow-hidden">
                    <div className="relative h-48 w-full">
                      <img
                        src={activity.PlaceImageURL}
                        alt={activity.PlaceName}
                        onError={handleImageError}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-xl font-semibold mb-2 flex items-center">
                        <span className="mr-2">📍</span>
                        {activity.PlaceName}
                      </h3>
                      <p className="text-gray-600 mb-4">{activity.PlaceDetails}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="font-semibold">Best Time to Visit</p>
                          <p className="text-gray-600">{activity.BestTimeToVisit}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold">Ticket Pricing</p>
                          <p className="text-gray-600">{activity.TicketPricing}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold">Travel Time</p>
                          <p className="text-gray-600">{activity.TravelTime}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Itinerary;