import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card } from "../ui/card";

function MyTripsCard({ trip, onClick }) {
    const [photoUrl, setPhotoUrl] = useState([]); // Store photo URLs as an array to match the API response
    const [isLoadingPhotos, setIsLoadingPhotos] = useState(true); // Track photo loading state

    // Memoize GetPlacePhotos to prevent unnecessary re-renders
    const GetPlacePhotos = useCallback(async () => {
        if (!trip?.userSelection?.location?.label) return;

        setIsLoadingPhotos(true);
        const data = {
            textQuery: trip.userSelection.location.label,
        };

        try {
            const result = await GetPlaceDetails(data);
            if (result.data?.places?.[0]?.photos?.length > 9) { // Ensure there are at least 10 photos
                const photos = [9].map((index) =>
                    `https://places.googleapis.com/v1/${result.data.places[0].photos[index].name}/media?maxHeightPx=1000&maxWidthPx=1000&key=${import.meta.env.VITE_GOOGLE_PLACE_APIKEY}`
                );
                setPhotoUrl(photos);
            } else {
                setPhotoUrl(["/trip.jpg"]); // Fallback to /trip.jpg if fewer than 10 photos
            }
        } catch (error) {
            console.error("Error fetching place details:", error);
            setPhotoUrl(["/trip.jpg"]); // Fallback on error
        } finally {
            setIsLoadingPhotos(false); // Mark loading as complete
        }
    }, [trip]); // Depend on trip to refetch only when trip changes

    useEffect(() => {
        GetPlacePhotos();
    }, [GetPlacePhotos]); // Use the memoized function in useEffect

    // Handle image loading error (fallback to /trip.jpg if the photo fails to load after some time)
    const handleImageError = (e) => {
        e.target.src = "/trip.jpg"; // Fallback to /trip.jpg if the image fails to load
        e.target.onerror = null; // Prevent infinite loop
    };

    // Skeleton loader for images while loading
    if (isLoadingPhotos) {
        return (
            <Card className="my-4 border-x-4 p-2 rounded-2xl animate-pulse bg-gray-300 dark:bg-gray-700">
                <div className="h-56 w-full rounded-2xl p-2 bg-gray-400 dark:bg-gray-600"></div>
                <div className="my-6 mx-2 space-y-2">
                    <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded w-1/3"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card 
            className="my-4 border-x-4 p-2 cursor-pointer hover:scale-105 transition-all rounded-2xl"
            onClick={onClick}
        >
            <Link to={`/display-trip-details/${trip?.id}`}>
                <div className="font-serif xs:text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl px-1">
                    <img
                        className="h-56 w-full rounded-2xl p-2 object-cover"
                        src={photoUrl.length > 0 ? photoUrl[0] : "/trip.jpg"} // Use the first photo or fallback
                        alt={`${trip?.userSelection?.location?.label || "Trip location"} photo`}
                        onError={handleImageError} // Fallback if image fails to load
                        loading="lazy" // Lazy load images for performance
                    />
                    <div className="my-6 mx-2">
                        <h2 className="font-semibold text-sm md:text-lg mt-2 text-left">
                            📍 {trip?.userSelection?.location?.label || "Unknown Location"}
                        </h2>
                        <h2 className="font-semibold text-sm md:text-lg mt-2 text-left">
                            📅 No of Days: {trip?.userSelection?.noOfDays || "Not specified"}
                        </h2>
                        <h2 className="font-semibold text-sm md:text-lg mt-2 text-left">
                            💰 Budget: {trip?.userSelection?.budget || "Not specified"}
                        </h2>
                        <h2 className="font-semibold text-sm md:text-lg mt-2 text-left">
                            👥 Traveler: {trip?.userSelection?.people || "Not specified"}
                        </h2>
                    </div>
                </div>
            </Link>
        </Card>
    );
}

export default MyTripsCard;