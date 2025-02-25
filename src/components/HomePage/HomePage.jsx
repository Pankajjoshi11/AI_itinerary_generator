import React, { useEffect, useState, useCallback } from "react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { chatSession } from "@/services/AImodel";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AI_PROMPT_HOTELS,
    TripMoodOptions,
    SelectTravelerList,
    CityBudgets,
} from "@/constants/options";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/services/fireBaseConfig";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Slider from "react-slider";
import { FaRupeeSign } from "react-icons/fa";

export const HomePage = () => {
    const [place, setPlace] = useState(null); // Initialize as null to handle undefined
    const [startCity, setStartCity] = useState(null); // Initialize as null to handle undefined
    const [startDate, setStartDate] = useState(new Date());
    const [formData, setFormData] = useState({
        noOfDays: 0,
        location: null,
        budget: 0,
        people: "",
        startCity: null,
        startDate: new Date(),
        mood: "", // Added mood to formData
        specificPlace: "",
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [approxBudget, setApproxBudget] = useState(null);
    const [budget, setBudget] = useState(0);
    const [specificPlace, setSpecificPlace] = useState(""); // Maintain separate state for specificPlace
    const [selectedMood, setSelectedMood] = useState(""); // Maintain separate state for mood

    // Memoize handleInputChanges to prevent unnecessary re-renders
    const handleInputChanges = useCallback((name, value) => {
        const processedValue = name === "budget" 
            ? parseInt(value, 10) || 0 
            : name === "location" || name === "startCity" 
            ? value 
            : value || "";

        setFormData((prev) => ({
            ...prev,
            [name]: processedValue,
        }));

        if (name === "location" || name === "startCity") {
            updateApproxBudget(processedValue);
        }
        if (name === "specificPlace") {
            setSpecificPlace(value); // Sync specificPlace state
        }
        if (name === "mood") {
            setSelectedMood(value); // Sync mood state
        }
    }, []); // No dependencies needed since it only updates formData

    const updateApproxBudget = (value) => {
        const city = value?.label || value;
        if (CityBudgets[city]) {
            setApproxBudget(CityBudgets[city]);
            // Reset budget slider to moderate if approxBudget changes
            if (formData.budget === 0) {
                handleInputChanges("budget", CityBudgets[city].moderate);
                setBudget(CityBudgets[city].moderate);
            }
        } else {
            setApproxBudget(null);
        }
    };

    useEffect(() => {
        // Log formData for debugging
        console.log("Form Data Updated:", formData);
    }, [formData]);

    const onGenerateTrip = async () => {
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user) {
            setOpenDialog(true);
            return;
        }

        if (
            !formData.noOfDays ||
            formData.noOfDays > 15 ||
            formData.noOfDays < 1 ||
            !formData.location ||
            !formData.budget ||
            !formData.people ||
            !formData.startCity ||
            !formData.startDate
        ) {
            toast("Please fill all required details!");
            return;
        }

        setLoading(true);
        toast(
            "Patience is a virtue, and awesome things take time. We'll get you there soon!"
        );

        const FINAL_PROMPT = AI_PROMPT_HOTELS
            .replace("{people}", formData.people)
            .replace("{location}", formData.location.label)
            .replace("{budget}", formData.budget)
            .replace("{mood}", selectedMood || "relaxed"); // Include mood in the prompt

        try {
            const result = await chatSession.sendMessage(FINAL_PROMPT);
            const responseText = result?.response?.text();
            console.log("Raw AI Response for Hotels:", responseText);

            const responseJSON = JSON.parse(responseText);
            setLoading(false);
            await saveAiTrip(responseJSON);
        } catch (error) {
            console.error("Error generating trip:", error);
            setLoading(false);
            toast.error("Failed to generate trip. Please try again.");
        }
    };

    const navigate = useNavigate();

    const saveAiTrip = async (TripData) => {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user"));
        const docId = Date.now().toString();
        try {
            await setDoc(doc(db, "AItrip", docId), {
                userSelection: {
                    ...formData,
                    specificPlace: specificPlace || "",
                    mood: selectedMood || "", // Include mood in userSelection
                },
                tripData: { hotels: TripData.hotels || [] },
                userEmail: user?.email,
                id: docId,
            });
            setLoading(false);
            navigate("/view-trip/" + docId);
        } catch (error) {
            console.error("Error saving trip to Firestore:", error);
            setLoading(false);
            toast.error("Failed to save trip. Please try again.");
        }
    };

    const handleKeyDown = (event) => {
        if (event.keyCode === 38 || event.keyCode === 40) {
            event.preventDefault();
        }
    };

    return (
        <>
            <div className="w-full overflow-hidden px-3 md:px-16 lg:px-24 xl:px-48 font-serif bg-gray-900 text-white min-h-screen">
                <Card className="mt-12 shadow-2xl bg-gray-800 border-none rounded-2xl p-8">
                    <CardHeader>
                        <CardTitle className="text-4xl font-bold text-center text-white tracking-wide">
                            Please Share Your Travel Preferences with Us🏕🌴
                        </CardTitle>
                        <CardDescription className="pt-6 pb-4 text-center md:text-left font-light text-lg tracking-normal text-gray-300">
                            Simply provide some basic information, and our trip
                            planner will create a personalized itinerary
                            tailored to your preferences.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-8">
                            <div className="grid gap-8">
                                <div className="space-y-4">
                                    <Label
                                        htmlFor="startCity"
                                        className="text-xl font-medium text-green-400"
                                    >
                                        What is your start city?
                                    </Label>
                                    <div className="dark:text-slate-800 border-2 border-green-500 bg-gray-700 rounded-lg shadow-md">
                                        <GooglePlacesAutocomplete
                                            apiKey={
                                                import.meta.env
                                                    .VITE_GOOGLE_PLACE_APIKEY
                                            }
                                            selectProps={{
                                                startCity,
                                                onChange: (val) => {
                                                    setStartCity(val);
                                                    handleInputChanges(
                                                        "startCity",
                                                        val
                                                    );
                                                },
                                                placeholder: "Search for your start city...",
                                                isClearable: true,
                                            }}
                                            className="text-black"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label
                                        htmlFor="name"
                                        className="text-xl font-medium text-green-400"
                                    >
                                        What is your preferred destination?
                                    </Label>
                                    <div className="dark:text-slate-800 border-2 border-green-500 bg-gray-700 rounded-lg shadow-md">
                                        <GooglePlacesAutocomplete
                                            apiKey={
                                                import.meta.env
                                                    .VITE_GOOGLE_PLACE_APIKEY
                                            }
                                            selectProps={{
                                                place,
                                                onChange: (val) => {
                                                    setPlace(val);
                                                    handleInputChanges(
                                                        "location",
                                                        val
                                                    );
                                                },
                                                placeholder: "Search for your destination...",
                                                isClearable: true,
                                            }}
                                            className="text-black"
                                        />
                                    </div>
                                </div>
                                {approxBudget && (
                                    <div className="space-y-4">
                                        <Label
                                            htmlFor="approxBudget"
                                            className="text-xl font-medium text-green-400"
                                        >
                                            Approximate Budget
                                        </Label>
                                        <div className="p-4 bg-gray-700 rounded-lg shadow-md text-white">
                                            <p>Low-cost: {approxBudget.low} INR</p>
                                            <p>Moderate: {approxBudget.moderate} INR</p>
                                            <p>Luxury: {approxBudget.luxury} INR</p>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <Label
                                        htmlFor="days"
                                        className="text-xl font-medium text-green-400"
                                    >
                                        How many days do you plan to spend
                                        on your trip?
                                    </Label>
                                    <Input
                                        id="days"
                                        type="number"
                                        placeholder="Ex. 3"
                                        min="1"
                                        max="15"
                                        value={formData.noOfDays || ""}
                                        onChange={(e) =>
                                            handleInputChanges(
                                                "noOfDays",
                                                e.target.value
                                            )
                                        }
                                        onKeyDown={handleKeyDown}
                                        className="border-2 border-green-500 bg-gray-700 text-white placeholder-gray-400 rounded-lg shadow-md focus:ring-2 focus:ring-green-400 focus:border-transparent"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label
                                        htmlFor="startDate"
                                        className="text-xl font-medium text-green-400"
                                    >
                                        When do you plan to start your trip?
                                    </Label>
                                    <DatePicker
                                        selected={formData.startDate}
                                        onChange={(date) => {
                                            setStartDate(date);
                                            handleInputChanges(
                                                "startDate",
                                                date
                                            );
                                        }}
                                        minDate={new Date()} // Prevent past dates
                                        className="w-full border-2 border-green-500 bg-gray-700 text-white placeholder-gray-400 rounded-lg shadow-md p-2 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                                        dateFormat="yyyy-MM-dd"
                                        placeholderText="Select start date"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label
                                        htmlFor="budget"
                                        className="text-xl font-medium text-green-400"
                                    >
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
                                    <Label
                                        htmlFor="noOfPeople"
                                        className="text-xl font-medium text-green-400"
                                    >
                                        Who are you planning to travel with
                                        on your next adventure?
                                    </Label>
                                    <div className="grid grid-cols-2 gap-4 mt-6 cursor-pointer text-lg items-center">
                                        {SelectTravelerList.map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() =>
                                                        handleInputChanges(
                                                            "people",
                                                            item.people
                                                        )
                                                    }
                                                    className={`p-4 border-2 border-green-500 bg-gray-700 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 ${
                                                        formData.people ===
                                                        item.people
                                                            ? "shadow-xl border-green-600 bg-gray-600"
                                                            : ""
                                                    }`}
                                                >
                                                    <h2 className="font-bold text-white">
                                                        <span className="text-2xl text-green-400">
                                                            {item.icon}
                                                        </span>{" "}
                                                        {item.title}
                                                    </h2>
                                                    <h2 className="text-gray-300 mt-2">
                                                        {item.des}
                                                    </h2>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label
                                        htmlFor="specificPlace"
                                        className="text-xl font-medium text-green-400"
                                    >
                                        Any specific place you want to add to the
                                        itinerary? (Optional)
                                    </Label>
                                    <Input
                                        id="specificPlace"
                                        type="text"
                                        placeholder="Enter a specific place"
                                        value={specificPlace}
                                        onChange={(e) =>
                                            handleInputChanges(
                                                "specificPlace",
                                                e.target.value
                                            )
                                        }
                                        className="border-2 border-green-500 bg-gray-700 text-white placeholder-gray-400 rounded-lg shadow-md focus:ring-2 focus:ring-green-400 focus:border-transparent"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label
                                        htmlFor="tripMood"
                                        className="text-xl font-medium text-green-400"
                                    >
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
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {mood.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-300 mt-1">
                                                        {mood.description}
                                                    </p>
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
        </>
    );
};

export default HomePage;