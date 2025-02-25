import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import axios from "axios";

const Chatbot = ({ 
  destination = "Rajasthan, India", 
  userName = "Traveler",
  apiKey = "AIzaSyCrzgYwLJOxWWvFqFL51raPzNkyol9Im0c" 
}) => {
  const [userInput, setUserInput] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const chatContainerRef = useRef(null);

  const initialSuggestions = [
    {
      title: "**Weather Update** 🌡️",
      text: "What's the current temperature and weather forecast for my stay?"
    },
    {
      title: "**Must-Visit Places** 🏰",
      text: "Could you recommend the top tourist attractions and hidden gems?"
    },
    {
      title: "**Local Cuisine Guide** 🍽️",
      text: "What are the must-try local dishes and best restaurants?"
    },
    {
      title: "**Getting Around** 🚗",
      text: "What's the best way to travel within the city and to nearby attractions?"
    }
  ];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleSendMessage = async (input = userInput) => {
    if (!input.trim()) return;
    setLoading(true);
    
    const newConversation = [...conversation];
    newConversation.push({ 
      user: input, 
      bot: "", 
      pending: true,
      timestamp: new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    });
    
    setConversation(newConversation);
    setUserInput("");

    const prompt = `You are a friendly and knowledgeable travel assistant helping ${userName} plan their trip to ${destination}.
    
    Key instructions:
    - Today's date is ${getCurrentDate()}
    - Address the user casually and warmly only once at beginning
    - Provide specific, actionable advice 
    - Include local insights and practical tips
    - For weather-related questions, include current temperature and conditions
    - Reference previous conversation when relevant
    - End responses with 1 natural follow-up question
    - Keep responses concise but informative
    - Add emojis occasionally to make responses engaging
    - Keep the conversation short and precise 
    - Do not use bold text and give in proper formatting
    - Maximum use 3 lines as a response.
    
    Previous conversation: ${conversation.map(c => 
      `User: ${c.user}\nAssistant: ${c.bot}`).join('\n')}
    
    Current question: ${input}`;

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        }
      );
      
      const botResponse = response.data.candidates[0]?.content?.parts?.[0]?.text || 
        `I apologize, I couldn't process that request. Could you please rephrase your question?`;
      
      newConversation[newConversation.length - 1] = {
        user: input,
        bot: botResponse,
        pending: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      
      setConversation([...newConversation]);
    } catch (error) {
      console.error("Chatbot error:", error);
      newConversation[newConversation.length - 1] = {
        user: input,
        bot: `I'm having trouble connecting right now. Please try again in a moment.`,
        pending: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      setConversation([...newConversation]);
    }
    
    setLoading(false);
  };

  // Return null if chat is closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 p-4 bg-[#00C853] text-white rounded-full shadow-lg hover:bg-[#00B548] transition-all"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-96 max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-[#00C853] p-4 rounded-t-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MessageCircle className="text-white" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-white">Travel Assistant</h2>
              <p className="text-sm text-white/90">
                Planning your trip to {destination}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-[#00B548] p-1 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Chat Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8f9fa]">
          {/* Welcome Message */}
          <div className="text-[#2d4356] mb-4 font-medium">
            {`${getTimeBasedGreeting()} ${userName}! I'm your personal travel assistant for ${destination}. How can I help you plan your perfect trip?`}
          </div>

          {/* Suggested Questions - Only show if no conversation */}
          {conversation.length === 0 && (
            <div className="grid grid-cols-1 gap-4 mb-4">
              {initialSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(suggestion.text)}
                  className="text-left p-4 rounded-lg bg-white hover:bg-gray-50 transition-all border border-gray-200 shadow-sm space-y-2"
                >
                  <div className="font-semibold text-[#004D40]" 
                       dangerouslySetInnerHTML={{ __html: suggestion.title.replace(/\*\*/g, '') }}>
                  </div>
                  <p className="text-sm text-gray-600">{suggestion.text}</p>
                </button>
              ))}
            </div>
          )}

          {conversation.map((chat, index) => (
            <div key={index} className="space-y-3">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-[#00C853] text-white p-3 rounded-2xl rounded-tr-none max-w-[80%]">
                  {chat.user}
                </div>
              </div>
              
              {/* Bot Message */}
              <div className="flex justify-start">
                <div className={`bg-[#004D40] text-white p-3 rounded-2xl rounded-tl-none max-w-[80%] ${
                  chat.pending ? 'animate-pulse' : ''
                }`}>
                  {chat.pending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  ) : (
                    <>
                      {chat.bot}
                      <div className="text-xs text-white/70 mt-2">
                        {chat.timestamp}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-white rounded-b-xl">
          <div className="flex items-center gap-2 relative">
            <input
              type="text"
              className="w-full p-3 pr-12 rounded-full border border-gray-200 focus:outline-none focus:border-[#00C853] bg-white text-gray-800 placeholder-gray-500"
              placeholder="Type your message..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              className="absolute right-1 p-2 rounded-full bg-[#00C853] text-white hover:bg-[#00B548] transition-all disabled:opacity-50 disabled:hover:bg-[#00C853]"
              onClick={() => handleSendMessage()}
              disabled={loading || !userInput.trim()}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;