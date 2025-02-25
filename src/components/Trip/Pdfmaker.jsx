import React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable"; // Import for table formatting (optional for advanced layouts)

const PdfMaker = ({ trip, selectedHotel }) => {
    const exportToPDF = () => {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });
        const { userSelection, tripData } = trip;
        const itinerary = tripData?.itinerary || [];
        let yOffset = 20; // Increased margin for better spacing
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Define a cool color scheme (dark teal for background, white text, accents in cyan, pink, and light blue)
        const darkTeal = [0, 64, 64]; // Dark teal background (#004040)
        const white = [255, 255, 255]; // White text
        const cyan = [0, 191, 255]; // Cyan for highlights (#00BFFF)
        const pink = [255, 192, 203]; // Pink for activity names (#FFC0CB)
        const lightBlue = [173, 216, 230]; // Light blue for subtle accents (#ADD8E6)
        const gray = [192, 192, 192]; // Gray for details (#C0C0C0)

        // Set fonts and styles
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...white); // White text for dark background
        doc.setFillColor(...darkTeal); // Dark teal background for header
        doc.rect(0, 0, pageWidth, 20, "F"); // Dark teal header background
        doc.setFontSize(20);
        doc.text(`Trip Itinerary to ${userSelection?.location?.label || "Unknown Location"}`, pageWidth / 2, 15, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);

        // Hotel Details (Dark-themed card with darker green background)
        yOffset += 10;
        doc.setFillColor(...darkTeal); // Darker teal for hotel card
        doc.rect(10, yOffset, pageWidth - 20, 50, "F"); // Hotel card
        doc.setTextColor(...white); // White text
        doc.text("Selected Hotel", 15, yOffset + 10);
        doc.setFontSize(10);
        doc.text(`Name: ${selectedHotel?.HotelName || "N/A"}`, 15, yOffset + 20);
        doc.text(`Address: ${selectedHotel?.HotelAddress || "N/A"}`, 15, yOffset + 25);
        doc.text(`Price: ${selectedHotel?.Price || "N/A"}`, 15, yOffset + 30);
        doc.text(`Rating: ${selectedHotel?.Rating || "N/A"}`, 15, yOffset + 35);
        yOffset += 60;

        // Itinerary Header
        doc.setFillColor(...darkTeal); // Dark teal for section header
        doc.rect(10, yOffset, pageWidth - 20, 10, "F");
        doc.setTextColor(...white); // White text
        doc.text("Itinerary", 15, yOffset + 7);
        yOffset += 15;

        // Itinerary Days and Activities
        itinerary.forEach((day, index) => {
            // Calculate date for this day based on startDate
            const startDate = tripData?.startDate || (userSelection?.startDate && typeof userSelection.startDate === "string" 
                ? userSelection.startDate 
                : new Date().toISOString().split("T")[0]);
            const baseDate = new Date(startDate);
            baseDate.setDate(baseDate.getDate() + index);
            const formattedDate = baseDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

            doc.setFont("helvetica", "bold");
            doc.setTextColor(...cyan); // Cyan for day headers
            doc.text(`Day ${index + 1} (${formattedDate})`, 15, yOffset);
            yOffset += 10;

            // Handle both 'Activities' and 'activities' for compatibility
            const activities = day.Activities || day.activities || [];
            if (Array.isArray(activities) && activities.length > 0) {
                activities.forEach((activity, activityIndex) => {
                    // Skip "Departure" activities with no meaningful data
                    if (activity.PlaceName === "Departure" && !activity.PlaceDetails && !activity.TicketPricing) {
                        return;
                    }

                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(...pink); // Pink for activity names
                    doc.text(`Activity ${activityIndex + 1}: ${activity.PlaceName || "Not Available"}`, 20, yOffset);
                    yOffset += 5;

                    doc.setTextColor(...gray); // Gray for details
                    doc.text(`Details: ${activity.PlaceDetails || "Not Available"}`, 25, yOffset);
                    yOffset += 5;
                    doc.text(`Ticket: ${activity.TicketPricing || "Not Available"}`, 25, yOffset);
                    yOffset += 5;
                    doc.text(`Best Time: ${activity.BestTimeToVisit || "Not Available"}`, 25, yOffset);
                    yOffset += 5;
                    doc.text(`Travel: ${activity.HowToTravel || "Not Available"}`, 25, yOffset);
                    yOffset += 5;
                    doc.text(`Travel Time: ${activity.TravelTime || "Not Available"}`, 25, yOffset);
                    yOffset += 5;

                    yOffset += 5; // Extra space between activities
                    if (yOffset > pageHeight - 20) { // Check for page height with margin
                        doc.addPage();
                        yOffset = 20; // Reset offset with top margin
                    }
                });
            } else {
                doc.setTextColor(...gray); // Gray for no activities
                doc.text("No activities available for this day.", 20, yOffset);
                yOffset += 10;
            }

            if (yOffset > pageHeight - 20) {
                doc.addPage();
                yOffset = 20;
            }
        });

        // Budget (Footer-like placement)
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...lightBlue); // Light blue for budget
        doc.text(`Approximate Total Budget (excluding flights): ₹${tripData?.approximateTotalBudget || 0} INR`, pageWidth / 2, pageHeight - 15, { align: "center" });

        // Add footer with page numbers
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(...gray); // Gray for footer
            doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: "center" });
        }

        // Save the PDF
        doc.save(`Trip_Itinerary_${trip.id}.pdf`);
    };

    return (
        <button
            onClick={exportToPDF}
            className="bg-orange-700 text-white px-4 py-2 rounded mt-4 hover:bg-orange-800 transition-all"
        >
            Export to PDF
        </button>
    );
};

export default PdfMaker;