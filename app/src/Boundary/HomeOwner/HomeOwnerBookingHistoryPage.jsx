import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

// --- Reusable API Call Helper ---
// Assuming this is available globally or imported, similar to previous examples.
async function apiCall(url, method = "GET", body = null) {
  const apiUrl = url.startsWith("/api")
    ? url
    : `/api${url.startsWith("/") ? "" : "/"}${url}`;
  const options = { method, headers: {} };
  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  try {
    const response = await fetch(apiUrl, options);
    const contentType = response.headers.get("content-type");
    let data;
    if (response.status === 204) {
      return { message: `Operation successful (Status: ${response.status})` };
    }
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else {
      const textResponse = await response.text();
      if (!response.ok) {
        throw new Error(
          textResponse || `HTTP error! status: ${response.status}`
        );
      }
      return {
        message:
          textResponse || `Operation successful (Status: ${response.status})`,
      };
    }
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`API call failed: ${method} ${apiUrl}`, error);
    throw error;
  }
}

/**
 * Page for Homeowners to search and view their booking history.
 */
function HomeOwnerBookingHistoryPage() {
  // --- State Variables ---
  const [activeTab, setActiveTab] = useState("search"); // 'search', 'details'
  const [isLoading, setIsLoading] = useState(false); // General loading for search
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loggedInUsername, setLoggedInUsername] = useState("");
  const navigate = useNavigate();

  // Search Tab State
  const [searchParams, setSearchParams] = useState({
    startDate: "",
    endDate: "",
    serviceCategoryId: "",
  });
  const [searchResults, setSearchResults] = useState([]); // Stores array of booking IDs
  const [categories, setCategories] = useState([]); // For service category filter dropdown

  // Details Tab State
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null); // Full details of the selected booking

  // --- Helper Functions ---
  const showMessage = useCallback((text, type = "error") => {
    setMessage({ text, type });
  }, []);

  const clearMessages = useCallback(() => {
    setMessage({ text: "", type: "" });
  }, []);

  // Fetch All Bookings
  const fetchAllBookings = useCallback(async () => {
    if (!loggedInUsername) return;
    setIsLoading(true);
    clearMessages();
    try {
      const query = new URLSearchParams();
      query.append("homeownerUsername", loggedInUsername);
      const results = await apiCall(
        `/api/homeowner/bookings/search?${query.toString()}`
      );
      setSearchResults(results || []);
      if (!results || results.length === 0) {
        showMessage("You have no booking history yet.", "info");
      }
    } catch (error) {
      showMessage(error.message || "Failed to fetch booking history.");
    } finally {
      setIsLoading(false);
    }
  }, [loggedInUsername, clearMessages, showMessage]);

  // --- Effect to get logged-in username on mount ---
  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && userData.username) {
          setLoggedInUsername(userData.username);
        } else {
          showMessage("Could not identify logged-in user.", "error");
          navigate("/login", { replace: true }); // Redirect if username is crucial
        }
      } catch (e) {
        localStorage.removeItem("loggedInUser");
        showMessage(
          "Error reading user session. Please log in again.",
          "error"
        );
        navigate("/login", { replace: true });
      }
    } else {
      showMessage(
        "No user session found. Please log in to view booking history.",
        "error"
      );
      navigate("/login", { replace: true });
    }
  }, [navigate, showMessage]);

  // Fetch Service Categories for the filter dropdown
  const fetchCategories = useCallback(async () => {
    setIsFetchingCategories(true);
    try {
      // Assuming the same category endpoint as in ServiceManagementPage
      const fetchedCategories = await apiCall(
        "/api/platform/serviceCategories/search"
      );
      setCategories(fetchedCategories || []);
    } catch (error) {
      showMessage(
        error.message || "Failed to load service categories for filtering."
      );
    } finally {
      setIsFetchingCategories(false);
    }
  }, [showMessage]);

  useEffect(() => {
    if (loggedInUsername) {
      // Only fetch categories if user is logged in and might search
      fetchCategories();
    }
  }, [loggedInUsername, fetchCategories]);

  useEffect(() => {
    if (loggedInUsername && activeTab === "search") {
      fetchAllBookings();
    }
  }, [loggedInUsername, activeTab, fetchAllBookings]);

  // Handle Search Input Changes
  const handleSearchInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Booking Search
  const handleSearchBookings = async (e) => {
    e.preventDefault();
    if (!loggedInUsername) {
      showMessage("Cannot search without user information.", "error");
      return;
    }
    setIsLoading(true);
    clearMessages();
    setSearchResults([]);
    try {
      const query = new URLSearchParams();
      query.append("homeownerUsername", loggedInUsername);
      if (searchParams.startDate)
        query.append("startDate", searchParams.startDate);
      if (searchParams.endDate) query.append("endDate", searchParams.endDate);
      if (searchParams.serviceCategoryId)
        query.append("serviceCategoryId", searchParams.serviceCategoryId);

      const results = await apiCall(
        `/api/homeowner/bookings/search?${query.toString()}`
      );
      setSearchResults(results || []); // Expecting an array of booking IDs
      if (!results || results.length === 0) {
        showMessage("No bookings found matching your criteria.", "info");
      }
    } catch (error) {
      showMessage(error.message || "Failed to search for bookings.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Full Details for a Selected Booking
  const fetchBookingDetails = useCallback(
    async (bookingId) => {
      if (!bookingId) return;
      setIsFetchingDetails(true);
      clearMessages();
      setBookingDetails(null);
      try {
        // As discussed, assuming the route parameter is the bookingId itself.
        const details = await apiCall(`/api/homeowner/booking/${bookingId}`);
        setBookingDetails(details);
        setActiveTab("details");
      } catch (error) {
        showMessage(
          error.message ||
            `Failed to fetch details for booking ID ${bookingId}.`
        );
        setActiveTab("search"); // Go back to search if details fail
      } finally {
        setIsFetchingDetails(false);
      }
    },
    [showMessage, clearMessages]
  );

  // Function to trigger fetching details and switch tab
  const handleViewDetailsClick = (bookingId) => {
    setSelectedBookingId(bookingId); // Set the ID
    fetchBookingDetails(bookingId); // Then fetch
  };

  // --- Render Logic ---
  return (
    <div>
      {loggedInUsername && (
        <p style={{ fontStyle: "italic", textAlign: "right" }}>
          Viewing booking history for: {loggedInUsername}
        </p>
      )}
      <Link to="/homeowner/dashboard">← Back to Homeowner Dashboard</Link>
      <h2>My Booking History</h2>

      {/* Tab Navigation */}
      <div
        style={{
          marginBottom: "15px",
          borderBottom: "1px solid #ccc",
          paddingBottom: "5px",
        }}
      >
        <button
          onClick={() => {
            setActiveTab("search");
            clearMessages();
            setSelectedBookingId(null);
            setBookingDetails(null);
          }}
          disabled={activeTab === "search"}
        >
          Search Bookings
        </button>
        <button
          onClick={() => setActiveTab("details")}
          disabled={activeTab === "details" || !selectedBookingId}
        >
          Booking Details
        </button>
      </div>

      {/* Feedback Messages */}
      {message.text && (
        <p
          style={{
            color:
              message.type === "success"
                ? "green"
                : message.type === "info"
                ? "darkorange"
                : "red",
          }}
        >
          {message.text}
        </p>
      )}

      {/* Loading Indicators */}
      {(isLoading || isFetchingDetails || isFetchingCategories) && (
        <p>Loading...</p>
      )}

      {/* --- Search Bookings Tab --- */}
      {activeTab === "search" && !isLoading && loggedInUsername && (
        <div>
          <h3>Your Past Bookings</h3>
          <details>
            <summary style={{ marginBottom: "10px", cursor: "pointer" }}>
              Search Filters (click to expand)
            </summary>
            <form
              onSubmit={handleSearchBookings}
              style={{ marginBottom: "20px" }}
            >
              <div
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                <div>
                  <label htmlFor="startDate">Start Date: </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={searchParams.startDate}
                    onChange={handleSearchInputChange}
                    style={{ marginRight: "10px" }}
                  />
                </div>
                <div>
                  <label htmlFor="endDate">End Date: </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={searchParams.endDate}
                    onChange={handleSearchInputChange}
                    style={{ marginRight: "10px" }}
                  />
                </div>
                <div>
                  <label htmlFor="serviceCategoryId">Service Category: </label>
                  <select
                    id="serviceCategoryId"
                    name="serviceCategoryId"
                    value={searchParams.serviceCategoryId}
                    onChange={handleSearchInputChange}
                    disabled={isFetchingCategories}
                    style={{ marginRight: "10px" }}
                  >
                    <option value="">-- All Categories --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {isFetchingCategories && <span> Loading categories...</span>}
                </div>
                <div style={{ marginTop: "10px" }}>
                  <button
                    type="submit"
                    disabled={isLoading || isFetchingCategories}
                  >
                    Apply Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchParams({
                        startDate: "",
                        endDate: "",
                        serviceCategoryId: "",
                      });
                      fetchAllBookings();
                    }}
                    disabled={isLoading}
                    style={{ marginLeft: "10px" }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </form>
          </details>
          <h4>Results:</h4>
          {searchResults.length > 0 ? (
            <ul>
              {searchResults.map((bookingId) => (
                <li key={bookingId}>
                  Booking ID: {bookingId} -
                  <button
                    onClick={() => handleViewDetailsClick(bookingId)}
                    style={{
                      marginLeft: "10px",
                      background: "none",
                      border: "none",
                      color: "blue",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                    disabled={isFetchingDetails}
                  >
                    Click to view
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !message.text && (
              <p>
                No booking history results to display. Please try different
                search filters. (˘･_･˘)
              </p>
            )
          )}
        </div>
      )}
      {!loggedInUsername && activeTab === "search" && (
        <p>Please log in to search your booking history.</p>
      )}

      {/* --- Booking Details Tab --- */}
      {activeTab === "details" && !isFetchingDetails && (
        <div>
          <h3>Booking Details</h3>
          {bookingDetails ? (
            <div>
              <p>
                <strong>Booking ID:</strong> {selectedBookingId}
              </p>
              <p>
                <strong>Booking Date:</strong> {bookingDetails.bookingDate}
              </p>
              <p>
                <strong>Cleaner:</strong> {bookingDetails.cleanerName}
              </p>
              <p>
                <strong>Service Category:</strong>{" "}
                {bookingDetails.serviceCategoryName}
              </p>
              <p>
                <strong>Service Description:</strong>{" "}
                {bookingDetails.serviceDescription}
              </p>
              <button
                onClick={() => {
                  setActiveTab("search");
                  clearMessages();
                  setSelectedBookingId(null);
                  setBookingDetails(null);
                }}
              >
                ← Back to Search Results
              </button>
            </div>
          ) : (
            (selectedBookingId && (
              <p>Loading details for booking ID {selectedBookingId}...</p>
            )) || (
              <p>
                Select a booking from the search results to view its details.
                (*＾▽＾)／
              </p>
            )
          )}
        </div>
      )}
      {activeTab === "details" && isFetchingDetails && (
        <p>Fetching booking details...</p>
      )}
    </div>
  );
}

export default HomeOwnerBookingHistoryPage;
