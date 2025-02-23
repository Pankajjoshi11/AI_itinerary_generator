import {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_AI_APIKEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
	model: "gemini-1.5-flash",
});

const generationConfig = {
	temperature: 1,
	topP: 0.95,
	topK: 64,
	maxOutputTokens: 8192,
	responseMimeType: "application/json",
};

const safety_settings = [
	{
		category: "HARM_CATEGORY_DANGEROUS",
		threshold: "BLOCK_NONE",
	},
	{
		category: "HARM_CATEGORY_HARASSMENT",
		threshold: "BLOCK_NONE",
	},
	{
		category: "HARM_CATEGORY_HATE_SPEECH",
		threshold: "BLOCK_NONE",
	},
	{
		category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
		threshold: "BLOCK_NONE",
	},
	{
		category: "HARM_CATEGORY_DANGEROUS_CONTENT",
		threshold: "BLOCK_NONE",
	},
];

export const chatSession = model.startChat({
	generationConfig,
	safety_settings,
	history: [
		{
			role: "user",
			parts: [
				{
					text: 'Generate a 3-day travel plan for a couple in Las Vegas on a budget. \n\nProvide: 1. A list of "hotels" with the following details: HotelName, HotelAddress, Price, HotelImageURL from Google images, GeoCoordinates, Rating, and Description.\n\t      2. Suggest an "itinerary" including- PlaceName, PlaceDetails, PlaceImageURL, GeoCoordinates, TicketPricing, TravelTime to Each Location, and the Best Time to Visit.\n\t\t\t\nPresent this information in JSON format.',
				},
			],
		},
		{
			role: "model",
			parts: [
				{
					text: '{\n  "hotels": [\n    {\n      "HotelName": "The D Las Vegas",\n      "HotelAddress": "301 Fremont Street, Las Vegas, NV 89101",\n      "Price": "$50-$100 per night",\n      "HotelImageURL": "https://www.theD.com/images/hotel/the-d-hotel-exterior.jpg",\n      "GeoCoordinates": {\n        "latitude": 36.1699,\n        "longitude": -115.1423\n      },\n      "Rating": "3.5 stars",\n      "Description": "A budget-friendly hotel located in the heart of Fremont Street Experience, offering a retro vibe and a casino."\n    },\n    {\n      "HotelName": "Golden Nugget Las Vegas",\n      "HotelAddress": "129 E Fremont Street, Las Vegas, NV 89101",\n      "Price": "$75-$150 per night",\n      "HotelImageURL": "https://www.goldennugget.com/las-vegas/media/images/hotel/golden-nugget-las-vegas-hotel-exterior.jpg",\n      "GeoCoordinates": {\n        "latitude": 36.1695,\n        "longitude": -115.1421\n      },\n      "Rating": "4 stars",\n      "Description": "A historic hotel with a modern twist, featuring a casino, pool, and the famous shark tank."\n    },\n    {\n      "HotelName": "Circus Circus Hotel & Casino",\n      "HotelAddress": "2880 S Las Vegas Blvd, Las Vegas, NV 89109",\n      "Price": "$40-$80 per night",\n      "HotelImageURL": "https://www.circuscircus.com/media/images/hotel/circus-circus-hotel-exterior.jpg",\n      "GeoCoordinates": {\n        "latitude": 36.1037,\n        "longitude": -115.1724\n      },\n      "Rating": "3 stars",\n      "Description": "A family-friendly hotel with a circus theme, offering affordable rooms and entertainment."\n    }\n  ],\n  "itinerary": [\n    {\n      "Day": "Day 1",\n      "Activities": [\n        {\n          "PlaceName": "Fremont Street Experience",\n          "PlaceDetails": "A pedestrian mall with a canopy of lights, live music, street performers, and casinos.",\n          "PlaceImageURL": "https://www.vegasexperience.com/media/images/freemont-street-experience.jpg",\n          "GeoCoordinates": {\n            "latitude": 36.1699,\n            "longitude": -115.1423\n          },\n          "TicketPricing": "Free",\n          "TravelTime": "5 minutes walk from The D Las Vegas",\n          "BestTimeToVisit": "Evening for the light show"\n        },\n        {\n          "PlaceName": "The Neon Museum",\n          "PlaceDetails": "A museum showcasing historic neon signs from Las Vegas.",\n          "PlaceImageURL": "https://www.neonmuseum.org/images/neon-museum-exterior.jpg",\n          "GeoCoordinates": {\n            "latitude": 36.1714,\n            "longitude": -115.1472\n          },\n          "TicketPricing": "$20 per person",\n          "TravelTime": "10 minutes walk from Fremont Street Experience",\n          "BestTimeToVisit": "Afternoon for a guided tour"\n        }\n      ]\n    },\n    {\n      "Day": "Day 2",\n      "Activities": [\n        {\n          "PlaceName": "Hoover Dam",\n          "PlaceDetails": "A historic dam on the Colorado River, offering tours and scenic views.",\n          "PlaceImageURL": "https://www.nps.gov/hoov/planyourvisit/images/hoover-dam-from-lake-mead.jpg",\n          "GeoCoordinates": {\n            "latitude": 36.0005,\n            "longitude": -114.9999\n          },\n          "TicketPricing": "$30 per person",\n          "TravelTime": "1 hour drive from Las Vegas",\n          "BestTimeToVisit": "Morning for cooler temperatures"\n        },\n        {\n          "PlaceName": "Red Rock Canyon National Conservation Area",\n          "PlaceDetails": "A scenic area with red rock formations, hiking trails, and rock climbing.",\n          "PlaceImageURL": "https://www.blm.gov/sites/blm.gov/files/styles/large/public/images/redrockcanyon_0.jpg",\n          "GeoCoordinates": {\n            "latitude": 36.1333,\n            "longitude": -115.2500\n          },\n          "TicketPricing": "$15 per vehicle",\n          "TravelTime": "30 minutes drive from Las Vegas",\n          "BestTimeToVisit": "Afternoon for hiking"\n        }\n      ]\n    },\n    {\n      "Day": "Day 3",\n      "Activities": [\n        {\n          "PlaceName": "Bellagio Conservatory & Botanical Garden",\n          "PlaceDetails": "A free attraction featuring elaborate floral displays and sculptures.",\n          "PlaceImageURL": "https://www.bellagio.com/content/dam/bellagio/images/conservatory/conservatory-botanical-garden-2023-winter-display.jpg",\n          "GeoCoordinates": {\n            "latitude": 36.1146,\n            "longitude": -115.1728\n          },\n          "TicketPricing": "Free",\n          "TravelTime": "10 minutes walk from Circus Circus Hotel & Casino",\n          "BestTimeToVisit": "Anytime"\n        },\n        {\n          "PlaceName": "The LINQ Promenade",\n          "PlaceDetails": "An outdoor shopping and dining area with the High Roller observation wheel.",\n          "PlaceImageURL": "https://www.caesars.com/content/dam/caesars/linq/linq-promenade-exterior.jpg",\n          "GeoCoordinates": {\n            "latitude": 36.1153,\n            "longitude": -115.1731\n          },\n          "TicketPricing": "$30 per person for the High Roller",\n          "TravelTime": "5 minutes walk from Bellagio Conservatory & Botanical Garden",\n          "BestTimeToVisit": "Evening for the city lights"\n        }\n      ]\n    }\n  ]\n}',
				},
			],
		},
	],
});
