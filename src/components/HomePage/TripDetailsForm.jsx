import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { chatSession } from "@/services/AImodel";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
    AI_PROMPT_HOTELS,
    SelectTravelerList,
    TripMoodOptions,
    CityBudgets,
} from "../../constants/options.js";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/services/fireBaseConfig";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Slider from "react-slider";
import { FaRupeeSign } from "react-icons/fa";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";

export const TripDetailsForm = () => {
    const { destination } = useParams(); // Get destination from URL
    const [startCity, setStartCity] = useState(null);
    const [startDate, setStartDate] = useState(new Date());
    const [formData, setFormData] = useState({
        location: destination ? { label: destination, value: destination } : null, // Handle undefined destination
        noOfDays: 0,
        budget: 0,
        people: "",
        startCity: null,
        startDate: new Date(),
        mood: "",
        specificPlace: "",
    });
    const [loading, setLoading] = useState(false);
    const [budget, setBudget] = useState(0);
    const [specificPlace, setSpecificPlace] = useState("");
    const [selectedMood, setSelectedMood] = useState("");
    const [approxBudget, setApproxBudget] = useState(null);

    const navigate = useNavigate();

    // Redirect if destination is not provided
    useEffect(() => {
        if (!destination) {
            toast("No destination provided. Redirecting to homepage...");
            navigate("/");
        }
    }, [destination, navigate]);

    const handleInputChanges = (name, value) => {
        const processedValue =
            name === "budget"
                ? parseInt(value, 10) || 0
                : name === "startCity"
                ? value
                : value || "";

        setFormData((prev) => ({
            ...prev,
            [name]: processedValue,
        }));

        if (name === "startCity") {
            updateApproxBudget(processedValue);
        }
        if (name === "specificPlace") {
            setSpecificPlace(value);
        }
        if (name === "mood") {
            setSelectedMood(value);
        }
    };

    const updateApproxBudget = (value) => {
        const city = value?.label || value;
        if (CityBudgets[city]) {
            setApproxBudget(CityBudgets[city]);
            if (formData.budget === 0) {
                handleInputChanges("budget", CityBudgets[city].moderate);
                setBudget(CityBudgets[city].moderate);
            }
        } else {
            setApproxBudget(null);
        }
    };

    const onGenerateTrip = async () => {
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user) {
            toast("Please log in to generate a trip!");
            return;
        }

        if (
            !formData.noOfDays ||
            formData.noOfDays > 15 ||
            formData.noOfDays < 1 ||
            !formData.budget ||
            !formData.people ||
            !formData.startCity ||
            !formData.startDate ||
            !formData.location // Ensure location is present
        ) {
            toast("Please fill all required details!");
            return;
        }

        setLoading(true);
        toast("Patience is a virtue, and awesome things take time. We'll get you there soon!");

        const FINAL_PROMPT = AI_PROMPT_HOTELS
            .replace("{people}", formData.people)
            .replace("{location}", formData.location.label) // This should now be safe
            .replace("{budget}", formData.budget)
            .replace("{mood}", selectedMood || "relaxed");

        try {
            const result = await chatSession.sendMessage(FINAL_PROMPT);
            const responseText = result?.response?.text();
            console.log("-- Generated Itinerary:", responseText);

            const responseJSON = JSON.parse(responseText);

            const docId = Date.now().toString();
            await setDoc(doc(db, "AItrip", docId), {
                userSelection: {
                    ...formData,
                    specificPlace: specificPlace || "",
                    mood: selectedMood || "",
                },
                tripData: { hotels: responseJSON.hotels || [] },
                userEmail: user?.email,
                id: docId,
            });

            setLoading(false);
            navigate(`/view-trip/${docId}`);
        } catch (error) {
            setLoading(false);
            toast("Failed to generate trip. Please try again!");
            console.error("Error generating trip:", error);
        }
    };

    const handleKeyDown = (event) => {
        if (event.keyCode === 38 || event.keyCode === 40) {
            event.preventDefault();
        }
    };

    if (!destination) {
        return null; // Render nothing while redirecting
    }

    return (
        <div className="w-full overflow-hidden px-3 md:px-16 lg:px-24 xl:px-48 font-serif bg-gray-900 text-white min-h-screen">
            <Card className="mt-12 shadow-2xl bg-gray-800 border-none rounded-2xl p-8">
                <CardHeader>
                    <CardTitle className="text-4xl font-bold text-center text-white tracking-wide">
                        Your Trip to {destination} 🏕🌴
                    </CardTitle>
                    <CardDescription className="pt-6 pb-4 text-center md:text-left font-light text-lg tracking-normal text-gray-300">
                        Provide your travel preferences below to create a personalized itinerary.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-8">
                        <div className="grid gap-8">
                            <div className="space-y-4">
                                <Label htmlFor="startCity" className="text-xl font-medium text-green-400">
                                    What is your start city?
                                </Label>
                                <div className="dark:text-slate-800 border-2 border-green-500 bg-gray-700 rounded-lg shadow-md">
                                    <GooglePlacesAutocomplete
                                        apiKey={import.meta.env.VITE_GOOGLE_PLACE_APIKEY}
                                        selectProps={{
                                            startCity,
                                            onChange: (val) => {
                                                setStartCity(val);
                                                handleInputChanges("startCity", val);
                                            },
                                            placeholder: "Search for your start city...",
                                            isClearable: true,
                                        }}
                                        className="text-black"
                                    />
                                </div>
                            </div>
                            {approxBudget && (
                                <div className="space-y-4">
                                    <Label htmlFor="approxBudget" className="text-xl font-medium text-green-400">
                                        Approximate Budget (Based on Start City)
                                    </Label>
                                    <div className="p-4 bg-gray-700 rounded-lg shadow-md text-white">
                                        <p>Low-cost: {approxBudget.low} INR</p>
                                        <p>Moderate: {approxBudget.moderate} INR</p>
                                        <p>Luxury: {approxBudget.luxury} INR</p>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-4">
                                <Label htmlFor="days" className="text-xl font-medium text-green-400">
                                    How many days do you plan to spend on your trip?
                                </Label>
                                <Input
                                    id="days"
                                    type="number"
                                    placeholder="Ex. 3"
                                    min="1"
                                    max="15"
                                    value={formData.noOfDays || ""}
                                    onChange={(e) => handleInputChanges("noOfDays", e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="border-2 border-green-500 bg-gray-700 text-white placeholder-gray-400 rounded-lg shadow-md focus:ring-2 focus:ring-green-400 focus:border-transparent"
                                />
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="startDate" className="text-xl font-medium text-green-400">
                                    When do you plan to start your trip?
                                </Label>
                                <DatePicker
                                    selected={formData.startDate}
                                    onChange={(date) => {
                                        setStartDate(date);
                                        handleInputChanges("startDate", date);
                                    }}
                                    minDate={new Date()}
                                    className="w-full border-2 border-green-500 bg-gray-700 text-white placeholder-gray-400 rounded-lg shadow-md p-2 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                                    dateFormat="yyyy-MM-dd"
                                    placeholderText="Select start date"
                                />
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="budget" className="text-xl font-medium text-green-400">
                                    What's your spending limit? (Excluding Flights)
                                </Label>
                                <div className="p-4 bg-gray-700 rounded-lg shadow-md">
                                    <Slider
                                        className="w-full h-4 mt-2"
                                        thumbClassName="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
                                        trackClassName="h-2 bg-gray-500 rounded-full"
                                        value={budget}
                                        min={approxBudget ? approxBudget.low : 0}
                                        max={approxBudget ? approxBudget.luxury : 100000}
                                        onChange={(value) => {
                                            setBudget(value);
                                            handleInputChanges("budget", value);
                                        }}
                                        renderThumb={(props, state) => (
                                            <div {...props}>
                                                <FaRupeeSign className="text-white" />
                                            </div>
                                        )}
                                    />
                                    <div className="text-white mt-4 text-lg font-medium">
                                        Selected Budget: {budget} INR
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="noOfPeople" className="text-xl font-medium text-green-400">
                                    Who are you planning to travel with on your next adventure?
                                </Label>
                                <div className="grid grid-cols-2 gap-4 mt-6 cursor-pointer text-lg items-center">
                                    {SelectTravelerList.map((item, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleInputChanges("people", item.people)}
                                            className={`p-4 border-2 border-green-500 bg-gray-700 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 ${
                                                formData.people === item.people
                                                    ? "shadow-xl border-green-600 bg-gray-600"
                                                    : ""
                                            }`}
                                        >
                                            <h2 className="font-bold text-white">
                                                <span className="text-2xl text-green-400">{item.icon}</span> {item.title}
                                            </h2>
                                            <h2 className="text-gray-300 mt-2">{item.des}</h2>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="specificPlace" className="text-xl font-medium text-green-400">
                                    Any specific place you want to add to the itinerary? (Optional)
                                </Label>
                                <Input
                                    id="specificPlace"
                                    type="text"
                                    placeholder="Enter a specific place"
                                    value={specificPlace}
                                    onChange={(e) => handleInputChanges("specificPlace", e.target.value)}
                                    className="border-2 border-green-500 bg-gray-700 text-white placeholder-gray-400 rounded-lg shadow-md focus:ring-2 focus:ring-green-400 focus:border-transparent"
                                />
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="tripMood" className="text-xl font-medium text-green-400">
                                    What kind of mood are you looking for in this trip?
                                </Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {TripMoodOptions.map((mood, index) => (
                                        <div
                                            key={index}
                                            onClick={() => {
                                                setSelectedMood(mood.value);
                                                handleInputChanges("mood", mood.value);
                                            }}
                                            className={`p-4 border-2 border-green-500 bg-gray-700 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer ${
                                                formData.mood === mood.value
                                                    ? "shadow-xl border-green-600 bg-gray-600"
                                                    : ""
                                            }`}
                                        >
                                            <div className="text-center">
                                                <span className="text-3xl mb-2 text-green-400">{mood.icon}</span>
                                                <h3 className="text-lg font-semibold text-white">{mood.title}</h3>
                                                <p className="text-sm text-gray-300 mt-1">{mood.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-end mt-8">
                    <Button
                        disabled={loading}
                        onClick={onGenerateTrip}
                        className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-xl font-semibold"
                    >
                        {loading ? (
                            <AiOutlineLoading3Quarters className="h-6 w-6 animate-spin" />
                        ) : (
                            "Generate Trip"
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default TripDetailsForm;