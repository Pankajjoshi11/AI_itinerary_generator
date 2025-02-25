import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/fireBaseConfig";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Itinerary } from "../components/Trip/Itinerary";
import { Hotels } from "../components/Trip/Hotels";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  const [travelPhotos, setTravelPhotos] = useState([]);
  const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: false })); // Changed delay to 3000ms (3 seconds)

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const docRef = doc(db, "AItrip", tripId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const tripData = { id: docSnap.id, ...docSnap.data() };
          setTrip(tripData);
          setTravelPhotos(tripData.travelPhotos || []);
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

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    const newPhotos = files.map((file) => URL.createObjectURL(file));
    setTravelPhotos((prevPhotos) => [...prevPhotos, ...newPhotos]);
  };

  if (loading) {
    return <div className="container my-4 text-center text-white">Loading trip details...</div>;
  }

  if (!trip) {
    return <div className="container my-4 text-center text-white">Trip not found.</div>;
  }

  const itineraryDates = trip.tripData?.itinerary?.map((day) => day.Day) || [];
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
                  src={localHotelImages[0]}
                  alt={`${hotelName} exterior`}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                  onError={(e) => (e.target.src = "/images/default-hotel.jpg")}
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

          {/* Travel Diaries Section */}
          <div className="mt-10">
            <h2 className="text-4xl font-extrabold text-center text-white dark:text-customGreen mb-8 tracking-wide drop-shadow-md">
              Travel Diaries 📸
            </h2>
            {/* Photo Upload Input */}
            <div className="flex justify-center items-center gap-4 mb-8">
              <label
                htmlFor="photo-upload"
                className="px-6 py-3 bg-customGreen text-white font-semibold rounded-full cursor-pointer hover:bg-customGreen/90 transition-all duration-300 shadow-md"
              >
                Upload Photos
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <p className="text-lg text-white italic">
                Capture Your Journey!
              </p>
            </div>
            {/* Beautified Carousel with 3-second transition */}
            <Carousel
              plugins={[plugin.current]}
              className="w-full"
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
            >
              <CarouselContent>
                {travelPhotos.length > 0 ? (
                  travelPhotos.map((photo, index) => (
                    <CarouselItem key={index}>
                      <Card className="border-none shadow-lg">
                        <CardContent className="p-1">
                          <img
                            src={photo}
                            alt={`Travel memory ${index + 1}`}
                            className="h-64 md:h-[500px] w-full object-cover rounded-2xl transition-transform duration-300 ease-in-out hover:scale-105"
                            onError={(e) => (e.target.src = "/images/default-photo.jpg")}
                          />
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))
                ) : (
                  <CarouselItem>
                    <div className="w-full text-center text-white p-6 text-lg">
                      No photos uploaded yet. Start capturing your memories!
                    </div>
                  </CarouselItem>
                )}
              </CarouselContent>
              {travelPhotos.length > 1 && (
                <>
                  <CarouselPrevious className="bg-customGreen/80 text-white hover:bg-customGreen transition-colors" />
                  <CarouselNext className="bg-customGreen/80 text-white hover:bg-customGreen transition-colors" />
                </>
              )}
            </Carousel>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DisplayDetails;