import React, { useEffect, useState } from "react";
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
    SelectBudgetOptions,
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
    const [place, setPlace] = useState();
    const [startCity, setStartCity] = useState();
    const [startDate, setStartDate] = useState(new Date());
    const [formData, setFormData] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [approxBudget, setApproxBudget] = useState(null);
    const [budget, setBudget] = useState(0);

    const handleInputChanges = (name, value) => {
        setFormData({
            ...formData,
            [name]: value,
        });

        if (name === "location" || name === "startCity") {
            updateApproxBudget(value);
        }
    };

    const updateApproxBudget = (value) => {
        const city = value?.label || value;
        if (CityBudgets[city]) {
            setApproxBudget(CityBudgets[city]);
        } else {
            setApproxBudget(null);
        }
    };

    useEffect(() => {}, [formData]);

    const onGenerateTrip = async () => {
        const user = localStorage.getItem("user");

        if (!user) {
            setOpenDialog(true);
            return;
        }

        if (
            formData?.noOfDays > 15 ||
            formData?.noOfDays < 1 ||
            !formData?.location ||
            !formData?.budget ||
            !formData?.people ||
            !formData?.startCity ||
            !formData?.startDate
        ) {
            toast("Please fill all details!");
            return;
        }

        setLoading(true);
        toast(
            "Patience is a virtue, and awesome things take time. We'll get you there soon!"
        );

        const FINAL_PROMPT = AI_PROMPT_HOTELS
            .replace("{people}", formData?.people)
            .replace("{location}", formData?.location?.label)
            .replace("{budget}", formData?.budget);

        const result = await chatSession.sendMessage(FINAL_PROMPT);
        const responseText = result?.response?.text();
        console.log("--", responseText);

        const responseJSON = JSON.parse(responseText);
        setLoading(false);
        saveAiTrip(responseJSON);
    };

    const navigate = useNavigate();

    const saveAiTrip = async (TripData) => {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("user"));
        const docId = Date.now().toString();
        await setDoc(doc(db, "AItrip", docId), {
            userSelection: formData,
            tripData: { hotels: TripData.hotels || [] }, // Only hotels initially
            userEmail: user?.email,
            id: docId,
        });
        setLoading(false);
        navigate("/view-trip/" + docId);
    };

    const handleKeyDown = (event) => {
        if (event.keyCode === 38 || event.keyCode === 40) {
            event.preventDefault();
        }
    };

    return (
        <>
            <div className="w-full overflow-hidden px-3 md:px-14 lg:px-14 xl:px-40 font-serif ">
                <Card className="mt-6 border-y-4 p-6">
                    <CardHeader>
                        <CardTitle className="pt-5  text-left text-lg md:text-2xl lg:text-3xl font-bold tracking-wider md:tracking-widest">
                            Please share your travel preferences with us🏕️🌴
                        </CardTitle>
                        <CardDescription className="pt-5 pb-3 text-justify md:text-left font-light text-sm md:text-lg lg:text-xl tracking-tighter md:tracking-widest">
                            Simply provide some basic information, and our trip
                            planner will create a personalized itinerary
                            tailored to your preferences.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form>
                            <div className="grid w-full items-center">
                                <div className="flex flex-col space-y-10">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="startCity"
                                            className="text-base md:text-lg"
                                        >
                                            What is your start city?
                                        </Label>
                                        <div className="dark:text-slate-800 border-2 dark:border-customGreen border-blue-700">
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
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="name"
                                            className="text-base md:text-lg"
                                        >
                                            What is your preferred destination?
                                        </Label>
                                        <div className="dark:text-slate-800 border-2 dark:border-customGreen border-blue-700">
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
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {approxBudget && (
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="approxBudget"
                                                className="text-base md:text-lg"
                                            >
                                                Approximate Budget
                                            </Label>
                                            <div className="text-slate-800">
                                                <p>Low-cost: {approxBudget.low}</p>
                                                <p>Moderate: {approxBudget.moderate}</p>
                                                <p>Luxury: {approxBudget.luxury}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <Label
                                            htmlFor="days"
                                            className="text-base md:text-lg"
                                        >
                                            How many days do you plan to spend
                                            on your trip?
                                        </Label>
                                        <Input
                                            id="days"
                                            type="number"
                                            placeholder="ex. 3"
                                            min="0"
                                            onChange={(e) =>
                                                handleInputChanges(
                                                    "noOfDays",
                                                    e.target.value
                                                )
                                            }
                                            onKeyDown={handleKeyDown}
                                            className="border-2 dark:border-customGreen border-blue-700 bg-white text-slate-800 "
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="startDate"
                                            className="text-base md:text-lg"
                                        >
                                            When do you plan to start your trip?
                                        </Label>
                                        <DatePicker
                                            selected={startDate}
                                            onChange={(date) => {
                                                setStartDate(date);
                                                handleInputChanges(
                                                    "startDate",
                                                    date
                                                );
                                            }}
                                            className="border-2 dark:border-customGreen border-blue-700 bg-white text-slate-800 w-full"
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="budget"
                                            className="text-base md:text-lg"
                                        >
                                            What's your spending limit?
                                        </Label>
                                        <Slider
                                            className="w-full h-6 mt-2"
                                            thumbClassName="h-6 w-6 bg-blue-700 rounded-full flex items-center justify-center cursor-pointer"
                                            trackClassName="h-2 bg-gray-300"
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
                                        <div className="text-white mt-2">
                                            Selected Budget: {budget}
                                        </div>
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="noOfPeople"
                                            className="text-base md:text-lg"
                                        >
                                            Who are you planning to travel with
                                            on your next adventure?
                                        </Label>
                                        <div className="grid grid-cols-2 mt-5 cursor-pointer text-[14px] md:text-base lg:text-base items-center text-center">
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
                                                        className={`p-1 m-1 md:p-4 md:m-3 border-2 mb-2 rounded-lg dark:border-customGreen border-blue-700 hover:shadow-lg dark:hover:shadow-customGreen hover:shadow-blue-700  ${
                                                            formData?.people ===
                                                                item.people &&
                                                            `shadow-lg border-2 dark:shadow-customGreen shadow-blue-700`
                                                        }`}
                                                    >
                                                        <h2 className="font-bold">
                                                            <span className="text-xl">
                                                                {item.icon}
                                                            </span>{" "}
                                                            {item.title}
                                                        </h2>
                                                        <h2 className="text-gray-600 dark:text-gray-400">
                                                            {item.des}
                                                        </h2>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-end mt-5">
                        <Button
                            disabled={loading}
                            onClick={onGenerateTrip}
                            className="bg-blue-700 hover:bg-indigo-700 dark:text-white hover:shadow-xl transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-100 md:text-lg"
                        >
                            {loading ? (
                                <AiOutlineLoading3Quarters className="h-7 w-7 animate-spin" />
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