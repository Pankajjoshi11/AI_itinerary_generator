import { useState } from "react";
import axios from "axios";

export const Chatbot = ({ tripId, destination }) => {
	const [userInput, setUserInput] = useState("");
	const [response, setResponse] = useState("");
	const [loading, setLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false); // State to toggle chat visibility

	const GEMINI_API_KEY = "AIzaSyCrzgYwLJOxWWvFqFL51raPzNkyol9Im0c";

	const handleSendMessage = async () => {
		if (!userInput) return;
		setLoading(true);

		let prompt = `You are a travel assistant. The user is asking about their trip to ${destination}. Provide relevant information based on their question. Also always summarize the answer and give it to them
        User Question: ${userInput}`;

		try {
			const res = await axios.post(
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
				{ contents: [{ parts: [{ text: prompt }] }] }
			);
			setResponse(res.data.candidates[0]?.content?.parts?.[0]?.text || "No response.");
		} catch (error) {
			console.error("Chatbot error:", error);
			setResponse("Sorry, I couldn't fetch a response.");
		}

		setLoading(false);
	};

	// Toggle chat visibility
	const toggleChat = () => {
		setIsOpen(!isOpen);
	};

	return (
		<div className="fixed bottom-5 right-5">
			{/* Circular Button (Closed State) */}
			{!isOpen && (
				<button
					onClick={toggleChat}
					className="w-16 h-16 rounded-full bg-customGreen text-white flex items-center justify-center text-2xl shadow-lg hover:bg-green-600 transition-all"
					aria-label="Open Chatbot"
				>
					💬
				</button>
			)}

			{/* Expanded Chat Interface (Open State) */}
			{isOpen && (
				<div className="bg-gray-200 p-4 rounded-xl shadow-lg w-80 max-h-96 overflow-y-auto">
					<div className="flex justify-between items-center mb-3 ">
						<h2 className="text-lg font-bold text-customGreen">Chatbot 💬</h2>
						<button
							onClick={toggleChat}
							className="text-customGreen hover:text-green-600"
							aria-label="Close Chatbot"
						>
							✖
						</button>
					</div>
					<p className="text-sm text-black  mb-2">Ask about your trip to {destination}</p>
					
					<div className="mb-4 max-h-40 overflow-y-auto text-white">
						{response && (
							<div className="mb-2 p-2 bg-gray-700 rounded-lg">
								<p><strong>Gemini:</strong> {response}</p>
							</div>
						)}
					</div>

					<input
						type="text"
						className="border border-gray-600 p-2 mt-2 w-full rounded bg-darkGray text-black placeholder-gray-400"
						placeholder="Ask something..."
						value={userInput}
						onChange={(e) => setUserInput(e.target.value)}
					/>
					<button
						className="bg-customGreen text-white px-4 py-2 rounded mt-3 w-full hover:bg-green-600 transition-all"
						onClick={handleSendMessage}
						disabled={loading}
					>
						{loading ? "Thinking..." : "Ask"}
					</button>
				</div>
			)}
		</div>
	);
};

// CSS Variables (you can move this to a CSS file or use a CSS-in-JS solution)
const styles = `
  .bg-darkGray {
    background-color: #1A202C; /* Dark background from the image */
  }
  .text-customGreen {
    color: #00FF00; /* Green from the image for accents */
  }
  .bg-customGreen {
    background-color: #00FF00; /* Green for buttons */
  }
`;

// You can add this to your CSS file or use a styled-components approach