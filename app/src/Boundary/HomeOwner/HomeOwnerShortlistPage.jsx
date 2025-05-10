import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

// --- Reusable API Call Helper ---
// This function is assumed to be similar to the one provided in your example.
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
 * Page for Homeowners to view and search their shortlisted services.
 */
function HomeOwnerShortlistPage() {
  // --- State Variables ---
  const [activeTab, setActiveTab] = useState("welcome"); // 'welcome', 'searchShortlist', 'viewDetail'
  const [isLoading, setIsLoading] = useState(false); // General loading for search
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loggedInUsername, setLoggedInUsername] = useState("");
  const navigate = useNavigate();

  // Search Shortlist Tab State
  const [searchParams, setSearchParams] = useState({
    cleanerUsername: "",
    description: "",
    minPrice: "",
    maxPrice: "",
  });
  const [searchResults, setSearchResults] = useState([]); // Stores array of service IDs

  // View Detail Tab State
  const [selectedService, setSelectedService] = useState(null); // Full details of the selected service

  // --- Helper Functions ---
  const showMessage = useCallback((text, type = "error") => {
    setMessage({ text, type });
  }, []);

  const clearMessages = useCallback(() => {
    setMessage({ text: "", type: "" });
  }, []);

  const fetchAllShortlistedServices = useCallback(async () => {
    if (!loggedInUsername) return;
    setIsLoading(true);
    clearMessages();
    try {
      const query = new URLSearchParams();
      query.append("homeownerUsername", loggedInUsername);
      const serviceIds = await apiCall(
        `/api/homeowner/shortlist/search?${query.toString()}`
      );
      setSearchResults(serviceIds || []);
      if (!serviceIds || serviceIds.length === 0) {
        showMessage("Your shortlist is currently empty.", "info");
      }
    } catch (error) {
      showMessage(error.message || "Failed to fetch shortlisted services.");
    } finally {
      setIsLoading(false);
    }
  }, [loggedInUsername, clearMessages, showMessage]);

  const handleRemoveFromShortlist = async (serviceId) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this service from your shortlist?"
      )
    ) {
      return;
    }

    setIsLoading(true);
    clearMessages();
    try {
      await apiCall(
        `/api/homeowner/shortlist/delete/${loggedInUsername}/${serviceId}`,
        "DELETE"
      );
      showMessage("Service removed from shortlist successfully!", "success");
      // Refresh the list after removal
      fetchAllShortlistedServices();
    } catch (error) {
      showMessage(error.message || "Failed to remove service from shortlist.");
    } finally {
      setIsLoading(false);
    }
  };

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
          navigate("/login", { replace: true }); // Redirect if username is critical
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
        "No user session found. Please log in to view your shortlist.",
        "error"
      );
      navigate("/login", { replace: true }); // Shortlist requires login
    }
  }, [navigate, showMessage]);

  useEffect(() => {
    if (activeTab === "searchShortlist" && loggedInUsername) {
      fetchAllShortlistedServices();
    }
  }, [activeTab, loggedInUsername, fetchAllShortlistedServices]);

  // --- API Call Functions & Related Logic ---

  // Handle Shortlist Search
  const handleSearchShortlist = async (e) => {
    e.preventDefault();
    if (!loggedInUsername) {
      showMessage("You must be logged in to search your shortlist.", "error");
      return;
    }
    setIsLoading(true);
    clearMessages();
    setSearchResults([]);
    try {
      const query = new URLSearchParams();
      query.append("homeownerUsername", loggedInUsername);
      if (searchParams.cleanerUsername)
        query.append("cleanerUsername", searchParams.cleanerUsername);
      if (searchParams.description)
        query.append("description", searchParams.description);
      if (searchParams.minPrice)
        query.append("minPrice", searchParams.minPrice);
      if (searchParams.maxPrice)
        query.append("maxPrice", searchParams.maxPrice);

      // The API returns an array of service IDs
      const serviceIds = await apiCall(
        `/api/homeowner/shortlist/search?${query.toString()}`
      );
      setSearchResults(serviceIds || []);
      if (!serviceIds || serviceIds.length === 0) {
        showMessage(
          "No shortlisted services found matching your criteria.",
          "info"
        );
      }
    } catch (error) {
      showMessage(error.message || "Failed to search your shortlist.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Search Input Changes
  const handleSearchInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch Full Details for a Selected Service ID
  const fetchServiceDetails = async (serviceId) => {
    setIsFetchingDetails(true);
    clearMessages();
    setSelectedService(null);
    try {
      // Uses the same endpoint as HomeOwnerServicePage to get service details
      const serviceDetails = await apiCall(
        `/api/homeowner/service/${serviceId}`
      );
      setSelectedService(serviceDetails);
      setActiveTab("viewDetail"); // Switch to viewDetail tab
    } catch (error) {
      showMessage(
        error.message || `Failed to fetch details for service ID ${serviceId}.`
      );
    } finally {
      setIsFetchingDetails(false);
    }
  };

  // --- Render Logic ---
  return (
    <div>
      {loggedInUsername && (
        <p style={{ fontStyle: "italic", textAlign: "right" }}>
          Viewing shortlist for: {loggedInUsername}
        </p>
      )}
      <Link to="/homeowner/dashboard">← Back to Homeowner Dashboard</Link>
      <h2>My Shortlisted Services</h2>

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
            setActiveTab("welcome");
            clearMessages();
          }}
          disabled={activeTab === "welcome"}
        >
          Welcome
        </button>
        <button
          onClick={() => {
            setActiveTab("searchShortlist");
            clearMessages();
          }}
          disabled={activeTab === "searchShortlist"}
        >
          Search My Shortlist
        </button>
        <button
          onClick={() => setActiveTab("viewDetail")}
          disabled={activeTab === "viewDetail" || !selectedService}
        >
          View Service Detail
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
      {(isLoading || isFetchingDetails) && <p>Loading...</p>}

      {/* --- Welcome Tab --- */}
      {activeTab === "welcome" && (
        <div>
          <h3>Welcome Back, {loggedInUsername}!</h3>
          <p>
            Here you can manage and review the services you've shortlisted. ( ´
            ▽ ` )ﾉ
          </p>
          <p>
            Click on the "Search My Shortlist" tab to find specific services or
            browse all your saved items.
          </p>
        </div>
      )}

      {/* --- Search Shortlist Tab --- */}
      {activeTab === "searchShortlist" && !isLoading && loggedInUsername && (
        <div>
          <h3>Your Shortlisted Services</h3>
          <form
            onSubmit={handleSearchShortlist}
            style={{ marginBottom: "20px" }}
          >
            <details>
              <summary style={{ marginBottom: "10px", cursor: "pointer" }}>
                Search Filters (click to expand)
              </summary>
              <div
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                <input
                  type="text"
                  name="cleanerUsername"
                  placeholder="Cleaner's username contains..."
                  value={searchParams.cleanerUsername}
                  onChange={handleSearchInputChange}
                  style={{ marginRight: "10px", marginBottom: "5px" }}
                />
                <input
                  type="text"
                  name="description"
                  placeholder="Description contains..."
                  value={searchParams.description}
                  onChange={handleSearchInputChange}
                  style={{ marginRight: "10px", marginBottom: "5px" }}
                />
                <input
                  type="number"
                  name="minPrice"
                  placeholder="Min Price/hr"
                  value={searchParams.minPrice}
                  onChange={handleSearchInputChange}
                  min="0"
                  step="0.01"
                  style={{
                    width: "120px",
                    marginRight: "5px",
                    marginBottom: "5px",
                  }}
                />
                <input
                  type="number"
                  name="maxPrice"
                  placeholder="Max Price/hr"
                  value={searchParams.maxPrice}
                  onChange={handleSearchInputChange}
                  min="0"
                  step="0.01"
                  style={{
                    width: "120px",
                    marginRight: "10px",
                    marginBottom: "5px",
                  }}
                />
                <div style={{ marginTop: "10px" }}>
                  <button type="submit" disabled={isLoading}>
                    Apply Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchParams({
                        cleanerUsername: "",
                        description: "",
                        minPrice: "",
                        maxPrice: "",
                      });
                      fetchAllShortlistedServices();
                    }}
                    disabled={isLoading}
                    style={{ marginLeft: "10px" }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </details>
          </form>
          <h4>Shortlisted Services:</h4>
          {searchResults.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {searchResults.map((service) => (
                <li
                  key={service.serviceId}
                  style={{
                    marginBottom: "10px",
                    padding: "10px",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                  }}
                >
                  <div>
                    <strong>{service.categoryName}</strong>
                    <span style={{ color: "#666" }}>
                      {" "}
                      by {service.cleanerUsername}
                    </span>
                    <br />
                    <em>
                      {service.description.substring(0, 100)}
                      {service.description.length > 100 ? "..." : ""}
                    </em>
                    <br />
                    Price: €{service.pricePerHour.toFixed(2)}/hr
                  </div>
                  <div
                    style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                  >
                    <button
                      onClick={() => fetchServiceDetails(service.serviceId)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      disabled={isFetchingDetails}
                    >
                      {isFetchingDetails &&
                      selectedService?.serviceId === service.serviceId
                        ? "Loading..."
                        : "View Details"}
                    </button>
                    <button
                      onClick={() =>
                        handleRemoveFromShortlist(service.serviceId)
                      }
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !message.text && <p>No shortlisted services found. (˘･_･˘)</p>
          )}
        </div>
      )}
      {activeTab === "searchShortlist" && !loggedInUsername && (
        <p>Please ensure you are logged in to search your shortlist.</p>
      )}

      {/* --- View Service Detail Tab --- */}
      {activeTab === "viewDetail" && !isFetchingDetails && (
        <div>
          <h3>Shortlisted Service Details</h3>
          {selectedService ? (
            <div>
              <p>
                <strong>Service ID:</strong> {selectedService.serviceId}
              </p>
              <p>
                <strong>Provided by:</strong> {selectedService.cleanerUsername}
              </p>
              <p>
                <strong>Category:</strong>{" "}
                {selectedService.categoryName ||
                  `Category ID: ${selectedService.categoryId}`}
              </p>
              <p>
                <strong>Description:</strong> {selectedService.description}
              </p>
              <p>
                <strong>Price Per Hour:</strong> €
                {typeof selectedService.pricePerHour === "number"
                  ? selectedService.pricePerHour.toFixed(2)
                  : "N/A"}
              </p>
            </div>
          ) : (
            <p>
              Please select a service ID from the "Search My Shortlist" tab to
              view its details. (⌒_⌒;)
            </p>
          )}
        </div>
      )}
      {activeTab === "viewDetail" && isFetchingDetails && (
        <p>Fetching service details...</p>
      )}
    </div>
  );
}

export default HomeOwnerShortlistPage;
