import { db } from "@/services/fireBaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { InfoSection } from "../components/Trip/InfoSection";
import { Hotels } from "../components/Trip/Hotels";
import { Itinerary } from "../components/Trip/Itinerary";
import { Card } from "@/components/ui/card";

export const ViewTrip = () => {
	const { tripId } = useParams();

	useEffect(() => {
		if (tripId) {
			getTripData();
		}
	}, [tripId]);

	const [trip, setTrip] = useState([]);

	const getTripData = async () => {
		const docRef = doc(db, "AItrip", tripId);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			setTrip(docSnap.data());
		} else {
			toast("No trip found");
		}
	};

	return (
		<Card className="container my-4 border-x-2 p-5">
			<InfoSection trip={trip} />
			<Hotels trip={trip} />
			<Itinerary trip={trip} />
		</Card>
	);
};
