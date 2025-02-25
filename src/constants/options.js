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
export const TripMoodOptions = [
    {
        title: "Adventurous",
        icon: "🏃‍♂",
        description: "Thrilling activities and exciting experiences",
        value: "adventurous"
    },
    {
        title: "Romantic",
        icon: "💑",
        description: "Intimate and memorable moments",
        value: "romantic"
    },
    {
        title: "Relaxing",
        icon: "🌴",
        description: "Peaceful and rejuvenating experiences",
        value: "relaxing"
    },
    {
        title: "Cultural",
        icon: "🏛",
        description: "Rich in history and local traditions",
        value: "cultural"
    },
    {
        title: "Party",
        icon: "🎉",
        description: "Vibrant nightlife and social scenes",
        value: "party"
    },
    {
        title: "Family-Friendly",
        icon: "👨‍👩‍👧‍👦",
        description: "Activities suitable for all ages",
        value: "family"
    }
];
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
	"Generate a {noOfDays}-days travel plan for a {people} in {location} on a {budget} budget. \n\nProvide: 1. A list of \"hotels\" with the following details: HotelName, HotelAddress, Price, HotelImageURL from Google images, GeoCoordinates, Rating, and Description.\n\t      2. Suggest an \"itinerary\" including- PlaceName, PlaceDetails, PlaceImageURL, GeoCoordinates, TicketPricing, TravelTime to Each Location, and the Best Time to Visit The trip should have a {mood} mood....\n\t\t\t\nPresent this information in JSON format.";

export const AI_PROMPT_HOTELS =
    "Generate a list of hotels for a {people} in {location} on a budget where the hotel prices are approximately half of {budget} INR. Provide the following details for each hotel: HotelName, HotelAddress, Price, HotelImageURL from Google images, GeoCoordinates, Rating, and Description. Present this information in JSON format.";
/* prettier-ignore */
export const AI_PROMPT_ITINERARY =
    "Generate a {noOfDays}-days travel itinerary for {people} in {location} starting on {startDate} (in YYYY-MM-DD format) on an approximate {budget} INR budget, beginning from the hotel at GeoCoordinates {startingGeoCoordinates}. Include {specificPlace} as a mandatory stop in the itinerary if provided, ensuring no user-requested locations are missed. Suggest an itinerary with activities ordered logically based on proximity and travel efficiency, starting with locations closest to the hotel and progressing outward or in a practical travel sequence, tailored to the season at {location} during {startDate} (e.g., summer, winter, monsoon, considering weather and seasonal events) and the user’s preferred {mood} (e.g., adventurous, romantic, relaxing, cultural, party, family-friendly) as the overarching theme for the entire trip. For each activity, ensure the first activity of each day starts from the hotel, with the first activity of the first day being within 20 minutes by taxi from the hotel. For subsequent activities within each day, measure TravelTime and HowToTravel from the previous location, prioritizing famous, tourist-worthy places near each other that align with the {mood} as the trip’s theme. Include: PlaceName, PlaceDetails, PlaceImageURL, GeoCoordinates, TicketPricing, TravelTime from the previous location (or hotel for the first activity of each day), BestTimeToVisit, and HowToTravel (suggest a mode of transportation such as train, bus, local vehicle, car, or plane, explicitly stating the starting point, e.g., 'Taxi from hotel' for the first activity of each day or 'Bus from [previous PlaceName]' for subsequent activities, considering distance, budget, and practicality). Present this information in JSON format. At the end, provide an 'ApproximateTotalBudget' field (in INR) for the entire trip, excluding flight costs, calculated as follows: allocate approximately 60% of {budget} to hotel costs (determined by multiplying {noOfDays} by a daily hotel rate suitable for {location}), and use the remaining budget for activities and all local transportation costs based on the suggested HowToTravel options, ensuring the total does not exceed {budget} INR. Include a 'Breakdown' field in the JSON output detailing 'HotelCost' and 'ActivityAndTransportCost'."
export const AI_PROMPT_PACKING = 
    "Generate a detailed packing list for a trip to {location} lasting {noOfDays} days, starting on {startDate} (in YYYY-MM-DD format), during the {season} season at the destination. Base the packing list on the following itinerary activities: {itineraryActivities}. Consider the location’s weather during the {season} season at {startDate}, the specific activities planned each day, and practical needs for travel efficiency. For each day, provide a list of packing items categorized into: Clothing, Cosmetics, and OtherEssentials. For the Clothing category, recommend activity-specific attire based on the PlaceName and PlaceDetails in the itinerary: use swimsuits and beachwear for beach-related activities, sports tracks and athletic wear for treks or outdoor physical activities, party wear (e.g., dresses, stylish outfits) for club or nightlife activities, and casual wear (e.g., jeans, t-shirts) for museum visits or city tours, adjusting for the season (e.g., add layers like jackets for cold weather). For Cosmetics, suggest items like sunscreen for beach days or moisturizer for cold weather. For OtherEssentials, include items like umbrellas, water bottles, or hiking gear based on the activity and season. Present the packing list in JSON format with a structure like: { 'Day 1': { 'Clothing': [], 'Cosmetics': [], 'OtherEssentials': [] }, 'Day 2': {...}, ... }. Ensure the recommendations are practical, season-appropriate, and aligned with the activities.";

// ... other prompts ...
// ... other prompts ...

export const AI_PROMPT_SHOPPING =
    "Generate a detailed list of famous shopping locations/areas for a trip to {location} lasting {noOfDays} days, starting on {startDate} (in YYYY-MM-DD format), during the {season} season at the destination. Base the shopping recommendations on the following itinerary activities: {itineraryActivities}. Suggest at least two famous shopping spots per trip, prioritizing markets or areas known for accessories, clothes, or other travel-related items. For each shopping location, include: PlaceName, PlaceDetails (describing what the market is famous for, e.g., traditional Rajasthani culture accessories and clothes), PlaceImageURL, GeoCoordinates, RecommendedDay (the most convenient day to visit based on proximity to the nearest itinerary location/activity on that day, e.g., 'Day 3' for Bapu Bazaar in Jaipur if visiting Jaipur on the 3rd day), and NearestItineraryLocation (the name of the nearest itinerary activity or place on the RecommendedDay, e.g., 'India Gate' if it’s the closest activity on Day 3). Consider the location’s cultural significance, the season at {startDate}, and the practicality of visiting during the trip, ensuring the recommendations align with the itinerary’s travel efficiency and the user’s budget ({budget} INR). Use GeoCoordinates from both shopping spots and itinerary activities to determine proximity, prioritizing travel time under 30 minutes by common transport like taxi, auto-rickshaw, or metro. Present the shopping list in JSON format with a structure like: { 'ShoppingSpots': [{ 'PlaceName': '', 'PlaceDetails': '', 'PlaceImageURL': '', 'GeoCoordinates': { 'latitude': 0, 'longitude': 0 }, 'RecommendedDay': '', 'NearestItineraryLocation': '' }, ...] }. Ensure the recommendations are practical, season-appropriate, and relevant to the activities and locations in the itinerary.";

export const AI_PROMPT_RECOMMENDATIONS =
    "Based on the following past trips: {pastTrips}, recommend 3-5 new travel destinations for a user. For each destination, analyze the past trips' locations ({pastLocations}), budgets ({pastBudgets}), traveler types ({pastTravelers}), and trip durations ({pastDays}) to suggest destinations that align with the user’s preferences but are distinct from past locations. For each recommended destination, provide: DestinationName, ReasonForRecommendation (why it matches the user’s past preferences, e.g., similar budget range, climate, or activity type), DestinationImageURL (from Google Images), GeoCoordinates, SuggestedNoOfDays (based on past trip durations), SuggestedBudget (in INR, aligned with past budgets), and SuggestedTravelerType (e.g., 'Just me', 'A Couple', 'Family', 'Friends'). Present the recommendations in JSON format with a structure like: { 'RecommendedDestinations': [{ 'DestinationName': '', 'ReasonForRecommendation': '', 'DestinationImageURL': '', 'GeoCoordinates': { 'latitude': 0, 'longitude': 0 }, 'SuggestedNoOfDays': 0, 'SuggestedBudget': 0, 'SuggestedTravelerType': '' }, ...] }. Ensure the recommendations are practical, unique (not repeating past locations), and tailored to the user’s travel history.";