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
  
  let currentItinerary = {
	startDate: null,
	hotels: [],
	itinerary: [
	  { Day: "Day 1", Date: null, Activities: [] },
	  { Day: "Day 2", Date: null, Activities: [] },
	  { Day: "Day 3", Date: null, Activities: [] }
	]
  };
  
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
			text: '{\n  "hotels": [\n    {\n      "HotelName": "The D Las Vegas",\n      "HotelAddress": "301 Fremont Street, Las Vegas, NV 89101",\n      "Price": "$50-$100 per night",\n      "HotelImageURL": "https://www.theD.com/images/hotel/the-d-hotel-exterior.jpg",\n      "GeoCoordinates": {\n        "latitude": 36.1699,\n        "longitude": -115.1423\n      },\n      "Rating": "3.5 stars",\n      "Description": "A budget-friendly hotel located in the heart of Fremont Street Experience, offering a retro vibe and a casino."\n    },\n    {\n      "HotelName": "Golden Nugget Las Vegas",\n      "HotelAddress": "129 E Fremont Street, Las Vegas, NV 89101",\n      "Price": "$75-$150 per night",\n      "HotelImageURL": "https://www.goldennugget.com/las-vegas/media/images/hotel/golden-nugget-las-vegas-hotel-exterior.jpg",\n      "GeoCoordinates": {\n        "latitude": 36.1695,\n        "longitude": -115.1421\n      },\n      "Rating": "4 stars",\n      "Description": "A historic hotel with a modern twist, featuring a casino, pool, and the famous shark tank."\n    },\n    {\n      "HotelName": "Circus Circus Hotel & Casino",\n      "HotelAddress": "2880 S Las Vegas Blvd, Las Vegas, NV 89109",\n      "Price": "$40-$80 per night",\n      "HotelImageURL": "https://www.circuscircus.com/media/images/hotel/circus-circus-hotel-exterior.jpg",\n      "GeoCoordinates": {\n        "latitude": 36.1037,\n        "longitude": -115.1724\n      },\n      "Rating": "3 stars",\n      "Description": "A family-friendly hotel with a circus theme, offering affordable rooms and entertainment."\n    }\n  ],\n  "itinerary": [\n    {\n      "Day": "Day 1",\n      "Activities": [\n        {\n          "PlaceName": "Fremont Street Experience",\n          "PlaceDetails": "A pedestrian mall with a canopy of lights, live music, street performers, and casinos.",\n          "PlaceImageURL": "https://www.vegasexperience.com/media/images/freemont-street-experience.jpg",\n          "GeoCoordinates": {\n            "latitude": 36.1699,\n            "longitude": -115.1423\n          },\n          "TicketPricing": "Free",\n          "TravelTime": "Walking distance from hotels",\n          "BestTimeToVisit": "Evening for light shows"\n        },\n        {\n          "PlaceName": "Container Park",\n          "PlaceDetails": "Open-air shopping center with boutiques, restaurants, and live entertainment",\n          "PlaceImageURL": "https://downtowncontainerpark.com/images/container-park.jpg",\n          "GeoCoordinates": {\n            "latitude": 36.1683,\n            "longitude": -115.1395\n          },\n          "TicketPricing": "Free admission",\n          "TravelTime": "10 minute walk from Fremont Street",\n          "BestTimeToVisit": "Late afternoon to evening"\n        }\n      ]\n    },\n    {\n      "Day": "Day 2",\n      "Activities": [\n        {\n          "PlaceName": "Bellagio Conservatory",\n          "PlaceDetails": "Stunning botanical garden with seasonal displays",\n          "PlaceImageURL": "https://bellagio.mgmresorts.com/content/dam/mgm/bellagio/entertainment/conservatory-botanical-gardens/bellagio-entertainment-conservatory.jpg",\n          "GeoCoordinates": {\n            "latitude": 36.1126,\n            "longitude": -115.1767\n          },\n          "TicketPricing": "Free",\n          "TravelTime": "20 minutes by bus from downtown",\n          "BestTimeToVisit": "Morning to avoid crowds"\n        },\n        {\n          "PlaceName": "Fountains of Bellagio",\n          "PlaceDetails": "Choreographed water feature with music and lights",\n          "PlaceImageURL": "https://bellagio.mgmresorts.com/content/dam/mgm/bellagio/entertainment/fountains/bellagio-entertainment-fountains.jpg",\n          "GeoCoordinates": {\n            "latitude": 36.1129,\n            "longitude": -115.1767\n          },\n          "TicketPricing": "Free",\n          "TravelTime": "Adjacent to Conservatory",\n          "BestTimeToVisit": "Evening for best views"\n        }\n      ]\n    },\n    {\n      "Day": "Day 3",\n      "Activities": [\n        {\n          "PlaceName": "Seven Magic Mountains",\n          "PlaceDetails": "Colorful rock tower art installation in the desert",\n          "PlaceImageURL": "https://sevenmagicmountains.com/wp-content/uploads/2018/01/Seven-Magic-Mountains-Las-Vegas-Nevada.jpg",\n          "GeoCoordinates": {\n            "latitude": 35.8384,\n            "longitude": -115.2720\n          },\n          "TicketPricing": "Free",\n          "TravelTime": "30 minutes by car from Strip",\n          "BestTimeToVisit": "Sunrise or sunset for best photos"\n        },\n        {\n          "PlaceName": "Downtown Arts District",\n          "PlaceDetails": "Creative neighborhood with galleries, vintage shops, and cafes",\n          "PlaceImageURL": "https://www.downtown.vegas/wp-content/uploads/2019/01/arts-district-las-vegas.jpg",\n          "GeoCoordinates": {\n            "latitude": 36.1601,\n            "longitude": -115.1497\n          },\n          "TicketPricing": "Free to explore",\n          "TravelTime": "15 minutes from Seven Magic Mountains",\n          "BestTimeToVisit": "Afternoon for gallery visits"\n        }\n      ]\n    }\n  ]\n}',
		  },
		],
	  },
	],
  });
  
  export const getCurrentItinerary = () => {
	return currentItinerary;
  };
  
  export const setStartDate = (date) => {
	currentItinerary.startDate = new Date(date);
	// Update dates for all days
	currentItinerary.itinerary.forEach((day, index) => {
	  const dayDate = new Date(currentItinerary.startDate);
	  dayDate.setDate(dayDate.getDate() + index);
	  day.Date = dayDate.toISOString().split('T')[0];
	});
  };
  
  export const addEventToItinerary = async (eventDetails, selectedDate) => {
	try {
	  if (!currentItinerary) {
		const response = await chatSession.sendMessage("Get the current itinerary");
		const responseText = await response.response.text();
		currentItinerary = JSON.parse(responseText);
	  }
  
	  // If no start date is set, set it to the selected date
	  if (!currentItinerary.startDate && selectedDate) {
		setStartDate(selectedDate);
	  }
  
	  // Find the day index based on the selected date
	  const dayIndex = currentItinerary.itinerary.findIndex(
		day => day.Date === selectedDate
	  );
  
	  if (dayIndex === -1) {
		throw new Error("Selected date is not within the itinerary range");
	  }
  
	  // Add date to the event details
	  const eventWithDate = {
		...eventDetails,
		EventDate: selectedDate
	  };
  
	  currentItinerary.itinerary[dayIndex].Activities.push(eventWithDate);
  
	  const updateResponse = await chatSession.sendMessage(
		`Update the itinerary to include this new event on ${selectedDate}: ${JSON.stringify(eventWithDate)}`
	  );
  
	  if (typeof window !== 'undefined' && window.dispatchEvent) {
		window.dispatchEvent(new CustomEvent('itineraryUpdated', { 
		  detail: currentItinerary 
		}));
	  }
  
	  return currentItinerary;
	} catch (error) {
	  console.error("Error adding event to itinerary:", error);
	  throw error;
	}
  };
  
  export default {
	chatSession,
	addEventToItinerary,
	getCurrentItinerary,
	setStartDate
  }