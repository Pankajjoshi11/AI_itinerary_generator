export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<>
			<div className="container py-6 xs:mt-5 sm:mt-5 md:mt-12 lg:mt-18">
				<p className="text-center text-xs md:text-sm lg:text-base">
					&copy; {currentYear} TravelMate
				</p>
			</div>
		</>
	);
}
