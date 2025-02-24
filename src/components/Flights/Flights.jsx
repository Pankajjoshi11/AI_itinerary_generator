import React from "react";
import { Card } from "../ui/card";

export const Flights = ({ trip }) => {
    const flights = trip?.tripData?.flights || [];

    return (
        <Card className="border-y-2 p-5">
            <h1 className="font-bold text-lg sm:text-lg md:text-2xl mt-7 md:mt-10 lg:mt-16 mb-2 text-blue-800 dark:text-customGreen">
                ✈️ Flight Options ✈️
            </h1>
            {flights.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 text-justify gap-3 md:gap-6 xl:gap-6 mt-4">
                    {flights.map((flight, index) => (
                        <div
                            key={index}
                            className="text-sm lg:text-base hover:scale-105 transition-all mb-2 border-[1px] md:border-2 dark:border-customGreen border-blue-700 rounded-lg px-2 cursor-pointer"
                        >
                            <a
                                href={flight.BookingURL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <h2 className="font-semibold text-sm md:text-lg mt-2">
                                    🛫 {flight.AirlineName} - {flight.FlightNumber}
                                </h2>
                                <p className="my-2">
                                    <span className="font-semibold">From: </span>
                                    {flight.DepartureAirport} at {flight.DepartureTime}
                                </p>
                                <p className="my-2">
                                    <span className="font-semibold">To: </span>
                                    {flight.ArrivalAirport} at {flight.ArrivalTime}
                                </p>
                                <p className="my-2">
                                    <span className="font-semibold">Duration: </span>
                                    {flight.FlightDuration}
                                </p>
                                <p className="my-2">
                                    <span className="font-semibold">Price: </span>
                                    {flight.Price}
                                </p>
                            </a>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No flight options available.</p>
            )}
        </Card>
    );
};