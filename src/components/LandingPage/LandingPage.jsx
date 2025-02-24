import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthDialog } from "../AuthDialog/AuthDialog";
import { useGoogleAuth } from "@/services/Auth";

export default function LandingPage() {
	const [openDialog, setOpenDialog] = useState(false);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const login = useGoogleAuth(() => {
		setOpenDialog(false);
		navigate("/create-trip");
	});

	useEffect(() => {
		const user = JSON.parse(localStorage.getItem("user"));
		if (user) {
			navigate("/create-trip");
		}
	}, [navigate]);

	// ✅ High-quality single image
	const heroImage = "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0";

	return (
		<>
			<div className="min-h-screen flex flex-col items-center gap-9 -mt-14 md:mt-0 bg-[#1C5253] dark:bg-gray-900 transition-colors duration-500">
				<h1 className="container font-mono font-bold text-3xl md:text-4xl lg:text-[60px] p-1 text-center mt-16">
					<span className="text-[#F3FFC6] dark:text-customGreen leading-tight">
						Explore Your Next Adventure with AI:
					</span>
					<span className="leading-tight text-[#F3FFC6] dark:text-gray-200">
						Customized Itineraries at Your Fingertips
					</span>
				</h1>
				<p className="text-sm md:text-lg lg:text-xl text-center p-1 text-[#F3FFC6] dark:text-gray-400">
					Your dedicated travel companion, crafting personalized journeys that match your passions and your pocket.
				</p>

				{/* ✅ Hero Image */}
				<div className="w-full max-w-3xl mx-auto mt-6">
					<img
						src={heroImage}
						alt="Beautiful Travel Destination"
						className="w-full h-80 md:h-96 lg:h-[500px] object-cover rounded-lg shadow-lg"
					/>
				</div>

				{/* ✅ Get Started Button */}
				<button
					onClick={() => {
						const user = JSON.parse(localStorage.getItem("user"));
						if (user) {
							navigate("/create-trip");
						} else {
							setOpenDialog(true);
						}
					}}
					className="font-sans font-medium transition ease-in-out delay-150 bg-[#306B34] dark:bg-blue-700
						hover:-translate-y-1 hover:scale-110 hover:bg-[#F3FFC6] dark:hover:bg-indigo-600 text-[#F3FFC6] dark:text-white
						duration-300 rounded-lg text-sm lg:text-lg -mt-5 px-4 items-center py-3 lg:py-3 focus:outline-none mb-6"
				>
					Get Started, It's Free!
				</button>
			</div>

			<AuthDialog
				open={openDialog}
				loading={loading}
				onLogin={login}
				onClose={() => setOpenDialog(false)}
			/>
		</>
	);
}