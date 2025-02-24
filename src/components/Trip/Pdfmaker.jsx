import React from "react";
import jsPDF from "jspdf";

const PdfMaker = ({ trip, selectedHotel }) => {
    const exportToPDF = () => {
        const doc = new jsPDF();
        const { userSelection, tripData } = trip;
        const itinerary = tripData?.itinerary || [];
        let yOffset = 10;

        // Title
        doc.setFontSize(16);
        doc.text(`Trip Itinerary to ${userSelection?.location?.label || "Unknown Location"}`, 10, yOffset);
        yOffset += 10;

        // Hotel Details
        doc.setFontSize(12);
        doc.text("Selected Hotel:", 10, yOffset);
        yOffset += 6;
        doc.setFontSize(10);
        doc.text(`Name: ${selectedHotel?.HotelName || "N/A"}`, 15, yOffset);
        yOffset += 5;
        doc.text(`Address: ${selectedHotel?.HotelAddress || "N/A"}`, 15, yOffset);
        yOffset += 5;
        doc.text(`Price: ${selectedHotel?.Price || "N/A"}`, 15, yOffset);
        yOffset += 5;
        doc.text(`Rating: ${selectedHotel?.Rating || "N/A"}`, 15, yOffset);
        yOffset += 10;

        // Itinerary
        doc.setFontSize(12);
        doc.text("Itinerary:", 10, yOffset);
        yOffset += 6;

        itinerary.forEach((day, index) => {
            doc.setFontSize(10);
            doc.text(`Day ${new Date(day.Day).getDate()}-${new Date(day.Day).toLocaleString('default', { month: 'long' })} ${new Date(day.Day).getFullYear()}:`, 15, yOffset);
            yOffset += 5;

            // Handle Activities for this day (capitalized "Activities" to match your data)
            if (day.Activities && Array.isArray(day.Activities) && day.Activities.length > 0) {
                day.Activities.forEach((activity, activityIndex) => {
                    console.log("Processing Activity for PDF:", activity); // Debug log
                    // Skip the "Departure" activity with no meaningful data
                    if (activity.PlaceName === "Departure" && !activity.PlaceDetails && !activity.TicketPricing) {
                        return; // Skip this activity
                    }

                    doc.text(`Activity ${activityIndex + 1}:`, 20, yOffset);
                    yOffset += 5;
                    doc.text(`Place: ${activity.PlaceName || "Not Available"}`, 25, yOffset);
                    yOffset += 5;
                    doc.text(`Details: ${activity.PlaceDetails || "Not Available"}`, 25, yOffset);
                    yOffset += 5;
                    doc.text(`Ticket Pricing: ${activity.TicketPricing || "Not Available"}`, 25, yOffset);
                    yOffset += 5;
                    doc.text(`Best Time to Visit: ${activity.BestTimeToVisit || "Not Available"}`, 25, yOffset);
                    yOffset += 5;
                    doc.text(`Travel: ${activity.HowToTravel || "Not Available"}`, 25, yOffset);
                    yOffset += 5;
                    doc.text(`Travel Time: ${activity.TravelTime || "Not Available"}`, 25, yOffset);
                    yOffset += 5;

                    // Add GeoCoordinates for reference (optional, can be removed if not needed)
                    if (activity.GeoCoordinates && (activity.GeoCoordinates.latitude || activity.GeoCoordinates.longitude)) {
                        doc.text(`Coordinates: Lat ${activity.GeoCoordinates.latitude || "N/A"}, Lon ${activity.GeoCoordinates.longitude || "N/A"}`, 25, yOffset);
                        yOffset += 5;
                    }

                    // Add Image URL as text (optional, since PDFs don’t embed images easily)
                    if (activity.PlaceImageURL) {
                        doc.text(`Image URL: ${activity.PlaceImageURL}`, 25, yOffset);
                        yOffset += 5;
                    }

                    // Add new page if content exceeds page height
                    if (yOffset > 270) {
                        doc.addPage();
                        yOffset = 10;
                    }
                });
            } else {
                doc.text("No activities available for this day.", 20, yOffset);
                yOffset += 5;
            }

            yOffset += 5; // Add extra space between days
            if (yOffset > 270) {
                doc.addPage();
                yOffset = 10;
            }
        });

        // Budget
        doc.setFontSize(12);
        doc.text("Budget:", 10, yOffset);
        yOffset += 6;
        doc.setFontSize(10);
        doc.text(`Approximate Total Budget (excluding flights): ₹${tripData?.approximateTotalBudget || 0} INR`, 15, yOffset);

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