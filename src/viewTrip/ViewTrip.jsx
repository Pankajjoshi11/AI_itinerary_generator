import { db } from "@/services/fireBaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { InfoSection } from "../components/Trip/InfoSection";
import { Hotels } from "../components/Trip/Hotels";
import { Itinerary } from "../components/Trip/Itinerary";
import { Card } from "@/components/ui/card";
import  Chatbot  from "../components/chatbot/Chatbot";
import EventList from "../components/EventList/Event";
import Map from "@/components/Map/Map";
import { AI_PROMPT_ITINERARY } from "../constants/options"; // Import itinerary prompt
import { chatSession } from "@/services/AImodel";

export const ViewTrip = () => {
	const { tripId } = useParams();
	const [trip, setTrip] = useState(null);
	const [selectedHotel, setSelectedHotel] = useState(null); // Selected hotel
	const [itineraryGenerated, setItineraryGenerated] = useState(false); // Track if itinerary is generated
	const [showEvents, setShowEvents] = useState(false);

	useEffect(() => {
		if (tripId) {
			getTripData();
		}
	}, [tripId]);

	const getTripData = async () => {
		const docRef = doc(db, "AItrip", tripId);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			setTrip({ id: docSnap.id, ...docSnap.data() });
		} else {
			toast("No trip found");
			setTrip(null);
		}
	};

	// Function to generate itinerary using the second prompt
	const generateItinerary = async () => {
		const { userSelection, tripData } = trip;
		const prompt = AI_PROMPT_ITINERARY
			.replace("{noOfDays}", userSelection?.noOfDays || "3")
			.replace("{people}", userSelection?.people || "1 People")
			.replace("{location}", userSelection?.location?.label || "unknown location")
			.replace("{budget}", userSelection?.budget || "Moderate")
			.replace("{startingGeoCoordinates}", selectedHotel.GeoCoordinates);

		const result = await chatSession.sendMessage(prompt); // Use your AI service
		const responseText = result?.response?.text();
		const responseJSON = JSON.parse(responseText);

		// Update Firestore with the itinerary
		await setDoc(
			doc(db, "AItrip", tripId),
			{
				tripData: {
					...tripData,
					itinerary: responseJSON.itinerary || [],
				},
			},
			{ merge: true }
		);

		// Update local state
		setTrip((prev) => ({
			...prev,
			tripData: {
				...prev.tripData,
				itinerary: responseJSON.itinerary || [],
			},
		}));
		setItineraryGenerated(true);
	};

	const handleHotelSelect = (hotel) => {
		setSelectedHotel(hotel);
	};

	const handleShowEvents = () => {
		setShowEvents(true);
	};

	return (
		<div className="container my-4">
			<Card className="border-x-2 p-5">
				<InfoSection trip={trip} />

				{/* Display Hotels for Selection */}
				{trip && !selectedHotel ? (
					<div className="mt-6">
						<h2 className="text-xl font-bold mb-4">Select a Hotel</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{trip.tripData?.hotels.map((hotel, index) => (
								<div
									key={index}
									className="border p-4 rounded-lg cursor-pointer hover:bg-gray-100"
									onClick={() => handleHotelSelect(hotel)}
								>
									<img
										src={hotel.HotelImageURL}
										alt={hotel.HotelName}
										className="w-full h-40 object-cover rounded"
									/>
									<h3 className="text-lg font-semibold mt-2">{hotel.HotelName}</h3>
									<p>{hotel.HotelAddress}</p>
									<p>{hotel.Price}</p>
									<p>Rating: {hotel.Rating}</p>
									<p>{hotel.Description}</p>
								</div>
							))}
						</div>
					</div>
				) : selectedHotel && !itineraryGenerated ? (
					<>
						<Hotels trip={{ ...trip, tripData: { hotels: [selectedHotel] } }} />
						<button
							onClick={generateItinerary}
							className="bg-blue-700 text-white px-4 py-2 rounded mt-4 hover:bg-blue-800 transition-all"
						>
							Generate Itinerary
						</button>
					</>
				) : itineraryGenerated ? (
					<>
						<Hotels trip={{ ...trip, tripData: { hotels: [selectedHotel] } }} />
						<Itinerary trip={trip} />
					</>
				) : (
					<p>Loading hotels...</p>
				)}

				<div className="mt-6">
					<Map tripId={tripId} />
				</div>
				<button
					onClick={handleShowEvents}
					className="bg-customGreen text-white px-4 py-2 rounded mt-4 hover:bg-green-600 transition-all"
				>
					Show Local Events
				</button>
			</Card>

			{trip ? (
				<Chatbot
					tripId={trip.id}
					destination={trip.userSelection?.location?.label}
				/>
			) : (
				<div className="fixed bottom-5 right-5 bg-white p-4 shadow-lg rounded-xl">
					<p>Loading trip data...</p>
				</div>
			)}

			{showEvents && trip && (
				<div className="mt-6">
					<EventList location={trip.userSelection?.location?.label} />
				</div>
			)}
		</div>
	);
};