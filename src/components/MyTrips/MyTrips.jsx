import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/services/fireBaseConfig";
import MyTripsCard from "./MyTripsCard";
import { Card } from "../ui/card";
import { Chatbot } from "../chatbot/Chatbot"; // Import Chatbot component

export const MyTrips = () => {
	const navigate = useNavigate();
	const [userTrips, setUserTrips] = useState([]);

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
					trips.push(doc.data()); // Accumulate trips
				});
				setUserTrips(trips); // Set all trips at once
			} catch (error) {
				console.error("Error fetching user trips: ", error);
			}
		};

		fetchUserTrips();
	}, [navigate]);

	return (
		<div className="container font-serif">
			<Card className="mt-5 border-x-2 p-2">
				<h1 className="font-bold text-xl sm:text-2xl md:text-4xl lg:text-5xl mt-6 md:mt-10 lg:mt-10 mb-5 dark:text-customGreen text-blue-700">
					My Trips 🏕️🌴
				</h1>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 text-justify gap-3 md:gap-6 xl:gap-6">
					{userTrips?.length > 0
						? userTrips.map((trip, index) => (
								<MyTripsCard key={index} trip={trip} />
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
			{/* <Chatbot tripId={trip.id} destination={trip.destination}/> */}
		</div>
	);
};
