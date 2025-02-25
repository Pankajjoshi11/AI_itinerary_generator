import React from "react";
import { Card, CardContent } from "@/components/ui/card";

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
export const Hotels = ({ trip, onSelectHotel }) => {
  const handleHotelSelect = (hotel) => {
    if (onSelectHotel) {
      onSelectHotel(hotel);
    }
  };

  const userBudget = trip?.userSelection?.budget || 0;
  const halfBudget = userBudget / 2;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-8 text-center text-white border-b pb-4 border-gray-700">
        Select a Hotel
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {trip?.tripData?.hotels
          ?.filter((hotel) => {
            const hotelPrice = parseInt(hotel.Price.replace(/\D/g, ""), 10) || 0;
            return hotelPrice >= halfBudget * 0.8 && hotelPrice <= halfBudget * 1.2;
          })
          .map((hotel, index) => (
            <Card
              key={index}
              className="overflow-hidden rounded-lg shadow-md bg-gray-800 border border-gray-700 transition-transform transform hover:scale-105 hover:shadow-2xl cursor-pointer"
              onClick={() => handleHotelSelect(hotel)}
            >
              <div className="relative h-52 w-full rounded-t-lg overflow-hidden">
                  <img
                    src={localHotelImages[index % localHotelImages.length]} // Use local image from array
                    alt={hotel.HotelName}
                    className="w-full h-full object-cover transition-opacity duration-300 hover:opacity-90"
                    onError={(e) => {
                      console.log(`Image failed to load: ${localHotelImages[index % localHotelImages.length]}`);
                      e.target.src = "/images/default.jpg"; // Fallback to default image
                    }}
                  />
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-white mb-3 truncate">
                  {hotel.HotelName}
                </h3>
                <p className="text-gray-400 mb-2 truncate">{hotel.HotelAddress}</p>
                <p className="text-green-400 text-lg font-semibold mb-2">{hotel.Price}</p>
                <p className="text-yellow-400 font-medium mb-2">Rating: {hotel.Rating || "Not rated"}</p>
                <p className="text-gray-300 text-sm line-clamp-3">{hotel.Description || "No description available."}</p>
              </CardContent>
            </Card>
          ))}
      </div>
      {trip?.tripData?.hotels?.filter((hotel) => parseInt(hotel.Price.replace(/\D/g, ""), 10) || 0).length === 0 && (
        <p className="text-center text-gray-400 mt-6 text-lg">No hotels found within the budget range.</p>
      )}
    </div>
  );
};

export default Hotels;