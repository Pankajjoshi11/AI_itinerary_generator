import { useEffect, useState } from "react";
import axios from "axios";
import { 
  FaSearch, 
  FaCalendar, 
  FaClock, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaStar 
} from "react-icons/fa";
import { addEventToItinerary } from '../../services/AImodel';

const EventList = ({ location }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== "string") return "Not Available";
    try {
      const parts = dateString.split(",");
      if (parts.length < 2) return "Not Available";
      const datePart = parts[0] + "," + parts[1].split("–")[0];
      return datePart.trim();
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Not Available";
    }
  };

  const getEventTime = (dateString) => {
    if (!dateString || typeof dateString !== "string") return "Not Available";
    try {
      const parts = dateString.split(",");
      if (parts.length < 2) return "Not Available";
      const timePart = parts[1]?.split("–")[1] || "";
      return timePart.trim();
    } catch (e) {
      console.error("Error getting event time:", e);
      return "Not Available";
    }
  };

  const handleAddToItinerary = async (event) => {
    try {
      const userResponse = window.confirm(`Would you like to add "${event.name}" to your itinerary?`);
      
      if (userResponse) {
        const eventDetails = {
          PlaceName: event.name,
          PlaceDetails: event.venue.full_address,
          GeoCoordinates: {
            latitude: event.venue.latitude,
            longitude: event.venue.longitude
          },
          TicketPricing: event.ticket_links?.[0]?.price || "Price not available",
          TravelTime: "Varies based on location",
          BestTimeToVisit: getEventTime(event.date_human_readable),
          PlaceImageURL: event.venue.image_url || "/api/placeholder/400/320"
        };
        
        await addEventToItinerary(eventDetails);
        setAlertMessage(`Successfully added ${event.name} to your itinerary!`);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      }
    } catch (error) {
      console.error("Error adding to itinerary:", error);
      setAlertMessage("Failed to add event to itinerary");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  const fetchEvents = async (locationQuery, dateFilter) => {
    if (!locationQuery) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.request({
        method: "GET",
        url: "https://real-time-events-search.p.rapidapi.com/search-events",
        params: { 
          query: locationQuery,
          date: dateFilter || "any",
          is_virtual: "false",
          start: "0" 
        },
        headers: {
          "x-rapidapi-key": "fa2c3b0fefmsha51148dc95a2ddbp134de7jsn7d1ec789ac6b",
          "x-rapidapi-host": "real-time-events-search.p.rapidapi.com",
        },
      });

      if (response.data.data && response.data.data.length > 0) {
        setEvents(response.data.data);
        setAlertMessage(`Found ${response.data.data.length} events in ${location}!`);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      } else {
        setEvents([]);
        setAlertMessage(`No events found in ${location}`);
        setShowAlert(true);
      }
    } catch (err) {
      console.error("API Error:", err);
      setError("Failed to fetch events.");
      setAlertMessage("Error fetching events. Please try again later.");
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      fetchEvents(location, selectedDate);
    }
  }, [location, selectedDate]);

  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        {showAlert && (
          <div style={styles.alert}>
            <p style={styles.alertText}>{alertMessage}</p>
          </div>
        )}

        <h1 style={styles.heading}>Local Events in {location}</h1>

        {loading && <p style={styles.centerText}>Loading events...</p>}
        {error && <p style={styles.error}>{error}</p>}

        {events.length === 0 && !loading && !error && (
          <p style={styles.noEvents}>No events found for {location}</p>
        )}

        {events.length > 0 && (
          <div style={styles.cardGrid}>
            {events.map((event, index) => (
              <div key={index} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>{event.name || "No Title"}</h2>
                </div>
                <div style={styles.cardContent}>
                  <div style={styles.infoRow}>
                    <FaCalendar style={styles.icon} />
                    <span>{formatDate(event.date_human_readable)}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span>{getEventTime(event.date_human_readable)}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <FaMapMarkerAlt style={styles.icon} />
                    <span>{event.venue.full_address || "Not Available"}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <FaStar style={styles.icon} />
                    <span>Rating: {event.venue.rating || "N/A"}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <FaPhone style={styles.icon} />
                    <span>{event.venue.phone_number || "N/A"}</span>
                  </div>
                  <div style={styles.buttonContainer}>
                    {event.ticket_links?.[0]?.link && (
                      <a
                        href={event.ticket_links[0].link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.ticketButton}
                      >
                        Get Tickets ({event.ticket_links[0].source})
                      </a>
                    )}
            
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "rgb(2,8,24)",
    color: "rgb(249,251,251)",
    padding: "24px",
  },
  innerContainer: {
    maxWidth: "1280px",
    margin: "0 auto",
  },
  alert: {
    backgroundColor: "rgba(7,193,118,0.2)",
    border: "1px solid rgb(7,193,118)",
    borderRadius: "4px",
    padding: "12px",
    marginBottom: "16px",
  },
  alertText: {
    margin: 0,
    color: "rgb(249,251,251)",
    textAlign: "center",
  },
  heading: {
    fontSize: "1.875rem",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "32px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "rgb(10,20,40)",
    padding: "20px",
    borderRadius: "8px",
    border: "2px solid rgb(7,193,118)",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  },
  cardHeader: {
    marginBottom: "12px",
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "rgb(249,251,251)",
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  icon: {
    width: "16px",
    height: "16px",
    color: "white",
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "16px",
  },
  ticketButton: {
    backgroundColor: "rgb(7,193,118)",
    padding: "10px",
    borderRadius: "4px",
    color: "white",
    textAlign: "center",
    display: "block",
    textDecoration: "none",
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#4a5568",
    padding: "10px",
    borderRadius: "4px",
    color: "white",
    textAlign: "center",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  centerText: {
    textAlign: "center",
    color: "rgb(249,251,251)",
  },
  error: {
    color: "red",
    textAlign: "center",
  },
  noEvents: {
    textAlign: "center",
    color: "rgb(249,251,251)",
  },
};

export default EventList;