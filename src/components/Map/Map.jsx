import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useEffect } from 'react';

const mapContainerStyle = { width: '100%', height: '400px' };

function Map({ tripId }) {
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Geocode a place name to get lat/lng
  const GOOGLE_MAPS_API_KEY="AIzaSyDDWR3AGG0jClJeNg6D6_gHPHYoHG_tktY";
  const geocodePlace = async (placeName) => {
    try {
      console.log("Geocoding place:", placeName); // Log the place being geocoded
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(placeName)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng, name: placeName, description: `Location: ${placeName}` };
      } else {
        console.warn(`Geocoding failed for ${placeName}: ${data.status}`);
        return null;
      }
    } catch (err) {
      console.error("Geocoding error for", placeName, ":", err);
      return null;
    }
  };

  // Fetch itinerary and geocode places
  useEffect(() => {
    const fetchItineraryAndGeocode = async () => {
      if (!tripId) {
        setLoading(false);
        console.log("No tripId provided");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch trip data from Firebase
        console.log("Fetching trip data for tripId:", tripId);
        const docRef = doc(db, "AItrip", tripId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const tripData = docSnap.data();
          console.log("Trip Data:", tripData); // Log the full trip data
          const itinerary = tripData.itinerary || []; // Assume itinerary is an array of objects with placeName

          // Extract placeName from itinerary
          const placeNames = itinerary.map((item) => item.placeName).filter(Boolean);
          console.log("Place Names found:", placeNames);

          // Geocode each placeName
          const geocodedMarkers = [];
          for (const placeName of placeNames) {
            const marker = await geocodePlace(placeName);
            if (marker) geocodedMarkers.push(marker);
          }

          console.log("Geocoded Markers:", geocodedMarkers);
          setMarkers(geocodedMarkers);
        } else {
          setError("No trip found for this ID");
          console.error("Trip not found for tripId:", tripId);
        }
      } catch (err) {
        console.error("Error fetching itinerary:", err);
        setError("Failed to load itinerary or geocode locations.");
      } finally {
        setLoading(false);
      }
    };

    fetchItineraryAndGeocode();
  }, [tripId]);

  const center = markers.length > 0 
    ? { lat: markers[0].lat, lng: markers[0].lng }
    : { lat: 20.5937, lng: 78.9629 }; // Center of India

  if (loading) return <div>Loading map...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={6}
      >
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={{ lat: marker.lat, lng: marker.lng }}
            onClick={() => setSelectedMarker(marker)}
          />
        ))}
        
        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(marker)}
          >
            <div>
              <h3 className="font-bold">{selectedMarker.name}</h3>
              <p>{selectedMarker.description}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}

// Import Firebase functions (add this at the top of the file)
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/fireBaseConfig";

export default Map;