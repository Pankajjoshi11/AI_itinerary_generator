import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Added useParams for potential URL-based tripId
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/services/fireBaseConfig";
import MyTripsCard from "./MyTripsCard";
import { Card } from "../ui/card";
import  Chatbot  from "../chatbot/Chatbot";

export const MyTrips = () => {
	const navigate = useNavigate();
	const { tripId } = useParams(); // Extract tripId from URL if available
	const [userTrips, setUserTrips] = useState([]);
	const [selectedTrip, setSelectedTrip] = useState(null); // Store the specific trip for Chatbot

	useEffect(() => {
		const fetchUserTrips = async () => {
			const user = JSON.parse(localStorage.getItem("user"));
			if (!user) {
				navigate("/create-trip");
				return;
			}

			try {
				const q = query(
					collection(db, "AItrip"),
					where("userEmail", "==", user.email)
				);
				const querySnapshot = await getDocs(q);
				const trips = [];
				querySnapshot.forEach((doc) => {
					trips.push({ id: doc.id, ...doc.data() });
				});
				setUserTrips(trips);

				// Set the selected trip (either from URL or first trip)
				if (tripId) {
					const docRef = doc(db, "AItrip", tripId);
					const docSnap = await getDoc(docRef);
					if (docSnap.exists()) {
						setSelectedTrip({ id: docSnap.id, ...docSnap.data() });
					}
				} else if (trips.length > 0) {
					setSelectedTrip(trips[0]); // Default to first trip if no tripId
				}
			} catch (error) {
				console.error("Error fetching user trips: ", error);
			}
		};

		fetchUserTrips();
	}, [navigate, tripId]);

	return (
		<div className="container font-serif">
			<Card className="mt-5 border-x-2 p-2">
				<h1 className="font-bold text-xl sm:text-2xl md:text-4xl lg:text-5xl mt-6 md:mt-10 lg:mt-10 mb-5 dark:text-customGreen text-blue-700">
					My Trips 🏕️🌴
				</h1>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 text-justify gap-3 md:gap-6 xl:gap-6">
					{userTrips?.length > 0
						? userTrips.map((trip, index) => (
								<MyTripsCard key={trip.id} trip={trip} />
						  ))
						: [1, 2, 3, 4, 5].map((item, index) => (
								<div
									key={index}
									className="h-56 w-full bg-slate-300 dark:bg-slate-800 animate-pulse rounded-2xl p-2"
								></div>
						  ))}
				</div>
			</Card>
			{/* Chatbot Component Positioned at Bottom Right */}
			{selectedTrip ? (
				<Chatbot
					tripId={selectedTrip.id}
					destination={selectedTrip.userSelection?.location?.label}
				/>
			) : (
				<div className="fixed bottom-5 right-5 bg-white p-4 shadow-lg rounded-xl">
					<p>No trips available for chatbot.</p>
				</div>
			)}
		</div>
	);
};