import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

// --- Reusable API Call Helper ---
// This function is assumed to be similar to the one provided in your example.
async function apiCall(url, method = "GET", body = null) {
  const apiUrl = url.startsWith("/api")
    ? url
    : `/api${url.startsWith("/") ? "" : "/"}${url}`;
  const options = { method, headers: {} };
  // Add authorization header if needed (e.g., from localStorage)
  // const token = localStorage.getItem('authToken');
  // if (token) { options.headers['Authorization'] = `Bearer ${token}`; }
  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  try {
    const response = await fetch(apiUrl, options);
    const contentType = response.headers.get("content-type");
    let data;
    if (response.status === 204) {
      // Handle 204 No Content
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
    throw error; // Re-throw to be caught by calling function
  }
}

/**
 * Page for Homeowners to search for services and manage their shortlist.
 */
function HomeOwnerServicePage() {
  // --- State Variables ---
  const [activeTab, setActiveTab] = useState("welcome"); // 'welcome', 'search', 'details'
  const [isLoading, setIsLoading] = useState(false); // General loading for search
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isSavingToShortlist, setIsSavingToShortlist] = useState(false);
  const [isCheckingShortlistStatus, setIsCheckingShortlistStatus] =
    useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // Feedback messages
  const [loggedInUsername, setLoggedInUsername] = useState(""); // Homeowner's username
  const navigate = useNavigate();

  // Search Tab State
  const [searchParams, setSearchParams] = useState({
    categoryName: "",
    minPrice: "",
    maxPrice: "",
  });
  const [searchResults, setSearchResults] = useState([]); // [{ serviceId, description, pricePerHour, cleanerUsername, categoryName/Id ... }]

  // Details Tab State
  const [selectedService, setSelectedService] = useState(null); // Full details of the selected service
  const [isShortlisted, setIsShortlisted] = useState(false); // If the selected service is shortlisted

  // Categories State
  const [categories, setCategories] = useState([]); // [{id, name}]
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);

  // --- Helper Functions ---
  const showMessage = useCallback((text, type = "error") => {
    setMessage({ text, type });
  }, []);

  const clearMessages = useCallback(() => {
    setMessage({ text: "", type: "" });
  }, []);

  // --- Effect to get logged-in username on mount ---
  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && userData.username) {
          setLoggedInUsername(userData.username);
        } else {
          console.error(
            "Logged in user data in localStorage is missing username."
          );
          showMessage("Could not identify logged-in user.", "error");
        }
      } catch (e) {
        console.error("Error parsing user data from localStorage", e);
        localStorage.removeItem("loggedInUser"); // Clear corrupted data
        showMessage(
          "Error reading user session. Please log in again.",
          "error"
        );
        navigate("/login", { replace: true });
      }
    } else {
      showMessage(
        "No user session found. Please log in to manage shortlists.",
        "info"
      );
      // navigate('/login', { replace: true }); // Optional: redirect if login is strictly required for any view
    }
  }, [navigate, showMessage]);

  // --- API Call Functions & Related Logic ---

  // Function to check shortlist status
  const checkIfShortlisted = useCallback(
    async (serviceId) => {
      if (!loggedInUsername) return false;
      setIsCheckingShortlistStatus(true);
      clearMessages();
      try {
        const response = await apiCall(
          `/api/homeowner/shortlist/entry/${loggedInUsername}/${serviceId}`
        );
        return response.exists || false;
      } catch (error) {
        console.error(
          `Error checking shortlist status for service ${serviceId}:`,
          error
        );
        return false;
      } finally {
        setIsCheckingShortlistStatus(false);
      }
    },
    [loggedInUsername, clearMessages]
  );

  // Function to fetch categories
  const fetchCategories = useCallback(async () => {
    setIsFetchingCategories(true);
    try {
      const fetchedCategories = await apiCall(
        "/api/platform/serviceCategories/search"
      );
      setCategories(fetchedCategories || []);
    } catch (error) {
      showMessage("Failed to load service categories", "error");
    } finally {
      setIsFetchingCategories(false);
    }
  }, [showMessage]);

  // Effect to check shortlist status when a service is selected for details view
  useEffect(() => {
    if (selectedService && activeTab === "details" && loggedInUsername) {
      const checkStatus = async () => {
        try {
          const status = await checkIfShortlisted(selectedService.serviceId);
          setIsShortlisted(status);
        } catch (error) {
          console.error(`Error checking shortlist status:`, error);
          showMessage("Failed to check shortlist status.", "error");
        }
      };
      checkStatus();
    } else if (
      selectedService &&
      activeTab === "details" &&
      !loggedInUsername
    ) {
      setIsShortlisted(false); // Can't be shortlisted if not logged in
    }
  }, [
    selectedService,
    activeTab,
    checkIfShortlisted,
    loggedInUsername,
    showMessage,
  ]);

  // Effect to fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle Service Search
  const handleSearchServices = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();
    setSearchResults([]);
    try {
      const query = new URLSearchParams();
      if (searchParams.categoryName)
        query.append("categoryName", searchParams.categoryName);
      if (searchParams.minPrice)
        query.append("minPrice", searchParams.minPrice);
      if (searchParams.maxPrice)
        query.append("maxPrice", searchParams.maxPrice);

      const results = await apiCall(
        `/api/homeowner/services/search?${query.toString()}`
      );
      setSearchResults(results || []);
      if (!results || results.length === 0) {
        showMessage("No services found matching your criteria.", "info");
      }
    } catch (error) {
      showMessage(error.message || "Failed to search for services.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Search Input Changes
  const handleSearchInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch Full Details for a Selected Service
  const fetchServiceDetails = async (serviceId) => {
    setIsFetchingDetails(true);
    clearMessages();
    setSelectedService(null);
    try {
      const serviceDetails = await apiCall(
        `/api/homeowner/service/${serviceId}`
      );
      setSelectedService(serviceDetails);
      setActiveTab("details"); // Switch to details tab
    } catch (error) {
      showMessage(
        error.message || `Failed to fetch details for service ID ${serviceId}.`
      );
      // Potentially switch back to search or stay, depending on UX preference
    } finally {
      setIsFetchingDetails(false);
    }
  };

  // Handle Save to Shortlist
  const handleSaveToShortlist = async () => {
    if (!selectedService) return;
    if (!loggedInUsername) {
      showMessage(
        "You must be logged in to save services to your shortlist.",
        "error"
      );
      return;
    }
    setIsSavingToShortlist(true);
    clearMessages();
    try {
      const result = await apiCall("/api/homeowner/shortlist", "POST", {
        serviceId: selectedService.serviceId,
        homeownerUsername: loggedInUsername,
      });
      showMessage(
        result.message || "Service saved to shortlist successfully!",
        "success"
      );
      setIsShortlisted(true); // Update UI to reflect it's now shortlisted
    } catch (error) {
      showMessage(error.message || "Failed to save service to shortlist.");
    } finally {
      setIsSavingToShortlist(false);
    }
  };

  // --- Render Logic ---
  return (
    <div>
      {loggedInUsername && (
        <p style={{ fontStyle: "italic", textAlign: "right" }}>
          Logged in as: {loggedInUsername}
        </p>
      )}
      <Link to="/homeowner/dashboard">← Back to Homeowner Dashboard</Link>
      <h2>Find Cleaning Services</h2>

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
            setActiveTab("search");
            clearMessages();
          }}
          disabled={activeTab === "search"}
        >
          Search Services
        </button>
        <button
          onClick={() => setActiveTab("details")}
          disabled={activeTab === "details" || !selectedService}
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
      {(isLoading ||
        isFetchingDetails ||
        isSavingToShortlist ||
        isCheckingShortlistStatus) && <p>Loading...</p>}

      {/* --- Welcome Tab --- */}
      {activeTab === "welcome" && (
        <div>
          <h3>Welcome, {loggedInUsername}!</h3>
          <p>Ready to find the perfect cleaning service for your home?</p>
          <p>Click on the "Search Services" tab above to begin your search.</p>
        </div>
      )}

      {/* --- Search Tab --- */}
      {activeTab === "search" && !isLoading && (
        <div>
          <h3>Search for Services</h3>
          <form onSubmit={handleSearchServices}>
            <select
              name="categoryName"
              value={searchParams.categoryName}
              onChange={handleSearchInputChange}
              style={{
                marginRight: "10px",
                marginBottom: "5px",
                padding: "5px",
              }}
            >
              <option value="">-- All Categories --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            {isFetchingCategories && (
              <span style={{ fontSize: "0.8em" }}> Loading categories...</span>
            )}
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
            <button type="submit" disabled={isLoading || isFetchingCategories}>
              Search
            </button>
          </form>
          <h4>Results:</h4>
          {searchResults.length > 0 ? (
            <ul>
              {searchResults.map((service) => (
                <li key={service.serviceId}>
                  <strong>
                    {service.categoryName ||
                      `Category ID: ${service.categoryId}`}
                  </strong>{" "}
                  by {service.cleanerUsername}
                  <br />
                  <em>
                    {service.description.substring(0, 100)}
                    {service.description.length > 100 ? "..." : ""}
                  </em>
                  <br />
                  Price: €
                  {typeof service.pricePerHour === "number"
                    ? service.pricePerHour.toFixed(2)
                    : "N/A"}
                  /hr
                  <button
                    onClick={() => fetchServiceDetails(service.serviceId)}
                    style={{ marginLeft: "10px" }}
                    disabled={isFetchingDetails}
                  >
                    {isFetchingDetails &&
                    selectedService?.serviceId === service.serviceId
                      ? "Loading..."
                      : "View Details"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !message.text && (
              <p>
                No results to display. Please refine your search or try
                different terms.
              </p>
            )
          )}
        </div>
      )}

      {/* --- View Service Detail Tab --- */}
      {activeTab === "details" && !isFetchingDetails && (
        <div>
          <h3>Service Details</h3>
          {selectedService ? (
            <div>
              <p>
                <strong>Service ID:</strong> {selectedService.serviceId}
              </p>
              <p>
                <strong>Provided by:</strong> {selectedService.cleanerUsername}
              </p>
              <p>
                <strong>Category:</strong> {selectedService.categoryName}
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
              <hr />
              {loggedInUsername ? (
                isCheckingShortlistStatus ? (
                  <p>Checking shortlist status...</p>
                ) : (
                  <button
                    onClick={handleSaveToShortlist}
                    disabled={isSavingToShortlist || isShortlisted}
                  >
                    {isShortlisted
                      ? "✓ Already in Shortlist"
                      : isSavingToShortlist
                      ? "Saving..."
                      : "Save to Shortlist ♡"}
                  </button>
                )
              ) : (
                <p style={{ color: "orange" }}>
                  Please log in to save this service to your shortlist.
                </p>
              )}
            </div>
          ) : (
            <p>
              Please select a service from the "Search Services" tab to view its
              details.
            </p>
          )}
        </div>
      )}
      {activeTab === "details" && isFetchingDetails && (
        <p>Fetching service details...</p>
      )}
    </div>
  );
}

export default HomeOwnerServicePage;
