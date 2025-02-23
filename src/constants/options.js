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

/* prettier-ignore */
export const AI_PROMPT =
	"Generate a {noOfDays}-days travel plan for a {people} in {location} on a {budget} budget. \n\nProvide: 1. A list of \"hotels\" with the following details: HotelName, HotelAddress, Price, HotelImageURL from Google images, GeoCoordinates, Rating, and Description.\n\t      2. Suggest an \"itinerary\" including- PlaceName, PlaceDetails, PlaceImageURL, GeoCoordinates, TicketPricing, TravelTime to Each Location, and the Best Time to Visit.\n\t\t\t\nPresent this information in JSON format.";
