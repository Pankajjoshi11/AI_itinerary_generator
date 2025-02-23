import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import {
	createBrowserRouter,
	createRoutesFromElements,
	Route,
	RouterProvider,
} from "react-router-dom";
import Layout from "./Layout.jsx";
import LandingPage from "./components/LandingPage/LandingPage.jsx";
import { HomePage } from "./components/HomePage/HomePage";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ViewTrip } from "./viewTrip/ViewTrip";
import { MyTrips } from "./components/MyTrips/MyTrips";
import { AuthProvider } from "./Context/AuthContext";
import ProtectedRoute from "./Context/ProtectedRoute";

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route path="/" element={<Layout />}>
			<Route path="" element={<LandingPage />} />
			<Route
				path="/create-trip"
				element={
					<ProtectedRoute>
						<HomePage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/my-trips"
				element={
					<ProtectedRoute>
						<MyTrips />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/view-trip/:tripId"
				element={
					<ProtectedRoute>
						<ViewTrip />
					</ProtectedRoute>
				}
			/>
		</Route>
	)
);

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<GoogleOAuthProvider
			clientId={import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID}
		>
			<AuthProvider>
				<RouterProvider router={router} />
			</AuthProvider>
		</GoogleOAuthProvider>
	</React.StrictMode>
);
