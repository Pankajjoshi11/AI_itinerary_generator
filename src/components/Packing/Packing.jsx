import React from "react";
import { Card } from "@/components/ui/card";

export const Packing = ({ trip }) => {
    const packingList = trip?.tripData?.packingList || {};

    return (
        <Card className="border-y-2 p-5">
            <h1 className="font-bold text-lg sm:text-lg md:text-2xl mt-7 md:mt-10 lg:mt-16 mb-2 text-blue-800 dark:text-customGreen">
                🎒 Packing Details 🎒
            </h1>
            {Object.keys(packingList).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 text-justify gap-3 md:gap-6 xl:gap-6 mt-4">
                    {Object.entries(packingList).map(([day, items]) => (
                        <div
                            key={day}
                            className="text-sm lg:text-base hover:scale-105 transition-all mb-2 border-[1px] md:border-2 dark:border-customGreen border-blue-700 rounded-lg px-2"
                        >
                            <h2 className="font-semibold text-sm md:text-lg mt-2">
                                {day}
                            </h2>
                            <div className="mt-2">
                                <h3 className="font-semibold">Clothing:</h3>
                                <ul className="list-disc pl-5">
                                    {items.Clothing.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-2">
                                <h3 className="font-semibold">Cosmetics:</h3>
                                <ul className="list-disc pl-5">
                                    {items.Cosmetics.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-2">
                                <h3 className="font-semibold">Other Essentials:</h3>
                                <ul className="list-disc pl-5">
                                    {items.OtherEssentials.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No packing details available.</p>
            )}
        </Card>
    );
};

export default Packing;