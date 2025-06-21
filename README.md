# AI-Powered Trip Recommendation Platform

## Overview
**🔗 [Live Website](https://ai-itinerary-generator-six.vercel.app/)**

Authenticity is an AI-driven trip recommendation platform designed to provide personalized travel itineraries. By integrating Google Gemini's Generative AI API and Google Places API, the platform offers intelligent trip planning, location insights, and real-time recommendations to enhance the travel experience.

## Features
- **Personalized Trip Recommendations**: AI-generated travel itineraries based on user preferences.
- **Google Places API Integration**: Fetch detailed location information and imagery.
- **Google Gemini AI API**: Generates intelligent travel suggestions.
- **User Authentication & Authorization**: Seamless login using Google OAuth.
- **Interactive UI/UX**: Built with Tailwind CSS and Shadcn for an elegant user experience.
- **Real-Time Updates**: Dynamic trip suggestions based on user interests and location.

## Tech Stack

### Frontend
- **React.js**: Component-based UI development.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Shadcn**: Pre-built UI components for a sleek design.

### Backend
- **Node.js**: JavaScript runtime for handling backend operations.
- **Express.js**: Lightweight framework for creating RESTful APIs.

### APIs & Services
- **Google Gemini Generative AI API**: AI-powered travel planning.
- **Google Places API**: Location details and imagery.
- **Google OAuth**: Secure authentication.

## Installation & Setup

### Prerequisites
Ensure you have the following installed:
- Node.js (latest LTS version recommended)
- npm or yarn
- Google Cloud API keys for Gemini AI and Places API

### Steps

1. **Clone the repository**
   ```sh
   git clone https://github.com/Pankajjoshi11/codhers_hacksync25.git
   cd ai-trip-recommendation
   ```
2. **Install dependencies**
   ```sh
   npm install  # or yarn install
   ```
3. **Set up environment variables**
   Create a `.env` file in the root directory and add:
   ```env
   REACT_APP_GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key
   REACT_APP_GOOGLE_PLACES_API_KEY=your_google_places_api_key
   REACT_APP_GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
   ```
4. **Start the development server**
   ```sh
   npm start  # or yarn start
   ```

## Usage
- Sign in with Google to access personalized trip recommendations.
- Enter travel preferences, and the AI will generate an itinerary.
- Explore places with Google Places API and real-time suggestions.
- Save, modify, and customize trip plans.

## Contributing
Contributions are welcome! Follow these steps:
1. Fork the repository.
2. Create a new branch: `git checkout -b feature-branch-name`.
3. Commit changes: `git commit -m "Added new feature"`.
4. Push to the branch: `git push origin feature-branch-name`.
5. Submit a pull request.

## License
This project is licensed under the MIT License.
