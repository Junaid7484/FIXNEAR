import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";

// =========================================================
// PROTECTED ROUTE
// =========================================================
import ProtectedRoute from "./components/ProtectedRoute";
import MaintenanceNotice from "./components/MaintenanceNotice";

// =========================================================
// PUBLIC / AUTH LAYOUT
// =========================================================
import Navbar from "./PublicDashboard/components/Navbar";
import Footer from "./PublicDashboard/components/Footer";

// =========================================================
// CUSTOMER NAVBAR
// =========================================================
import CustomerNavbar from "./Customer/CustomerNavbar";

// =========================================================
// PUBLIC / AUTH PAGES
// =========================================================
const Home = lazy(() => import("./PublicDashboard/pages/Home"));
const Services = lazy(() => import("./PublicDashboard/pages/Services"));
const About = lazy(() => import("./PublicDashboard/pages/About"));
// import RoleSelection from "./PublicDashboard/pages/RoleSelection";
const ServiceDetails = lazy(
  () => import("./PublicDashboard/pages/ServiceDetails"),
);
const Login = lazy(() => import("./PublicDashboard/pages/Login"));
const Register = lazy(() => import("./PublicDashboard/pages/Register"));
const ForgotPassword = lazy(
  () => import("./PublicDashboard/pages/ForgotPassword"),
);
const ResetPassword = lazy(
  () => import("./PublicDashboard/pages/ResetPassword"),
);
const ContactUs = lazy(() => import("./PublicDashboard/pages/ContactUs"));
const HelpSupport = lazy(() => import("./PublicDashboard/pages/HelpSupport"));
const Policy = lazy(() => import("./PublicDashboard/pages/Policy"));
const TermsAndConditions = lazy(
  () => import("./PublicDashboard/pages/TermsAndConditions"),
);
const NearbyServices = lazy(
  () => import("./PublicDashboard/pages/NearbyServices"),
);

// =========================================================
// PUBLIC PROVIDER PAGES
// =========================================================
const Providers = lazy(() => import("./Provider/Providers"));
const ProviderDetails = lazy(() => import("./Provider/ProviderDetails"));
const ProviderRegistration = lazy(
  () => import("./Provider/ProviderRegistration"),
);
const ProviderLogin = lazy(() => import("./Provider/ProviderLogin"));

// =========================================================
// CUSTOMER PANEL
// =========================================================
const CustomerDashboard = lazy(() => import("./Customer/CustomerDashboard"));
const Booking = lazy(() => import("./Customer/Booking"));
const BookingConfirmation = lazy(
  () => import("./Customer/BookingConfirmation"),
);
const BookingDetails = lazy(() => import("./Customer/BookingDetails"));
const EditProfile = lazy(() => import("./Customer/EditProfile"));
const Favorites = lazy(() => import("./Customer/Favorites"));
const MyBookings = lazy(() => import("./Customer/MyBookings"));
const Profile = lazy(() => import("./Customer/Profile"));
const Notifications = lazy(() => import("./Customer/Notifications"));
const ReviewRating = lazy(() => import("./Customer/ReviewRating"));
const CustomerComplaints = lazy(() => import("./Customer/Complaints"));
const CustomerComplaintDetails = lazy(
  () => import("./Customer/ComplaintDetails"),
);
const Settings = lazy(() => import("./Customer/Settings"));

// =========================================================
// PROVIDER PANEL
// =========================================================
const ProviderHelp = lazy(() => import("./Provider/ProviderHelp"));
const ProviderDashboard = lazy(() => import("./Provider/ProviderDashboard"));
const ProviderProfile = lazy(() => import("./Provider/ProviderProfile"));
const EditProviderProfile = lazy(
  () => import("./Provider/EditProviderProfile"),
);
const ProviderBookings = lazy(() => import("./Provider/ProviderBookings"));
const ProviderBookingDetails = lazy(
  () => import("./Provider/ProviderBookingDetails"),
);
const ProviderBookingAction = lazy(
  () => import("./Provider/ProviderBookingAction"),
);
const ProviderUpdateBookingStatus = lazy(
  () => import("./Provider/ProviderUpdateBookingStatus"),
);
const ProviderServices = lazy(() => import("./Provider/ProviderServices"));
const ProviderServiceForm = lazy(
  () => import("./Provider/ProviderServiceForm"),
);
const ProviderEarnings = lazy(() => import("./Provider/ProviderEarnings"));
const ProviderReviews = lazy(() => import("./Provider/ProviderReviews"));
const ProviderNotifications = lazy(
  () => import("./Provider/ProviderNotifications"),
);
const ProviderSettings = lazy(() => import("./Provider/ProviderSettings"));
const ProviderApplicationStatus = lazy(
  () => import("./Provider/ProviderApplicationStatus"),
);
const ProviderWorkingHours = lazy(
  () => import("./Provider/ProviderWorkingHours"),
);

// =========================================================
// ADMIN PANEL
// =========================================================
const AdminLogin = lazy(() => import("./Admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./Admin/AdminDashboard"));
const ManageUsers = lazy(() => import("./Admin/ManageUsers"));
const UserDetails = lazy(() => import("./Admin/UserDetails"));
const ManageProviders = lazy(() => import("./Admin/ManageProviders"));
const AdminProviderDetails = lazy(() => import("./Admin/ProviderDetails"));
const ProviderVerification = lazy(() => import("./Admin/ProviderVerification"));
const ManageServices = lazy(() => import("./Admin/ManageServices"));
const ServiceForm = lazy(() => import("./Admin/ServiceForm"));
const ManageCategories = lazy(() => import("./Admin/ManageCategories"));
const CategoryForm = lazy(() => import("./Admin/CategoryForm"));
const ManageBookings = lazy(() => import("./Admin/ManageBookings"));
const AdminBookingDetails = lazy(() => import("./Admin/AdminBookingDetails"));
const Complaints = lazy(() => import("./Admin/Complaints"));
const ComplaintDetails = lazy(() => import("./Admin/ComplaintDetails"));
const AdminNotifications = lazy(() => import("./Admin/AdminNotifications"));
const NotificationDetails = lazy(() => import("./Admin/NotificationDetails"));
const AdminSettings = lazy(() => import("./Admin/AdminSettings"));

// =========================================================
// 404
// =========================================================
const PageNotFound = lazy(() => import("./components/PageNotFound"));

// =========================================================
// LAZY PAGE LOADING FALLBACK
// =========================================================
function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
        <p className="text-sm font-medium text-gray-600">Loading page...</p>
      </div>
    </div>
  );
}

// =========================================================
// READ AUTHENTICATION
// =========================================================
function readAuth() {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !user || !user.role) {
      return { token: null, user: null };
    }

    return { token, user };
  } catch (error) {
    console.error("Unable to read authentication:", error);
    return { token: null, user: null };
  }
}

// =========================================================
// PUBLIC LAYOUT
// =========================================================
function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

// =========================================================
// SERVICES ACCESS LAYOUT
//
// Guest            -> Public Navbar + Footer
// Logged-in customer -> Customer Navbar
// Provider/admin     -> Public Navbar on public pages
// =========================================================
function ServicesAccessLayout() {
  const [auth, setAuth] = useState(readAuth);
  const location = useLocation();

  // Refresh auth state when navigating between routes.
  useEffect(() => {
    setAuth(readAuth());
  }, [location.pathname]);

  // Refresh auth state when login/logout dispatches this event.
  useEffect(() => {
    const refreshAuth = () => {
      setAuth(readAuth());
    };

    const handleStorage = () => {
      refreshAuth();
    };

    window.addEventListener("authChanged", refreshAuth);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("authChanged", refreshAuth);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const role = String(auth.user?.role || "")
    .toLowerCase()
    .trim();

  const isCustomer = Boolean(auth.token && auth.user) && role === "customer";

  return (
    <div className="flex min-h-screen flex-col">
      {isCustomer ? <CustomerNavbar user={auth.user} /> : <Navbar />}

      <main className={`flex-1 ${isCustomer ? "pt-20" : ""}`}>
        <Outlet />
      </main>

      {!isCustomer && <Footer />}
    </div>
  );
}

// =========================================================
// APPLICATION
// =========================================================
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* PUBLIC + AUTHENTICATION */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/help-support" element={<HelpSupport />} />
            <Route path="/policy" element={<Policy />} />

            <Route
              path="/terms-and-conditions"
              element={<TermsAndConditions />}
            />

            {/* <Route path="/choose-panel" element={<RoleSelection />} /> */}

            <Route path="/providers" element={<Providers />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/provider/register"
              element={<ProviderRegistration />}
            />

            <Route path="/provider/login" element={<ProviderLogin />} />
          </Route>

          {/* PUBLIC SERVICES / CUSTOMER SERVICES */}
          <Route element={<ServicesAccessLayout />}>
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetails />} />

            <Route path="/providers/:id" element={<ProviderDetails />} />
            <Route path="/booking" element={<Booking />} />
          </Route>

          {/* CUSTOMER PANEL */}
          <Route
            element={
              <MaintenanceNotice>
                <ProtectedRoute allowedRoles={["customer"]} />
              </MaintenanceNotice>
            }
          >
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />

            <Route
              path="/customer/booking/:providerId/:serviceId"
              element={<Booking />}
            />

            <Route path="/nearby-services" element={<NearbyServices />} />
            <Route
              path="/booking-confirmation/:id"
              element={<BookingConfirmation />}
            />

            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/booking-details/:id" element={<BookingDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/review/:id" element={<ReviewRating />} />
            <Route path="/complaints" element={<CustomerComplaints />} />

            <Route
              path="/complaints/:id"
              element={<CustomerComplaintDetails />}
            />
          </Route>

          {/* PROVIDER PANEL */}
          <Route element={<ProtectedRoute allowedRoles={["provider"]} />}>
            <Route path="/provider/dashboard" element={<ProviderDashboard />} />
            <Route path="/provider/profile" element={<ProviderProfile />} />

            <Route
              path="/provider/edit-profile"
              element={<EditProviderProfile />}
            />

            <Route
              path="/provider/application-status"
              element={<ProviderApplicationStatus />}
            />

            <Route path="/provider/bookings" element={<ProviderBookings />} />

            <Route
              path="/provider/bookings/:id"
              element={<ProviderBookingDetails />}
            />

            <Route
              path="/provider/bookings/:id/action"
              element={<ProviderBookingAction />}
            />

            <Route
              path="/provider/bookings/:id/status"
              element={<ProviderUpdateBookingStatus />}
            />

            <Route path="/provider/services" element={<ProviderServices />} />

            <Route
              path="/provider/services/add"
              element={<ProviderServiceForm />}
            />

            <Route
              path="/provider/services/:id/edit"
              element={<ProviderServiceForm />}
            />

            <Route path="/provider/earnings" element={<ProviderEarnings />} />
            <Route path="/provider/reviews" element={<ProviderReviews />} />

            <Route
              path="/provider/notifications"
              element={<ProviderNotifications />}
            />

            <Route path="/provider/settings" element={<ProviderSettings />} />

            <Route
              path="/provider/working-hours"
              element={<ProviderWorkingHours />}
            />

            <Route path="/provider/help" element={<ProviderHelp />} />
          </Route>

          {/* ADMIN LOGIN */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* ADMIN PANEL */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/users/:id" element={<UserDetails />} />
            <Route path="/admin/providers" element={<ManageProviders />} />

            <Route
              path="/admin/providers/:id"
              element={<AdminProviderDetails />}
            />

            <Route
              path="/admin/providers/:id/verify"
              element={<ProviderVerification />}
            />

            <Route path="/admin/services" element={<ManageServices />} />
            <Route path="/admin/services/add" element={<ServiceForm />} />
            <Route path="/admin/services/:id/edit" element={<ServiceForm />} />

            <Route path="/admin/categories" element={<ManageCategories />} />
            <Route path="/admin/categories/add" element={<CategoryForm />} />

            <Route
              path="/admin/categories/:id/edit"
              element={<CategoryForm />}
            />

            <Route path="/admin/bookings" element={<ManageBookings />} />

            <Route
              path="/admin/bookings/:id"
              element={<AdminBookingDetails />}
            />

            <Route path="/admin/complaints" element={<Complaints />} />

            <Route
              path="/admin/complaints/:id"
              element={<ComplaintDetails />}
            />

            <Route
              path="/admin/notifications"
              element={<AdminNotifications />}
            />

            <Route
              path="/admin/notifications/:id"
              element={<NotificationDetails />}
            />

            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
