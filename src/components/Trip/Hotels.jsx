import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../ui/card";

export const Hotels = ({ trip }) => {
	return (
		<Card className="border-y-2 p-5 bg-white dark:bg-gray-900 shadow-lg rounded-lg">
			<h1 className="font-bold text-lg md:text-2xl mt-7 md:mt-10 lg:mt-16 mb-4 text-blue-800 dark:text-customGreen text-center">
				🏨 Hotel Recommendations 🏨
			</h1>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{trip?.tripData?.hotels?.map((hotel, index) => (
					<div
						key={index}
						className="bg-white dark:bg-gray-800 border border-blue-700 dark:border-customGreen shadow-md rounded-lg overflow-hidden hover:scale-105 transition-all duration-300"
					>
						<Link
							to={`https://www.google.com/maps/search/?api=1&query=${hotel.HotelName} ${hotel.HotelAddress} ${trip?.userSelection?.location?.label}`}
							target="_blank"
							className="block"
						>
							{/* Hotel Image */}
							<div className="relative">
								<img
									src={hotel.HotelImageURL || "/trip.jpg"}
									alt={`Image of ${hotel.HotelName}`}
									className="w-full h-52 object-cover rounded-t-lg transition-transform duration-300 hover:brightness-75"
									onError={(e) => (e.target.src = "/trip.jpg")}
								/>
							</div>

							{/* Hotel Details */}
							<div className="p-4">
								<h2 className="font-semibold text-lg text-gray-900 dark:text-white">
									🏛️ {hotel.HotelName}
								</h2>
								<p className="text-gray-600 dark:text-gray-300 text-sm">
									{hotel.Description}
								</p>
								<p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
									<span className="font-semibold">📍 Address:</span> {hotel.HotelAddress}
								</p>
								<p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
									<span className="font-semibold">💰 Price:</span> {hotel.Price}
								</p>
								<p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
									<span className="font-semibold">⭐ Rating:</span> {hotel.Rating}
								</p>

								{/* View on Map Button */}
								<div className="mt-4">
									<button className="w-full bg-blue-600 dark:bg-customGreen text-white py-2 rounded-lg text-sm font-semibold transition-transform duration-300 hover:scale-105">
										View on Map
									</button>
								</div>
							</div>
						</Link>
					</div>
				))}
			</div>
		</Card>
	);
};
