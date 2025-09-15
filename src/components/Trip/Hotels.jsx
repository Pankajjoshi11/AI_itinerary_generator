import React, { useMemo } from "react";
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

const parseINR = (str) => {
  if (!str) return 0;
  const n = parseInt(String(str).replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? 0 : n;
};

export const Hotels = ({ trip, onSelectHotel }) => {
  const handleHotelSelect = (hotel) => {
    if (onSelectHotel) onSelectHotel(hotel);
  };

  const userBudget = Number(trip?.userSelection?.budget) || 0;
  const nights = Math.max(1, Number(trip?.userSelection?.noOfDays) || 1);

  // Target per-night budget from total trip budget
  const perNightBudget = Math.floor(userBudget / nights);

  // Allow ±20% tolerance around the target per-night budget
  const tolerance = 0.2;
  const minPrice = Math.max(0, Math.floor(perNightBudget * (1 - tolerance)));
  const maxPrice = Math.floor(perNightBudget * (1 + tolerance));

  // Precompute hotels with numeric price + distance from target
  const hotelsWithPrice = useMemo(() => {
    const arr = (trip?.tripData?.hotels || []).map((h, idx) => {
      const price = parseINR(h?.Price);
      return {
        ...h,
        __price: price,
        __imgIdx: idx % localHotelImages.length,
        __distance: Math.abs(price - perNightBudget),
      };
    });
    return arr;
  }, [trip, perNightBudget]);

  // Primary list: inside the ±20% window
  const inBand = hotelsWithPrice.filter(
    (h) => h.__price >= minPrice && h.__price <= maxPrice
  );

  // Fallback: if nothing in band, show the closest 6 to the target per-night budget
  const visibleHotels =
    inBand.length > 0
      ? inBand
      : [...hotelsWithPrice].sort((a, b) => a.__distance - b.__distance).slice(0, 6);

  const showFallbackNote = inBand.length === 0 && hotelsWithPrice.length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-2 text-center text-white">Select a Hotel</h2>

      <p className="text-center text-sm text-gray-400 mb-6">
        Trip budget: <span className="font-semibold">₹{userBudget.toLocaleString()}</span> for{" "}
        <span className="font-semibold">{nights}</span> night{nights > 1 ? "s" : ""} → target per-night{" "}
        <span className="font-semibold">₹{perNightBudget.toLocaleString()}</span>{" "}
        ({minPrice.toLocaleString()}–{maxPrice.toLocaleString()} with tolerance).
      </p>

      {showFallbackNote && (
        <p className="text-center text-amber-300 mb-6">
          No hotels in the target range — showing the closest options by price.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {visibleHotels.length > 0 ? (
          visibleHotels.map((hotel, index) => (
            <Card
              key={`${hotel?.HotelName || "hotel"}-${index}`}
              className="overflow-hidden rounded-lg shadow-md bg-gray-800 border border-gray-700 transition-transform transform hover:scale-105 hover:shadow-2xl cursor-pointer"
              onClick={() => handleHotelSelect(hotel)}
            >
              <div className="relative h-52 w-full rounded-t-lg overflow-hidden">
                <img
                  src={localHotelImages[hotel.__imgIdx]}
                  alt={hotel?.HotelName || "Hotel"}
                  className="w-full h-full object-cover transition-opacity duration-300 hover:opacity-90"
                  onError={(e) => {
                    console.log(`Image failed to load: ${localHotelImages[hotel.__imgIdx]}`);
                    e.currentTarget.src = "/images/default.jpg";
                  }}
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-white mb-3 truncate">
                  {hotel?.HotelName || "Unnamed Hotel"}
                </h3>
                <p className="text-gray-400 mb-2 truncate">{hotel?.HotelAddress || "No address"}</p>
                <p className="text-green-400 text-lg font-semibold mb-2">
                  {hotel?.Price || `₹${hotel.__price}`}
                  {hotel.__price > 0 && (
                    <span className="ml-2 text-gray-400 text-sm">
                      ({hotel.__price.toLocaleString()} / night)
                    </span>
                  )}
                </p>
                <p className="text-yellow-400 font-medium mb-2">
                  Rating: {hotel?.Rating ?? "Not rated"}
                </p>
                <p className="text-gray-300 text-sm line-clamp-3">
                  {hotel?.Description || "No description available."}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-gray-400 mt-6 text-lg">
            No hotels available for this destination.
          </p>
        )}
      </div>

      {/* If there were hotels but none matched the band, we already showed a fallback note above */}
      {hotelsWithPrice.length > 0 && inBand.length === 0 && !showFallbackNote && (
        <p className="text-center text-gray-400 mt-6 text-lg">
          No hotels found within the budget range.
        </p>
      )}
    </div>
  );
};

export default Hotels;
