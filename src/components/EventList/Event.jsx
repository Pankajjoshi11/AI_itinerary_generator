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

const EventList = ({ location }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");

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
          "x-rapidapi-key": "3ef090441amshb192b75ccc7677fp174c9fjsn273c8739d468",
          "x-rapidapi-host": "real-time-events-search.p.rapidapi.com",
        },
      });

      if (response.data.data && response.data.data.length > 0) {
        let filteredEvents = response.data.data;

        if (dateFilter) {
          const selectedDateObj = new Date(dateFilter);
          filteredEvents = filteredEvents.filter((event) => {
            const eventDateStr = event.date_human_readable;
            if (!eventDateStr || typeof eventDateStr !== "string") return false;
            const eventDate = eventDateStr.split(",")[1]?.trim().split("–")[0].trim() || "";
            if (!eventDate) return false;
            const eventDateObj = new Date(eventDate + " " + new Date().getFullYear());
            return eventDateObj.toDateString() === selectedDateObj.toDateString();
          });
        }

        setEvents(filteredEvents);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("API Error:", err);
      setError("Failed to fetch events.");
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
        <h1 style={styles.heading}>Local Events in {location}</h1>

        {/* <div style={styles.inputContainer}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={styles.input}
          />
        </div> */}

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
                    <FaMapMarkerAlt style={styles.icon1} />
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
  icon1: {
    fontSize: "50px",
  },
  heading: {
    fontSize: "1.875rem",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "32px",
  },
  inputContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    justifyContent: "center",
    marginBottom: "32px",
  },
  input: {
    maxWidth: "320px",
    padding: "8px 12px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "rgb(249,251,251)",
    borderRadius: "4px",
    fontSize: "16px",
    width: "100%",
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
  ticketButton: {
    backgroundColor: "rgb(7,193,118)",
    padding: "10px",
    borderRadius: "4px",
    color: "white",
    textAlign: "center",
    display: "block",
    marginTop: "16px",
    textDecoration: "none",
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