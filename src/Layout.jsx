import Header from "./components/Header/Header";
import { Outlet } from "react-router-dom";
import Footer from "./components/Footer/Footer";
import { ThemeProvider } from "./components/Theme/ThemeProvider";
import { Toaster } from "./components/ui/sonner";

function Layout() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<Header />
			<Toaster />
			<Outlet />
			<Footer />
		</ThemeProvider>
	);
}

export default Layout;
