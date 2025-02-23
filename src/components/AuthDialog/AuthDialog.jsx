import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

export const AuthDialog = ({ open, loading, onLogin, onClose }) => {
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="w-max rounded-2xl">
				<DialogHeader>
					<DialogDescription>
						<img
							className="w-44 sm:w-52 md:w-64 lg:w-72 xl:w-80 rounded-lg"
							src="/travelMate.png"
						/>
						<h1 className="mx-auto mt-2 md:mt-4 text-left dark:text-green-400 text-green-600 font-semibold text-base md:text-2xl">
							Sign In with Google
						</h1>
						<p className="text-slate-600 dark:text-slate-300 text-[0.6rem] sm:text-[0.7rem] md:text-base">
							Sign in to the App with Google authentication
							securely
						</p>
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						disabled={loading}
						onClick={onLogin}
						className="w-full pt-1 gap-2 items-center text-base"
					>
						<FcGoogle className="h-7 w-7" /> Sign in with Google
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
