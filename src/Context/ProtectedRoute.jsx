import { useAuth } from "@/Context/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
	const { user } = useAuth();

	if (!user) {
		return <Navigate to="/" />;
	}

	return children;
};

export default ProtectedRoute;
