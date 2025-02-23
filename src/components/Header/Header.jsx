import { Link, NavLink } from "react-router-dom";
import { ModeToggle } from "../Theme/ModeToggle";
import { useEffect, useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { googleLogout } from "@react-oauth/google";
import { FaUserAlt } from "react-icons/fa";
import { useAuth } from "@/Context/AuthContext";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const [isSmallScreen, setIsSmallScreen] = useState(
		window.innerWidth < 1024
	);
	const { user, setUser } = useAuth();

	const toggleMenu = () => setIsOpen(!isOpen);

	useEffect(() => {
		const handleResize = () => setIsSmallScreen(window.innerWidth < 1024);
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<header className="w-full border-b-2 font-serif sm:text-sm md:text-xl sticky bg-background border-neutral-600 shadow top-0 z-10">
			<nav className="container px-2 lg:px-6 py-2">
				<div className="flex flex-wrap justify-between items-center mx-auto">
					<Link to="/" className="flex items-center">
						<img
							src="/travelMate.png"
							className="mr-1 h-14 rounded-lg"
							alt="Logo"
						/>
					</Link>

					<button
						onClick={toggleMenu}
						className="lg:hidden p-2 rounded-md focus:outline focus:ring-2 focus:ring-offset-1 focus:ring-blue-700 dark:focus:ring-customGreen dark:text-customGreen font-bold text-blue-700"
					>
						<svg
							className="h-6 w-6"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path d="M4 6h16M4 12h16m-7 6h7" />
						</svg>
					</button>

					<div
						className={`${
							isOpen ? "block" : "hidden"
						} w-full lg:flex lg:w-auto lg:items-center `}
					>
						<ul className="flex flex-col mt-1 font-medium lg:flex-row lg:space-x-8 lg:mt-0 lg:ml-auto text-right leading-loose">
							{user ? (
								<>
									<li>
										<NavLink
											to="/my-trips"
											className={({ isActive }) =>
												`block pr-2 pl-2 duration-200 ${
													isActive
														? "dark:text-customGreen font-bold text-blue-700"
														: "text-gray-400"
												}`
											}
										>
											My Trip
										</NavLink>
									</li>
									<li>
										<NavLink
											to="/create-trip"
											className={({ isActive }) =>
												`block pr-2 pl-2 duration-200 ${
													isActive
														? "dark:text-customGreen font-bold text-blue-700"
														: "text-gray-400"
												}`
											}
										>
											Create New{" "}
											<span className="text-2xl font-bold ">
												+
											</span>
										</NavLink>
									</li>
									<li>
										<Popover>
											<PopoverTrigger>
												{user.picture ? (
													<img
														src={user.picture}
														alt="User"
														className="h-12 w-full rounded-full"
													/>
												) : (
													<FaUserAlt className="h-8 w-8 rounded-full" />
												)}
											</PopoverTrigger>
											<PopoverContent
												className="w-17 text-red-600 font-semibold"
												data-side="bottom"
												side={
													isSmallScreen
														? "left"
														: "bottom"
												}
											>
												<Link
													to="/"
													onClick={() => {
														googleLogout();
														setUser(null);
													}}
													className="transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110"
												>
													Logout
												</Link>
											</PopoverContent>
										</Popover>
									</li>
								</>
							) : null}
							<li className="block mt-1 -pr-1 duration-200">
								<ModeToggle />
							</li>
						</ul>
					</div>
				</div>
			</nav>
		</header>
	);
}
