export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="w-full bg-[#F3FFC6] dark:bg-transparent py-4 xs:mt-5 text-center">
			<p className="text-xs md:text-sm lg:text-base text-[#1C5253] dark:text-inherit">
				&copy; {currentYear} TravelMate
			</p>
		</footer>
	);
}
