export const SelectTravelerList = [
	{
		id: 1,
		title: "Just me",
		des: "A solo traveler in exploration",
		icon: "🚀",
		people: "1 People",
	},
	{
		id: 2,
		title: "A Couple",
		des: "Two travelers in tandem",
		icon: "🥂",
		people: "a couple",
	},
	{
		id: 3,
		title: "Family",
		des: "A group of fun loving adventure",
		icon: "🏡",
		people: "3-5 People",
	},
	{
		id: 4,
		title: "Friends",
		des: "A group of thrill-seekers",
		icon: "👥",
		people: "5-10 People",
	},
];
export const CityBudgets = {
    "New Delhi": {
        low: 15000,
        moderate: 30000,
        luxury: 45000,
    },
    "Dubai": {
        low: 45000,
        moderate: 90000,
        luxury: 135000,
    },
    // Add more cities and their budgets here
};
export const SelectBudgetOptions = [
	{
		id: 1,
		title: "Low-cost",
		des: "Stay conscious of costs",
		icon: "💵",
	},
	{
		id: 2,
		title: "Moderate",
		des: "Keep cost on the avg side",
		icon: "💰",
	},
	{
		id: 3,
		title: "Luxury",
		des: "Don't worry about cost",
		icon: "💸",
	},
];

export const AI_PROMPT_FLIGHTS = 
    "Generate a list of flight options for {people} traveling from {fromLocation} to {toLocation} on {date} within a budget of {budget} INR. Return the result as a JSON array where each element contains: AirlineName, FlightNumber, DepartureTime, ArrivalTime, DepartureAirport, ArrivalAirport, Price, FlightDuration, and BookingURL. Example: [{'AirlineName': 'Example', ...}, ...].";
/* prettier-ignore */
export const AI_PROMPT =
	"Generate a {noOfDays}-days travel plan for a {people} in {location} on a {budget} budget. \n\nProvide: 1. A list of \"hotels\" with the following details: HotelName, HotelAddress, Price, HotelImageURL from Google images, GeoCoordinates, Rating, and Description.\n\t      2. Suggest an \"itinerary\" including- PlaceName, PlaceDetails, PlaceImageURL, GeoCoordinates, TicketPricing, TravelTime to Each Location, and the Best Time to Visit.\n\t\t\t\nPresent this information in JSON format.";

export const AI_PROMPT_HOTELS =
    "Generate a list of hotels for a {people} in {location} on a budget where the hotel prices are approximately half of {budget} INR. Provide the following details for each hotel: HotelName, HotelAddress, Price, HotelImageURL from Google images, GeoCoordinates, Rating, and Description. Present this information in JSON format.";
/* prettier-ignore */
export const AI_PROMPT_ITINERARY =
    "Generate a {noOfDays}-days travel itinerary for {people} in {location} starting on {startDate} (in YYYY-MM-DD format) on an approximate {budget} INR budget, beginning from the hotel at GeoCoordinates {startingGeoCoordinates}. Include {specificPlace} as a mandatory stop in the itinerary if provided, ensuring no user-requested locations are missed. Suggest an itinerary with activities ordered logically based on proximity and travel efficiency, starting with locations closest to the hotel and progressing outward or in a practical travel sequence, tailored to the season at {location} during {startDate} (e.g., summer, winter, monsoon, considering weather and seasonal events). For each activity, include: PlaceName, PlaceDetails, PlaceImageURL, GeoCoordinates, TicketPricing, TravelTime from the previous location (or hotel for the first activity), BestTimeToVisit, and HowToTravel (suggest a mode of transportation such as train, bus, local vehicle, car, or plane, explicitly stating the starting point, e.g., 'Taxi from hotel' for the first activity or 'Bus from [previous PlaceName]' for subsequent activities, considering distance, budget, and practicality). Present this information in JSON format. At the end, provide an 'ApproximateTotalBudget' field (in INR) for the entire trip, excluding flight costs but including all local transportation costs at the destination based on the suggested HowToTravel options.";

// src/constants/options.js
// src/constants/options.js
export const AI_PROMPT_PACKING = 
    "Generate a detailed packing list for a trip to {location} lasting {noOfDays} days, starting on {startDate} (in YYYY-MM-DD format), during the {season} season at the destination. Base the packing list on the following itinerary activities: {itineraryActivities}. Consider the location’s weather during the {season} season at {startDate}, the specific activities planned each day, and practical needs for travel efficiency. For each day, provide a list of packing items categorized into: Clothing, Cosmetics, and OtherEssentials. For the Clothing category, recommend activity-specific attire based on the PlaceName and PlaceDetails in the itinerary: use swimsuits and beachwear for beach-related activities, sports tracks and athletic wear for treks or outdoor physical activities, party wear (e.g., dresses, stylish outfits) for club or nightlife activities, and casual wear (e.g., jeans, t-shirts) for museum visits or city tours, adjusting for the season (e.g., add layers like jackets for cold weather). For Cosmetics, suggest items like sunscreen for beach days or moisturizer for cold weather. For OtherEssentials, include items like umbrellas, water bottles, or hiking gear based on the activity and season. Present the packing list in JSON format with a structure like: { 'Day 1': { 'Clothing': [], 'Cosmetics': [], 'OtherEssentials': [] }, 'Day 2': {...}, ... }. Ensure the recommendations are practical, season-appropriate, and aligned with the activities.";

// ... other prompts ...
// ... other prompts ...