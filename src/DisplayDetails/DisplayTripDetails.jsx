// DisplayDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/fireBaseConfig";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Itinerary } from "../components/Trip/Itinerary";
import { Hotels } from "../components/Trip/Hotels";

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

export const DisplayDetails = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const docRef = doc(db, "AItrip", tripId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTrip({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("No trip found for this ID");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching trip details: ", error);
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId]);

  if (loading) {
    return <div className="container my-4 text-center text-white">Loading trip details...</div>;
  }

  if (!trip) {
    return <div className="container my-4 text-center text-white">Trip not found.</div>;
  }

  // Extract dates from the itinerary (assuming Day is in "YYYY-MM-DD" format)
  const itineraryDates = trip.tripData?.itinerary?.map((day) => day.Day) || [];

  // Get the hotel details from the selected hotel
  const hotelDetails = trip.selectedHotel || {};
  const hotelName = hotelDetails.HotelName || "Hotel Not Specified";
  const hotelAddress = hotelDetails.HotelAddress || "Address Not Specified";
  const hotelPrice = hotelDetails.Price || "Price Not Specified";
  const hotelRating = hotelDetails.Rating || "Rating Not Specified";
  const hotelDescription = hotelDetails.Description || "No description available";

  console.log("Trip Data in DisplayDetails:", trip);

  return (
    <div className="container my-4">
      <Card className="border-x-2 p-5">
        <CardHeader>
          <h1 className="text-3xl font-bold text-center text-white dark:text-customGreen">
            Trip Details 🏖
          </h1>
        </CardHeader>
        <CardContent>
          {trip.selectedHotel && (
            <div className="mt-6">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Selected Hotel: {hotelName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <img
                  src={localHotelImages[0]} // Use the first image from the array
                  alt={`${hotelName} exterior`}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    console.log(`Image failed to load: ${localHotelImages[0]}`);
                    e.target.src = "/images/default-hotel.jpg"; // Fallback image on load error
                  }}
                />
                <div className="space-y-2">
                  <p className="text-lg text-white">
                    <strong>Address:</strong> {hotelAddress}
                  </p>
                  <p className="text-lg text-white">
                    <strong>Price:</strong> {hotelPrice}
                  </p>
                  <p className="text-lg text-white">
                    <strong>Rating:</strong> {hotelRating}
                  </p>
                  <p className="text-lg text-white">
                    <strong>Description:</strong> {hotelDescription}
                  </p>
                </div>
              </div>
              {/* <Hotels trip={{ ...trip, tripData: { hotels: [trip.selectedHotel] } }} /> */}
            </div>
          )}
          {trip.tripData?.itinerary && (
            <div className="mt-6">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Itinerary Dates: {itineraryDates.join(", ") || "No dates available"}
              </h2>
              <Itinerary trip={trip} />
            </div>
          )}
          <div className="mt-4">
            <p className="text-lg font-semibold text-blue-800 dark:text-customGreen">
              Approximate Total Budget (excluding flights): ₹{trip.tripData?.approximateTotalBudget || 0} INR
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DisplayDetails;