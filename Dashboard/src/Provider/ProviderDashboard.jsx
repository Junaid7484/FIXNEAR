import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  CalendarDays,
  BriefcaseBusiness,
  Wallet,
  Star,
  Bell,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  Clock3,
  XCircle,
  PlayCircle,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Power,
  RefreshCw,
  Check,
  Ban,
  Loader2,
  ChevronRight,
  MessageSquare,
  Eye,
  MessageCircleMore
} from "lucide-react";

import API from "../services/api";

function ProviderDashboard() {
  const navigate = useNavigate();

  // =========================================================
  // STATES
  // =========================================================

  const [provider, setProvider] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    confirmed: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0,
    totalEarnings: 0,
  });

  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [error, setError] = useState("");
  const [bookingsError, setBookingsError] = useState("");
  const [reviewsError, setReviewsError] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  // =========================================================
  // AUTH ERROR HANDLER
  // =========================================================

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("provider");
    localStorage.removeItem("role");

    navigate("/login");
  };

  // =========================================================
  // FETCH PROVIDER PROFILE
  // =========================================================

  const fetchProviderProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await API.get("/providers/my/profile");

      if (response.data?.success) {
        const providerData = response.data?.provider || response.data?.data;

        setProvider(providerData);

        localStorage.setItem("provider", JSON.stringify(providerData));

        return providerData;
      }

      throw new Error(
        response.data?.message || "Unable to load provider profile.",
      );
    } catch (err) {
      console.error("Provider Profile Error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return null;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load provider profile.",
      );

      return null;
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH PROVIDER BOOKINGS
  // =========================================================

  const fetchProviderBookings = async () => {
    try {
      setBookingsLoading(true);
      setBookingsError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await API.get("/bookings/provider/my");

      if (response.data?.success) {
        setBookings(response.data?.bookings || []);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error("Provider Bookings Error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setBookingsError(
        err.response?.data?.message || "Unable to load bookings.",
      );

      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  // =========================================================
  // FETCH PROVIDER BOOKING STATS
  // =========================================================

  const fetchProviderStats = async () => {
    try {
      setStatsLoading(true);

      const response = await API.get("/bookings/provider/stats");

      if (response.data?.success) {
        setStats(
          response.data?.stats || {
            total: 0,
            pending: 0,
            accepted: 0,
            confirmed: 0,
            inProgress: 0,
            completed: 0,
            rejected: 0,
            cancelled: 0,
            totalEarnings: 0,
          },
        );
      }
    } catch (err) {
      console.error("Provider Stats Error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
    } finally {
      setStatsLoading(false);
    }
  };

  // =========================================================
  // FETCH PROVIDER REVIEWS
  // =========================================================

  const fetchProviderReviews = async (providerId) => {
    if (!providerId) {
      setReviewsLoading(false);
      return;
    }

    try {
      setReviewsLoading(true);
      setReviewsError("");

      const response = await API.get(`/reviews/provider/${providerId}`);

      if (response.data?.success) {
        const receivedReviews =
          response.data?.reviews || response.data?.data || [];

        setReviews(receivedReviews);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error("Provider Reviews Error:", err);

      setReviewsError(err.response?.data?.message || "Unable to load reviews.");

      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    const loadDashboard = async () => {
      const providerData = await fetchProviderProfile();

      await Promise.all([fetchProviderBookings(), fetchProviderStats()]);

      if (providerData?._id) {
        await fetchProviderReviews(providerData._id);
      }
    };

    loadDashboard();
  }, [navigate]);

  // =========================================================
  // REFRESH EVERYTHING
  // =========================================================

  const refreshDashboard = async () => {
    try {
      setBookingsLoading(true);
      setStatsLoading(true);

      const providerResponse = await API.get("/providers/my/profile");

      const providerData =
        providerResponse.data?.provider || providerResponse.data?.data;

      if (providerData) {
        setProvider(providerData);

        localStorage.setItem("provider", JSON.stringify(providerData));

        await fetchProviderReviews(providerData._id);
      }

      await Promise.all([fetchProviderBookings(), fetchProviderStats()]);
    } catch (err) {
      console.error("Dashboard Refresh Error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
      }
    } finally {
      setBookingsLoading(false);
      setStatsLoading(false);
    }
  };

  // =========================================================
  // ACCEPT BOOKING
  // =========================================================

  const handleAcceptBooking = async (bookingId) => {
    try {
      setActionLoading(`accept-${bookingId}`);

      const response = await API.put(`/bookings/provider/${bookingId}/accept`);

      if (response.data?.success) {
        const updatedBooking = response.data?.booking;

        setBookings((previousBookings) =>
          previousBookings.map((booking) =>
            booking._id === bookingId
              ? updatedBooking || {
                  ...booking,
                  status: "accepted",
                }
              : booking,
          ),
        );

        await fetchProviderStats();
      }
    } catch (err) {
      console.error("Accept Booking Error:", err);

      alert(err.response?.data?.message || "Unable to accept booking.");
    } finally {
      setActionLoading("");
    }
  };

  // =========================================================
  // REJECT BOOKING
  // =========================================================

  const handleRejectBooking = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this booking?",
    );

    if (!confirmed) return;

    try {
      setActionLoading(`reject-${bookingId}`);

      const response = await API.put(`/bookings/provider/${bookingId}/reject`);

      if (response.data?.success) {
        const updatedBooking = response.data?.booking;

        setBookings((previousBookings) =>
          previousBookings.map((booking) =>
            booking._id === bookingId
              ? updatedBooking || {
                  ...booking,
                  status: "rejected",
                }
              : booking,
          ),
        );

        await fetchProviderStats();
      }
    } catch (err) {
      console.error("Reject Booking Error:", err);

      alert(err.response?.data?.message || "Unable to reject booking.");
    } finally {
      setActionLoading("");
    }
  };

  // =========================================================
  // UPDATE BOOKING STATUS
  // =========================================================

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      setActionLoading(`status-${bookingId}`);

      const response = await API.put(`/bookings/provider/${bookingId}/status`, {
        status: newStatus,
      });

      if (response.data?.success) {
        const updatedBooking = response.data?.booking;

        setBookings((previousBookings) =>
          previousBookings.map((booking) =>
            booking._id === bookingId
              ? updatedBooking || {
                  ...booking,
                  status: newStatus,
                }
              : booking,
          ),
        );

        await fetchProviderStats();

        if (newStatus === "completed") {
          const providerResponse = await API.get("/providers/my/profile");

          if (providerResponse.data?.success) {
            const providerData =
              providerResponse.data?.provider || providerResponse.data?.data;

            setProvider(providerData);

            localStorage.setItem("provider", JSON.stringify(providerData));

            await fetchProviderReviews(providerData?._id);
          }
        }
      }
    } catch (err) {
      console.error("Update Booking Status Error:", err);

      alert(err.response?.data?.message || "Unable to update booking status.");
    } finally {
      setActionLoading("");
    }
  };

  // =========================================================
  // AVAILABILITY
  // =========================================================

  const handleAvailabilityChange = async () => {
    if (!provider) return;

    const newAvailability = !provider.isAvailable;

    try {
      setActionLoading("availability");

      const response = await API.put("/providers/my/profile", {
        isAvailable: newAvailability,
      });

      if (response.data?.success) {
        const providerData = response.data?.provider || response.data?.data;

        setProvider(providerData);

        localStorage.setItem("provider", JSON.stringify(providerData));
      }
    } catch (err) {
      console.error("Availability Update Error:", err);

      alert(err.response?.data?.message || "Unable to update availability.");
    } finally {
      setActionLoading("");
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("provider");
    localStorage.removeItem("role");

    navigate("/login");
  };

  // =========================================================
  // STATUS HELPERS
  // =========================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "accepted":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "confirmed":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";

      case "in-progress":
        return "bg-purple-50 text-purple-700 border-purple-200";

      case "completed":
        return "bg-green-50 text-green-700 border-green-200";

      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";

      case "rejected":
        return "bg-slate-100 text-slate-700 border-slate-200";

      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Pending";

      case "accepted":
        return "Accepted";

      case "confirmed":
        return "Confirmed";

      case "in-progress":
        return "In Progress";

      case "completed":
        return "Completed";

      case "cancelled":
        return "Cancelled";

      case "rejected":
        return "Rejected";

      default:
        return status || "Unknown";
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (date) => {
    if (!date) return "N/A";

    try {
      return new Date(date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  // =========================================================
  // CUSTOMER NAME
  // =========================================================

  const getCustomerName = (booking) => {
    return (
      booking?.customer?.name ||
      booking?.customer?.fullName ||
      booking?.customer?.username ||
      "Customer"
    );
  };

  // =========================================================
  // SERVICE NAME
  // =========================================================

  const getServiceName = (booking) => {
    return booking?.service?.name || booking?.service?.title || "Service";
  };

  // =========================================================
  // PRICE
  // =========================================================

  const getBookingPrice = (booking) => {
    return Number(booking?.price || 0);
  };

  // =========================================================
  // TODAY'S BOOKINGS
  // =========================================================

  const today = new Date();

  const todayBookings = bookings.filter((booking) => {
    if (!booking?.bookingDate) return false;

    const bookingDate = new Date(booking.bookingDate);

    return (
      bookingDate.getDate() === today.getDate() &&
      bookingDate.getMonth() === today.getMonth() &&
      bookingDate.getFullYear() === today.getFullYear()
    );
  });

  // =========================================================
  // RECENT BOOKINGS
  // =========================================================

  const recentBookings = [...bookings]
    .sort(
      (a, b) =>
        new Date(b?.bookingDate || b?.createdAt) -
        new Date(a?.bookingDate || a?.createdAt),
    )
    .slice(0, 8);

  // =========================================================
  // RECENT REVIEWS
  // =========================================================

  const recentReviews = [...reviews]
    .sort((a, b) => new Date(b?.createdAt) - new Date(a?.createdAt))
    .slice(0, 5);

  // =========================================================
  // STAT CARDS
  // =========================================================

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.total,
      icon: CalendarDays,
      color: "blue",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock3,
      color: "amber",
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "green",
    },
    {
      title: "Total Earnings",
      value: `₹${Number(stats.totalEarnings || 0).toLocaleString("en-IN")}`,
      icon: Wallet,
      color: "purple",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  // =========================================================
  // SIDEBAR LINKS
  // =========================================================

  const sidebarLinks = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/provider/dashboard",
    },
    {
      label: "Bookings",
      icon: CalendarDays,
      path: "/provider/bookings",
    },
    {
      label: "Services",
      icon: BriefcaseBusiness,
      path: "/provider/services",
    },
    {
      label: "Earnings",
      icon: Wallet,
      path: "/provider/earnings",
    },
    {
      label: "Reviews",
      icon: Star,
      path: "/provider/reviews",
    },
    {
      label: "Notifications",
      icon: Bell,
      path: "/provider/notifications",
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/provider/settings",
    },
  ];

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto" />

          <p className="mt-5 text-slate-600 font-medium">
            Loading provider dashboard...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR SCREEN
  // =========================================================

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <XCircle size={28} />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Unable to load dashboard
          </h2>

          <p className="text-slate-500 mt-2">{error}</p>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // PROVIDER NOT FOUND
  // =========================================================

  if (!provider) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
          <User size={45} className="text-slate-400 mx-auto" />

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Provider profile not found
          </h2>

          <p className="text-slate-500 mt-2">
            Please complete your provider registration.
          </p>

          <Link
            to="/provider/register"
            className="inline-flex items-center gap-2 mt-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
          >
            Complete Registration
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          MOBILE HEADER
      ====================================================== */}

      <header className="lg:hidden sticky top-0 z-50 bg-slate-950 border-b border-slate-800 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3.5">
          <Link to="/provider/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <span className="text-xs font-black text-white">FN</span>
            </div>

            <div>
              <p className="text-lg font-black text-white leading-none">
                FIX
                <span className="text-blue-400">NEAR</span>
              </p>

              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                Provider
              </p>
            </div>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white flex items-center justify-center transition"
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 shadow-xl">
            <nav className="space-y-1.5">
              {sidebarLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    end={item.path === "/provider/dashboard"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isActive
                              ? "bg-white/15 text-white"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          <Icon size={16} />
                        </span>

                        {item.label}
                      </>
                    )}
                  </NavLink>
                );
              })}

              <NavLink
                to="/provider/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <User size={17} />
                </span>
                My Profile
              </NavLink>

              <div className="border-t border-slate-800 my-2" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 font-semibold text-sm transition"
              >
                <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <LogOut size={18} />
                </span>
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* =====================================================
          DESKTOP SIDEBAR
          DARK BACKGROUND + NO SCROLLER
      ====================================================== */}

      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-72 h-screen flex-col overflow-hidden bg-slate-950 text-white border-r border-slate-800 shadow-[8px_0_30px_rgba(15,23,42,0.18)]">
        {/* TOP ACCENT */}

        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

        {/* =================================================
            LOGO
        ================================================== */}

        <div className="px-5 pt-6 pb-4 shrink-0">
          <Link
            to="/provider/dashboard"
            className="flex items-center gap-3 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <span className="text-sm font-black text-white">FN</span>
            </div>

            <div>
              <p className="text-xl font-black text-white leading-none">
                FIX
                <span className="text-blue-400">NEAR</span>
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 mt-1">
                Provider Workspace
              </p>
            </div>
          </Link>
        </div>

        {/* =================================================
            PROVIDER MINI PROFILE
        ================================================== */}

        <div className="px-4 pb-4 shrink-0">
          <Link
            to="/provider/profile"
            className="group block rounded-2xl border border-slate-800 bg-slate-900/80 p-3 hover:border-blue-500/50 hover:bg-slate-900 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {provider.profileImage ? (
                  <img
                    src={provider.profileImage}
                    alt={provider.businessName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BriefcaseBusiness size={19} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-white truncate">
                  {provider.businessName}
                </p>

                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {provider.city || "Provider"}
                </p>
              </div>

              <ChevronRight
                size={16}
                className="text-slate-600 group-hover:text-blue-400 transition shrink-0"
              />
            </div>

            <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    provider.isAvailable ? "bg-green-400" : "bg-red-400"
                  }`}
                />

                <span className="text-[10px] font-semibold text-slate-400">
                  {provider.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>

              <span className="text-[10px] font-semibold text-slate-500">
                View Profile
              </span>
            </div>
          </Link>
        </div>

        {/* =================================================
            WORKSPACE LABEL
        ================================================== */}

        <div className="px-5 mb-1 shrink-0">
          <p className="px-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
            Workspace
          </p>
        </div>

        {/* =================================================
            NAVIGATION
            NO SCROLLER
        ================================================== */}

        <nav className="flex-1 min-h-0 overflow-hidden px-4">
          <div className="space-y-1">
            {sidebarLinks.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={item.path === "/provider/dashboard"}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 h-10 px-3.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-200" />
                      )}

                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-slate-900 text-slate-400 group-hover:bg-slate-700 group-hover:text-blue-400"
                        }`}
                      >
                        <Icon size={17} />
                      </span>

                      <span className="font-semibold text-sm flex-1">
                        {item.label}
                      </span>

                      {isActive && (
                        <ChevronRight size={15} className="text-white/80" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* DIVIDER */}

          <div className="my-3 border-t border-slate-800" />

          {/* ACCOUNT */}

          <p className="px-2 mb-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
            Account
          </p>

          <NavLink
            to="/provider/profile"
            className={({ isActive }) =>
              `group flex items-center gap-3 h-10 px-3.5 rounded-xl transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "bg-slate-900 text-slate-400 group-hover:text-blue-400"
                  }`}
                >
                  <User size={17} />
                </span>

                <span className="font-semibold text-sm flex-1">My Profile</span>

                <ChevronRight
                  size={15}
                  className={isActive ? "text-white/80" : "text-slate-600"}
                />
              </>
            )}
          </NavLink>
        </nav>

        {/* =================================================
            BOTTOM AREA
        ================================================== */}

        <div className="shrink-0 px-4 pb-4 pt-3">
          {/* STATUS CARD */}

          <div className="mb-2.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    provider.isAvailable ? "bg-green-400" : "bg-red-400"
                  }`}
                />

                <span className="text-[11px] font-semibold text-slate-300">
                  {provider.isAvailable
                    ? "Receiving bookings"
                    : "Bookings paused"}
                </span>
              </div>

              <span
                className={`text-[9px] font-bold uppercase ${
                  provider.isAvailable ? "text-green-400" : "text-red-400"
                }`}
              >
                {provider.isAvailable ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          {/* LOGOUT */}

          <button
            onClick={handleLogout}
            className="w-full h-10 flex items-center gap-3 px-3.5 rounded-xl text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition"
          >
            <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <LogOut size={17} />
            </span>

            <span className="font-semibold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="lg:ml-72 min-h-screen">
        {/* DESKTOP TOPBAR */}

        <header className="hidden lg:flex sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-8 py-5 items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Provider Dashboard</p>

            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {provider.businessName}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={refreshDashboard}
              className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"
              title="Refresh dashboard"
            >
              <RefreshCw
                size={20}
                className={
                  bookingsLoading || statsLoading ? "animate-spin" : ""
                }
              />
            </button>

            <Link
              to="/provider/notifications"
              className="relative w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              <Bell size={20} />
            </Link>

            <Link to="/provider/profile" className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center overflow-hidden">
                {provider.profileImage ? (
                  <img
                    src={provider.profileImage}
                    alt={provider.businessName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={21} />
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {provider.businessName}
                </p>

                <p className="text-xs text-slate-500">Provider</p>
              </div>
            </Link>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* =================================================
              WELCOME BANNER
          ================================================== */}

          <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white overflow-hidden relative">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 text-xs font-semibold">
                <span
                  className={`w-2 h-2 rounded-full ${
                    provider.isAvailable ? "bg-green-400" : "bg-red-400"
                  }`}
                />

                {provider.isAvailable
                  ? "You are available"
                  : "You are unavailable"}
              </div>

              <h2 className="text-3xl sm:text-4xl font-black mt-5">
                Manage your business
                <span className="text-blue-400"> smarter.</span>
              </h2>

              <p className="text-slate-400 mt-3 max-w-2xl">
                Track your bookings, manage customers, monitor earnings and grow
                your service business with FIXNEAR.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  to="/provider/bookings"
                  className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-5 py-3 rounded-xl font-bold transition"
                >
                  <CalendarDays size={18} />
                  View Bookings
                </Link>

                <Link
                  to="/provider/services"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 px-5 py-3 rounded-xl font-bold transition"
                >
                  <BriefcaseBusiness size={18} />
                  Manage Services
                </Link>

                <Link
                  to="/provider/reviews"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 px-5 py-3 rounded-xl font-bold transition"
                >
                  <Star size={18} />
                  View Reviews
                </Link>
              </div>
            </div>

            <div className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2 opacity-10">
              <TrendingUp size={190} />
            </div>
          </section>

          {/* =================================================
              STATISTICS
          ================================================== */}

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClasses[stat.color]}`}
                    >
                      <Icon size={21} />
                    </div>

                    {statsLoading && (
                      <Loader2
                        size={17}
                        className="animate-spin text-slate-300"
                      />
                    )}
                  </div>

                  <p className="text-sm text-slate-500 mt-5">{stat.title}</p>

                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </section>

          {/* =================================================
              AVAILABILITY + RATING
          ================================================== */}

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      provider.isAvailable
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    <Power size={22} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900 text-lg">
                      Availability
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Control whether customers can book your services.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleAvailabilityChange}
                  disabled={actionLoading === "availability"}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition ${
                    provider.isAvailable
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  } disabled:opacity-60`}
                >
                  {actionLoading === "availability" ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Power size={18} />
                  )}

                  {provider.isAvailable ? "Available" : "Make Available"}
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Star size={23} fill="currentColor" />
                </div>

                <div>
                  <p className="text-sm text-slate-500">Your Rating</p>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-black text-slate-900">
                      {Number(provider.rating || 0).toFixed(1)}
                    </span>

                    <span className="text-sm text-slate-400">/ 5</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 mt-5 pt-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Reviews</p>

                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {provider.totalReviews || 0}
                  </p>
                </div>

                <Link
                  to="/provider/reviews"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>
            </div>
          </section>

          {/* =================================================
              BOOKING OVERVIEW
          ================================================== */}

          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm text-slate-500">Accepted</p>

              <p className="text-2xl font-black text-blue-600 mt-1">
                {stats.accepted}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm text-slate-500">Confirmed</p>

              <p className="text-2xl font-black text-indigo-600 mt-1">
                {stats.confirmed}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm text-slate-500">In Progress</p>

              <p className="text-2xl font-black text-purple-600 mt-1">
                {stats.inProgress}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm text-slate-500">Today</p>

              <p className="text-2xl font-black text-green-600 mt-1">
                {todayBookings.length}
              </p>
            </div>
          </section>

          {/* =================================================
              RECENT BOOKINGS
          ================================================== */}

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm mt-6 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recent Bookings
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Manage your latest customer requests.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={refreshDashboard}
                  disabled={bookingsLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm"
                >
                  <RefreshCw
                    size={16}
                    className={bookingsLoading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

                <Link
                  to="/provider/bookings"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-sm"
                >
                  View All
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            {bookingsError && (
              <div className="mx-6 mt-5 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                {bookingsError}
              </div>
            )}

            {bookingsLoading ? (
              <div className="p-10 text-center">
                <Loader2
                  size={30}
                  className="animate-spin text-blue-600 mx-auto"
                />

                <p className="text-sm text-slate-500 mt-3">
                  Loading bookings...
                </p>
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                  <CalendarDays size={26} className="text-slate-400" />
                </div>

                <h3 className="font-bold text-slate-900 mt-4">
                  No bookings yet
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  New customer bookings will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Customer
                      </th>

                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Service
                      </th>

                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Date
                      </th>

                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Status
                      </th>

                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentBookings.map((booking) => (
                      <tr
                        key={booking._id}
                        className="hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-5">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {getCustomerName(booking)}
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              {booking.customer?.phone ||
                                booking.customer?.email ||
                                "No contact"}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-medium text-slate-900">
                            {getServiceName(booking)}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm text-slate-700">
                            {formatDate(booking.bookingDate)}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            {formatTime(booking.bookingDate)}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-900">
                            ₹{getBookingPrice(booking).toLocaleString("en-IN")}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusClass(
                              booking.status,
                            )}`}
                          >
                            {getStatusLabel(booking.status)}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/provider/bookings/${booking._id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                            >
                              <Eye size={14} />
                              View
                            </Link>

                            {booking.status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleAcceptBooking(booking._id)
                                  }
                                  disabled={
                                    actionLoading === `accept-${booking._id}`
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-60"
                                >
                                  {actionLoading === `accept-${booking._id}` ? (
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Check size={14} />
                                  )}
                                  Accept
                                </button>

                                <button
                                  onClick={() =>
                                    handleRejectBooking(booking._id)
                                  }
                                  disabled={
                                    actionLoading === `reject-${booking._id}`
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold disabled:opacity-60"
                                >
                                  {actionLoading === `reject-${booking._id}` ? (
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Ban size={14} />
                                  )}
                                  Reject
                                </button>
                              </>
                            )}

                            {booking.status === "accepted" && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(booking._id, "confirmed")
                                }
                                disabled={
                                  actionLoading === `status-${booking._id}`
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-60"
                              >
                                {actionLoading === `status-${booking._id}` ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={14} />
                                )}
                                Confirm
                              </button>
                            )}

                            {booking.status === "confirmed" && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(booking._id, "in-progress")
                                }
                                disabled={
                                  actionLoading === `status-${booking._id}`
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-60"
                              >
                                {actionLoading === `status-${booking._id}` ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <PlayCircle size={14} />
                                )}
                                Start
                              </button>
                            )}

                            {booking.status === "in-progress" && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(booking._id, "completed")
                                }
                                disabled={
                                  actionLoading === `status-${booking._id}`
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-60"
                              >
                                {actionLoading === `status-${booking._id}` ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={14} />
                                )}
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* =================================================
              REVIEWS + PERFORMANCE
          ================================================== */}

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Recent Reviews
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    See what customers are saying about your service.
                  </p>
                </div>

                <Link
                  to="/provider/reviews"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View All
                </Link>
              </div>

              {reviewsLoading ? (
                <div className="p-10 text-center">
                  <Loader2
                    size={28}
                    className="animate-spin text-blue-600 mx-auto"
                  />

                  <p className="text-sm text-slate-500 mt-3">
                    Loading reviews...
                  </p>
                </div>
              ) : reviewsError ? (
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                    {reviewsError}
                  </div>
                </div>
              ) : recentReviews.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
                    <Star size={25} fill="currentColor" />
                  </div>

                  <h3 className="font-bold text-slate-900 mt-4">
                    No reviews yet
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Customer reviews will appear here after completed services.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentReviews.map((review) => (
                    <div key={review._id} className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <User size={18} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {review.customer?.name ||
                                review.customer?.fullName ||
                                "Customer"}
                            </p>

                            <p className="text-xs text-slate-400 mt-1">
                              {formatDate(review.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {Array.from({
                            length: 5,
                          }).map((_, index) => (
                            <Star
                              key={index}
                              size={15}
                              className={
                                index < Number(review.rating || 0)
                                  ? "text-amber-400"
                                  : "text-slate-200"
                              }
                              fill={
                                index < Number(review.rating || 0)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          ))}
                        </div>
                      </div>

                      {review.comment && (
                        <div className="flex gap-3 mt-4">
                          <MessageSquare
                            size={17}
                            className="text-slate-300 shrink-0 mt-0.5"
                          />

                          <p className="text-sm text-slate-600 leading-6">
                            {review.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PERFORMANCE */}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Performance</h2>

              <p className="text-sm text-slate-500 mt-1">
                Your current service performance.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Completed Services</p>

                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {provider.completedBookings ?? stats.completed ?? 0}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Reviews</p>

                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {provider.totalReviews || 0}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Rating</p>

                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {Number(provider.rating || 0).toFixed(1)}
                    <span className="text-sm text-slate-400"> / 5</span>
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Rejected</p>

                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {stats.rejected}
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-blue-600 mt-0.5" />

                  <p className="text-sm text-blue-800">
                    Keep your profile and services updated to provide customers
                    with accurate information.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              BUSINESS INFORMATION
          ================================================== */}

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* BUSINESS */}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Business Information
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Your provider profile information.
                  </p>
                </div>

                <Link
                  to="/provider/profile"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Edit
                </Link>
              </div>

              <div className="space-y-5 mt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <BriefcaseBusiness size={18} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Business Name</p>

                    <p className="font-semibold text-slate-900 mt-1">
                      {provider.businessName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Location</p>

                    <p className="font-semibold text-slate-900 mt-1">
                      {provider.address || "Address not added"}

                      {provider.city ? `, ${provider.city}` : ""}

                      {provider.state ? `, ${provider.state}` : ""}

                      {provider.pincode ? ` - ${provider.pincode}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Phone</p>

                    <p className="font-semibold text-slate-900 mt-1">
                      {provider.phone || "Phone not added"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK LINKS */}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Provider Management
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Quickly manage your provider account.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <Link
                  to="/provider/profile"
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-blue-600" />

                    <span className="font-semibold text-slate-700">
                      My Profile
                    </span>
                  </div>

                  <ChevronRight size={17} className="text-slate-400" />
                </Link>

                <Link
                  to="/provider/services"
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <BriefcaseBusiness size={18} className="text-blue-600" />

                    <span className="font-semibold text-slate-700">
                      My Services
                    </span>
                  </div>

                  <ChevronRight size={17} className="text-slate-400" />
                </Link>

                <Link
                  to="/provider/bookings"
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays size={18} className="text-blue-600" />

                    <span className="font-semibold text-slate-700">
                      My Bookings
                    </span>
                  </div>

                  <ChevronRight size={17} className="text-slate-400" />
                </Link>

                <Link
                  to="/provider/settings"
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Settings size={18} className="text-blue-600" />

                    <span className="font-semibold text-slate-700">
                      Settings
                    </span>
                  </div>

                  <ChevronRight size={17} className="text-slate-400" />
                </Link>
                <Link
                  to="/provider/help"
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition"
                >
                  <div className="flex items-center gap-3">
                    
                    <MessageCircleMore size={16} strokeWidth={2.25} className="text-blue-600" />

                    <span className="font-semibold text-slate-700">
                      Help & Support
                    </span>
                  </div>

                  <ChevronRight size={17} className="text-slate-400" />
                </Link>
              </div>
            </div>
          </section>

          {/* =================================================
              FOOTER
          ================================================== */}

          <footer className="py-8 text-center">
            <p className="text-sm text-slate-400">FIXNEAR Provider Dashboard</p>

            <p className="text-xs text-slate-400 mt-1">
              Manage your services. Serve your customers. Grow your business.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default ProviderDashboard;
