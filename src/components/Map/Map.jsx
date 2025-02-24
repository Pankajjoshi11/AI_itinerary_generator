// Map.jsx
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useMemo, useEffect } from 'react';

const mapContainerStyle = {
    width: '100%',
    height: '500px'
};

function Map({ trip }) {
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [error, setError] = useState(null);

    // Use useEffect to log trip data for debugging
    useEffect(() => {
        if (!trip) {
            console.warn("Trip data is missing or invalid:", trip);
        } else {
            console.log("Trip data in Map:", trip);
        }
    }, [trip]);

    // Use useMemo to memoize markers to prevent unnecessary re-renders
    const markers = useMemo(() => {
        // Check if trip, tripData, and itinerary exist and are in the correct format
        if (!trip || !trip.tripData || !trip.tripData.itinerary) {
            console.warn("Trip data, tripData, or itinerary is missing or invalid:", trip);
            return [];
        }

        // Handle cases where itinerary might not be an array
        let itineraryArray = [];
        if (Array.isArray(trip.tripData.itinerary)) {
            itineraryArray = trip.tripData.itinerary;
        } else if (typeof trip.tripData.itinerary === 'object' && trip.tripData.itinerary !== null) {
            // If it's an object, try to convert it to an array (e.g., if it's a single day or nested structure)
            itineraryArray = Object.values(trip.tripData.itinerary).flat();
        } else {
            console.warn("Itinerary is not in an expected format:", trip.tripData.itinerary);
            return [];
        }

        // Extract markers from the itinerary array, handling both 'Activities' and 'activities'
        return itineraryArray.flatMap(day => 
            ((day.Activities || day.activities || []).filter(Boolean)).map(activity => ({
                lat: activity.GeoCoordinates?.latitude || 0, // Fallback to 0 if undefined
                lng: activity.GeoCoordinates?.longitude || 0, // Fallback to 0 if undefined
                name: activity.PlaceName || 'Unknown Location',
                details: activity.PlaceDetails || 'No details available'
            }))
        ).filter(marker => marker.lat !== 0 && marker.lng !== 0); // Filter out invalid (0,0) coordinates
    }, [trip]);

    // Calculate center point based on markers, default to Delhi if no valid markers
    const center = useMemo(() => {
        if (markers.length === 0) return { lat: 28.6139, lng: 77.2090 }; // Default to Delhi, India
        return {
            lat: markers.reduce((sum, m) => sum + m.lat, 0) / markers.length,
            lng: markers.reduce((sum, m) => sum + m.lng, 0) / markers.length
        };
    }, [markers]);

    if (!trip) {
        return <div className="text-center text-white">Loading map...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500">{error}</div>;
    }

    console.log("Markers:", markers);
    console.log("Center:", center);
    console.log("Trip Itinerary in Map:", trip.tripData.itinerary);

    return (
        <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            onError={(e) => setError(`Failed to load Google Maps: ${e.message}`)}
        >
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={markers.length > 1 ? 11 : 15} // Adjust zoom based on number of markers
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                }}
            >
                {markers.map((marker, index) => (
                    <Marker
                        key={index}
                        position={{ lat: marker.lat, lng: marker.lng }}
                        onClick={() => setSelectedMarker(marker)}
                        title={marker.name}
                    />
                ))}

                {selectedMarker && (
                    <InfoWindow
                        position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                        onCloseClick={() => setSelectedMarker(null)}
                    >
                        <div className="max-w-[200px] text-black">
                            <h3 className="font-bold text-lg">{selectedMarker.name}</h3>
                            <p className="text-sm">{selectedMarker.details}</p>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </LoadScript>
    );
}

export default Map;