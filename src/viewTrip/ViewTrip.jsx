import { db } from "@/services/fireBaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { InfoSection } from "../components/Trip/InfoSection";
import { Hotels } from "../components/Trip/Hotels";
import { Itinerary } from "../components/Trip/Itinerary";
import { Card } from "@/components/ui/card";
import { Chatbot } from "../components/chatbot/Chatbot"; // Keep if needed
import EventList from "../components/EventList/Event"; // Import EventList
import Map from "@/components/Map/Map";

export const ViewTrip = () => {
	const { tripId } = useParams();
	const [trip, setTrip] = useState(null); // Initialize as null for clarity
	const [showEvents, setShowEvents] = useState(false); // State to toggle EventList

	useEffect(() => {
		if (tripId) {
			getTripData();
		}
	}, [tripId]);

	const getTripData = async () => {
		const docRef = doc(db, "AItrip", tripId);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			setTrip({ id: docSnap.id, ...docSnap.data() }); // Include id
		} else {
			toast("No trip found");
			setTrip(null); // Reset on error
		}
	};

	const handleShowEvents = () => {
		setShowEvents(true); // Toggle to show EventList
	};

	return (
		<div className="container my-4">
			<Card className="border-x-2 p-5">
				<InfoSection trip={trip} />
				<Hotels trip={trip} />
				<Itinerary trip={trip} />
				<div className="mt-6">
					<Map tripId={tripId} />
				</div>
				{/* Button to show events */}
				<button
					onClick={handleShowEvents}
					className="bg-customGreen text-white px-4 py-2 rounded mt-4 hover:bg-green-600 transition-all"
				>
					Show Local Events
				</button>

			</Card>
			{/* Chatbot (optional, keep if needed) */}
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
			{/* EventList Component (conditionally rendered) */}
			{showEvents && trip && (
				<div className="mt-6">
					<EventList location={trip.userSelection?.location?.label} />
				</div>
			)}
		</div>
	);
};