import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// ================================================================================
// --- Import Controllers ---
// ================================================================================
// Shared login for all roles
import { LoginController } from "./controllers/Login/LoginController.js";

// User Account Controllers
import { CreateUserAccountController } from "./controllers/UserAdmin/UserAccount/CreateUserAccountController.js";
import { ReadUserAccountController } from "./controllers/UserAdmin/UserAccount/ReadUserAccountController.js";
import { UpdateUserAccountController } from "./controllers/UserAdmin/UserAccount/UpdateUserAccountController.js";
import { SuspendUserAccountController } from "./controllers/UserAdmin/UserAccount/SuspendUserAccountController.js";
import { SearchUserAccountController } from "./controllers/UserAdmin/UserAccount/SearchUserAccountController.js";
// User Profile Controllers
import { CreateUserProfileController } from "./controllers/UserAdmin/UserProfile/CreateUserProfileController.js";
import { ReadUserProfileController } from "./controllers/UserAdmin/UserProfile/ReadUserProfileController.js";
import { UpdateUserProfileController } from "./controllers/UserAdmin/UserProfile/UpdateUserProfileController.js";
import { DeleteUserProfileController } from "./controllers/UserAdmin/UserProfile/DeleteUserProfileController.js";
import { SearchUserProfileController } from "./controllers/UserAdmin/UserProfile/SearchUserProfileController.js";

// Cleaner Service Controllers
import { CreateServiceController } from "./controllers/Cleaner/Service/CreateServiceController.js";
import { ReadServiceController } from "./controllers/Cleaner/Service/ReadServiceController.js";
import { UpdateServiceController } from "./controllers/Cleaner/Service/UpdateServiceController.js";
import { DeleteServiceController } from "./controllers/Cleaner/Service/DeleteServiceController.js";
import { SearchServiceController } from "./controllers/Cleaner/Service/SearchServiceController.js";
// Cleaner Statistics Controllers
import { ReadProfileViewCountController } from "./controllers/Cleaner/Statistics/ReadProfileViewCountController.js";
import { ReadShortlistedCountController } from "./controllers/Cleaner/Statistics/ReadShortlistedCountController.js";
// Cleaner Booking History Controllers
import { ReadBookingHistoryController } from "./controllers/Cleaner/Matches/ReadBookingHistoryController.js";
import { SearchBookingHistoryController } from "./controllers/Cleaner/Matches/SearchBookingHistoryController.js";

// Homeowner Service Controllers
import { ReadServiceController as HomeOwnerReadServiceController } from "./controllers/HomeOwner/Cleaners/ReadServiceController.js";
import { SearchServiceController as HomeOwnerSearchServiceController } from "./controllers/HomeOwner/Cleaners/SearchServiceController.js";
// Homeowner Shortlist Controllers
import { CreateShortlistController } from "./controllers/HomeOwner/Shortlist/CreateShortlistController.js";
import { ReadShortlistController } from "./controllers/HomeOwner/Shortlist/ReadShortlistController.js";
import { SearchShortlistController } from "./controllers/HomeOwner/Shortlist/SearchShortlistController.js";
import { DeleteShortlistController } from "./controllers/HomeOwner/Shortlist/DeleteShortlistController.js";
// Homeowner Booking History Controllers
import { ReadHistoryController } from "./controllers/HomeOwner/Bookings/ReadHistoryController.js";
import { SearchHistoryController } from "./controllers/HomeOwner/Bookings/SearchHistoryController.js";

// Service Category Controllers
import { CreateServiceCategoryController } from "./controllers/PlatformManagement/ServiceCategory/CreateSvcCateController.js";
import { ReadServiceCategoryController } from "./controllers/PlatformManagement/ServiceCategory/ReadSvcCateController.js";
import { UpdateServiceCategoryController } from "./controllers/PlatformManagement/ServiceCategory/UpdateSvcCateController.js";
import { DeleteServiceCategoryController } from "./controllers/PlatformManagement/ServiceCategory/DeleteSvcCateController.js";
import { SearchSvcCateController } from "./controllers/PlatformManagement/ServiceCategory/SearchSvcCateController.js";

// Metrics Controllers
import { ReadDailyReportController } from "./controllers/PlatformManagement/Reports/ReadDailyReportController.js";
import { ReadWeeklyReportController } from "./controllers/PlatformManagement/Reports/ReadWeeklyReportController.js";
import { ReadMonthlyReportController } from "./controllers/PlatformManagement/Reports/ReadMonthlyReportController.js";

// ================================================================================
// --- Application Setup ---
// ================================================================================
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ================================================================================
// --- Instantiate Controllers ---
// ================================================================================
// Shared login for all roles
const loginController = new LoginController();

// User Account Controllers
const createUserAccountController = new CreateUserAccountController();
const readUserAccountController = new ReadUserAccountController();
const updateUserAccountController = new UpdateUserAccountController();
const suspendUserAccountController = new SuspendUserAccountController();
const searchUserAccountController = new SearchUserAccountController();
// User Profile Controllers
const createUserProfileController = new CreateUserProfileController();
const readUserProfileController = new ReadUserProfileController();
const updateUserProfileController = new UpdateUserProfileController();
const deleteUserProfileController = new DeleteUserProfileController();
const searchUserProfileController = new SearchUserProfileController();

// Cleaner Service Controllers
const createServiceController = new CreateServiceController();
const readServiceController = new ReadServiceController();
const updateServiceController = new UpdateServiceController();
const deleteServiceController = new DeleteServiceController();
const searchServiceController = new SearchServiceController();
// Cleaner Statistics Controllers
const readProfileViewCountController = new ReadProfileViewCountController();
const readShortlistedCountController = new ReadShortlistedCountController();
// Cleaner Booking History Controllers
const readBookingHistoryController = new ReadBookingHistoryController();
const searchBookingHistoryController = new SearchBookingHistoryController();

// Homeowner Service Controllers
const homeOwnerReadServiceController = new HomeOwnerReadServiceController();
const homeOwnerSearchServiceController = new HomeOwnerSearchServiceController();
// Homeowner Shortlist Controllers
const createShortlistController = new CreateShortlistController();
const readShortlistController = new ReadShortlistController();
const searchShortlistController = new SearchShortlistController();
const deleteShortlistController = new DeleteShortlistController();
// Homeowner Booking History Controllers
const readHistoryController = new ReadHistoryController();
const searchHistoryController = new SearchHistoryController();

// Platform Management Service Category Controllers
const createServiceCategoryController = new CreateServiceCategoryController();
const readServiceCategoryController = new ReadServiceCategoryController();
const updateServiceCategoryController = new UpdateServiceCategoryController();
const deleteServiceCategoryController = new DeleteServiceCategoryController();
const searchServiceCategoryController = new SearchSvcCateController();
// Platform Management Metrics Controllers
const readDailyReportController = new ReadDailyReportController();
const readWeeklyReportController = new ReadWeeklyReportController();
const readMonthlyReportController = new ReadMonthlyReportController();

// ================================================================================
// --- Routes ---
// ================================================================================
// Authentication (Shared)
app.post("/api/login", loginController.login);

// User Admin - Account Management API
app.post("/api/useradmin/account", createUserAccountController.createAccount);
app.get(
  "/api/useradmin/account/:username/",
  readUserAccountController.getAccount
);
app.put(
  "/api/useradmin/account/:username/",
  updateUserAccountController.updateAccount
);
app.put(
  "/api/useradmin/account/:username/suspend",
  suspendUserAccountController.suspendAccount
);
app.get(
  "/api/useradmin/accounts/search",
  searchUserAccountController.searchAccounts
);
// User Admin - Profile Management API
app.post("/api/useradmin/profile", createUserProfileController.createProfile);
app.get(
  "/api/useradmin/profile/:username/",
  readUserProfileController.getProfile
);
app.put(
  "/api/useradmin/profile/:username/",
  updateUserProfileController.updateProfile
);
app.delete(
  "/api/useradmin/profile/:username/",
  deleteUserProfileController.deleteProfile
);
app.get(
  "/api/useradmin/profiles/search",
  searchUserProfileController.searchProfiles
);

// Cleaner - Service API
app.post("/api/cleaner/service", createServiceController.createService);
app.get("/api/cleaner/service/search", searchServiceController.searchServices);
app.get("/api/cleaner/service/:id", readServiceController.getService);
app.put("/api/cleaner/service/:id", updateServiceController.updateService);
app.delete("/api/cleaner/service/:id", deleteServiceController.deleteService);
// Cleaner - Statistics API
app.get(
  "/api/cleaner/profileView/:username",
  readProfileViewCountController.getProfileViewCount
);
app.get(
  "/api/cleaner/serviceStats/:username",
  readShortlistedCountController.getServiceShortlistStats
);
// Cleaner - Booking History API
app.get(
  "/api/cleaner/bookingHistory/search",
  searchBookingHistoryController.searchBookingHistory
);
app.get(
  "/api/cleaner/bookingHistory/booking/:bookingId",
  readBookingHistoryController.readBookingHistory
);

// Homeowner - Service API
app.get(
  "/api/homeowner/service/:id",
  homeOwnerReadServiceController.getService
);
app.get(
  "/api/homeowner/services/search",
  homeOwnerSearchServiceController.searchServices
);
// Homeowner - Shortlist API
app.post("/api/homeowner/shortlist", createShortlistController.createShortlist);
app.get(
  "/api/homeowner/shortlist/entry/:homeOwnerUsername/:serviceId",
  readShortlistController.checkShortlistEntry
);
app.get(
  "/api/homeowner/shortlist/search",
  searchShortlistController.searchShortlistedServices
);
app.delete(
  "/api/homeowner/shortlist/delete/:homeownerUsername/:serviceId",
  deleteShortlistController.deleteShortlistEntry
);
// Homeowner - Booking History API
app.get(
  "/api/homeowner/booking/:bookingId",
  readHistoryController.getBookingDetailsById
);
app.get(
  "/api/homeowner/bookings/search",
  searchHistoryController.searchBookings
);

// Platform Management - Service Category API
app.post(
  "/api/platform/serviceCategory",
  createServiceCategoryController.createCategory
);
app.get(
  "/api/platform/serviceCategory/:id",
  readServiceCategoryController.getCategoryById
);
app.put(
  "/api/platform/serviceCategory/:id",
  updateServiceCategoryController.updateCategory
);
app.delete(
  "/api/platform/serviceCategory/:id",
  deleteServiceCategoryController.deleteCategory
);
app.get(
  "/api/platform/serviceCategories/search",
  searchServiceCategoryController.searchCategories
);
// Platform Management - Metrics API
app.get(
  "/api/platform/report/daily/:date",
  readDailyReportController.getDailyStats
);
app.get(
  "/api/platform/report/weekly/:monday",
  readWeeklyReportController.getWeeklyStats
);
app.get(
  "/api/platform/report/monthly/:year/:month",
  readMonthlyReportController.getMonthlyStats
);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
