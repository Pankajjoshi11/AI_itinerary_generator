import { useState } from "react";
import axios from "axios";

export const Chatbot = ({ tripId, destination }) => {
    const [userInput, setUserInput] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);

    const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

    const handleSendMessage = async () => {
        if (!userInput) return;
        setLoading(true);
        
        let prompt = `You are a travel assistant. The user is asking about their trip to ${destination}. Provide relevant information based on their question.
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

    return (
        <div className="fixed bottom-5 right-5 bg-white p-4 shadow-lg rounded-xl">
            <h2 className="text-lg font-bold">Chatbot 💬</h2>
            <p className="text-sm">Ask about your trip to {destination}</p>
            <input
                type="text"
                className="border p-2 mt-2 w-full"
                placeholder="Ask something..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
            />
            <button
                className="bg-blue-500 text-white px-4 py-2 rounded mt-3"
                onClick={handleSendMessage}
                disabled={loading}
            >
                {loading ? "Thinking..." : "Ask"}
            </button>
            {response && <p className="mt-3 text-sm">{response}</p>}
        </div>
    );
};
