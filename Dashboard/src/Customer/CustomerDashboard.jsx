import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

import {
  LayoutDashboard,
  CalendarDays,
  Heart,
  Bell,
  User,
  Search,
  Settings,
  LogOut,
  X,
  Clock3,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  ArrowRight,
  MapPin,
  LocateFixed,
  Wrench,
  MessageSquareWarning,
  CreditCard,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import CustomerNavbar from "./CustomerNavbar";

const CustomerDashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // HELPERS
  // =========================================================

  const normalizeStatus = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

  const isOnlineBooking = (booking) =>
    normalizeStatus(booking?.paymentMethod) === "online";

  const isPaymentSuccessful = (booking) =>
    normalizeStatus(booking?.paymentStatus) === "paid";

  const isCancelledOrRejected = (booking) =>
    ["cancelled", "rejected"].includes(normalizeStatus(booking?.status));

  /*
   * Successful booking counting rules:
   *
   * Online booking:
   *   - Payment must be verified as paid.
   *   - Booking must not be cancelled or rejected.
   *   - pending_payment is not counted.
   *
   * Cash booking:
   *   - Count it unless it was cancelled or rejected.
   *
   * This only affects dashboard counts. It does not delete
   * or modify database records.
   */
  const isSuccessfulBooking = (booking) => {
    if (!booking || isCancelledOrRejected(booking)) {
      return false;
    }

    if (normalizeStatus(booking.status) === "pending_payment") {
      return false;
    }

    if (isOnlineBooking(booking)) {
      return isPaymentSuccessful(booking);
    }

    return true;
  };

  // =========================================================
  // PAYMENT / ORDER MESSAGE
  // =========================================================

  const getPaymentMessage = (booking) => {
    const status = normalizeStatus(booking?.status);
    const online = isOnlineBooking(booking);
    const paid = isPaymentSuccessful(booking);

    // Cancelled or rejected bookings
    if (isCancelledOrRejected(booking)) {
      if (online && !paid) {
        return {
          title: "Payment Not Completed — Order Not Placed",
          description:
            "The online payment was not verified. This booking is cancelled or rejected.",
          className: "bg-red-50 border-red-200 text-red-800",
          icon: AlertCircle,
        };
      }

      if (online && paid) {
        return {
          title: "Payment Received — Booking Cancelled",
          description:
            "The payment was received, but this booking was cancelled. Contact support if you need refund assistance.",
          className: "bg-orange-50 border-orange-200 text-orange-800",
          icon: AlertCircle,
        };
      }

      return {
        title: "Booking Cancelled — Order Not Active",
        description: "This booking was cancelled or rejected.",
        className: "bg-red-50 border-red-200 text-red-800",
        icon: XCircle,
      };
    }

    // COMPLETED BOOKING - CHECK BEFORE PAYMENT SUCCESS
    if (status === "completed") {
      return {
        title: "Order Completed",
        description:
          "Your service has been successfully completed. Thank you for choosing FIXNEAR!",
        className: "bg-green-50 border-green-200 text-green-800",
        icon: CheckCircle2,
      };
    }

    // Successful online payment
    if (online && paid) {
      return {
        title: "Order Placed Successfully",
        description:
          "Your online payment is verified by FIXNEAR. Your booking has been recorded successfully.",
        className: "bg-green-50 border-green-200 text-green-800",
        icon: CheckCircle2,
      };
    }

    // Online payment not completed
    if (online) {
      const paymentStatus = normalizeStatus(booking?.paymentStatus);

      return {
        title: "Payment Not Completed — Order Not Placed",
        description:
          paymentStatus === "failed"
            ? "The online payment failed. This booking is not counted as a successful order."
            : "The online payment was cancelled or has not been verified.",
        className: "bg-red-50 border-red-200 text-red-800",
        icon: AlertCircle,
      };
    }

    // Pending payment
    if (status === "pending_payment") {
      return {
        title: "Payment Required — Order Not Placed",
        description:
          "Payment is still required before this booking can be treated as a successful order.",
        className: "bg-orange-50 border-orange-200 text-orange-800",
        icon: CreditCard,
      };
    }

    // Cash booking
    return {
      title: "Booking Placed Successfully",
      description:
        "Your cash-payment booking has been recorded. Payment may still be due after the service.",
      className: "bg-green-50 border-green-200 text-green-800",
      icon: CheckCircle2,
    };
  };

  // =========================================================
  // FETCH BOOKINGS
  // =========================================================

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await API.get("/bookings/my");
      const data = response.data;

      console.log("Bookings API Response:", data);

      let fetchedBookings = [];

      if (Array.isArray(data)) {
        fetchedBookings = data;
      } else if (Array.isArray(data?.bookings)) {
        fetchedBookings = data.bookings;
      } else if (Array.isArray(data?.data)) {
        fetchedBookings = data.data;
      } else if (Array.isArray(data?.data?.bookings)) {
        fetchedBookings = data.data.bookings;
      }

      setBookings(fetchedBookings);
    } catch (err) {
      console.error("Dashboard Booking Error:", err);

      const status = err?.response?.status;
      const backendMessage = err?.response?.data?.message;

      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate("/login");
        return;
      }

      if (status === 403) {
        setError(
          "Your account does not have customer permission to access bookings.",
        );
        return;
      }

      setError(backendMessage || "Unable to load your bookings.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // =========================================================
  // LOAD USER AND BOOKINGS
  // =========================================================

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("User data error:", err);
      }
    }

    fetchBookings();
  }, [fetchBookings]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    navigate("/login");
  };

  // =========================================================
  // DASHBOARD STATISTICS
  // =========================================================

  const successfulBookings = bookings.filter(isSuccessfulBooking);

  const totalBookings = successfulBookings.length;

  const pendingBookings = successfulBookings.filter(
    (booking) => normalizeStatus(booking.status) === "pending",
  ).length;

  const acceptedBookings = successfulBookings.filter((booking) =>
    ["accepted", "confirmed", "in_progress"].includes(
      normalizeStatus(booking.status),
    ),
  ).length;

  const completedBookings = successfulBookings.filter(
    (booking) => normalizeStatus(booking.status) === "completed",
  ).length;

  /*
   * IMPORTANT:
   * Recent Bookings contains ALL records, including unpaid
   * online payment attempts, cancelled payments, cancelled
   * bookings, and successful bookings.
   *
   * These records are not counted as successful orders unless
   * they satisfy isSuccessfulBooking().
   */
  const recentBookings = [...bookings].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.bookingDate || 0).getTime();

    const dateB = new Date(b.createdAt || b.bookingDate || 0).getTime();

    return dateB - dateA;
  });

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusStyle = (status) => {
    switch (normalizeStatus(status)) {
      case "pending":
        return {
          wrapper: "bg-yellow-50 text-yellow-700",
          icon: Clock3,
          label: "Pending",
        };

      case "pending_payment":
        return {
          wrapper: "bg-orange-50 text-orange-700",
          icon: CreditCard,
          label: "Payment Required",
        };

      case "accepted":
        return {
          wrapper: "bg-blue-50 text-blue-700",
          icon: CheckCircle2,
          label: "Accepted",
        };

      case "confirmed":
        return {
          wrapper: "bg-blue-50 text-blue-700",
          icon: CheckCircle2,
          label: "Confirmed",
        };

      case "completed":
        return {
          wrapper: "bg-green-50 text-green-700",
          icon: CheckCircle2,
          label: "Completed",
        };

      case "rejected":
        return {
          wrapper: "bg-red-50 text-red-700",
          icon: XCircle,
          label: "Rejected",
        };

      case "cancelled":
        return {
          wrapper: "bg-red-50 text-red-700",
          icon: XCircle,
          label: "Cancelled",
        };

      case "in_progress":
        return {
          wrapper: "bg-purple-50 text-purple-700",
          icon: LoaderCircle,
          label: "In Progress",
        };

      default:
        return {
          wrapper: "bg-slate-100 text-slate-600",
          icon: Clock3,
          label: String(status || "Unknown").replace(/_/g, " "),
        };
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "Date not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // SIDEBAR NAVIGATION
  // =========================================================

  const navigationItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/customer/dashboard",
    },
    {
      name: "Find Services",
      icon: Search,
      path: "/services",
    },
    {
      name: "Nearby Services",
      icon: LocateFixed,
      path: "/nearby-services",
    },
    {
      name: "My Bookings",
      icon: CalendarDays,
      path: "/my-bookings",
    },
    {
      name: "Favorites",
      icon: Heart,
      path: "/favorites",
    },
    {
      name: "Notifications",
      icon: Bell,
      path: "/notifications",
    },
    {
      name: "Complaints",
      icon: MessageSquareWarning,
      path: "/complaints",
    },
    {
      name: "My Profile",
      icon: User,
      path: "/profile",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  // =========================================================
  // BOOKING ROW
  // =========================================================

  const renderBooking = (booking) => {
    const status = getStatusStyle(booking.status);
    const StatusIcon = status.icon;

    const paymentMessage = getPaymentMessage(booking);
    const PaymentIcon = paymentMessage.icon;

    const serviceName =
      booking.service?.name ||
      booking.service?.title ||
      booking.providerService?.name ||
      "Service Booking";

    return (
      <article
        key={booking._id}
        className="px-5 sm:px-6 py-5 hover:bg-slate-50 transition"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900 wrap-break-words">
                {serviceName}
              </h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                  {formatDate(booking.bookingDate)}
                </span>

                {booking.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {booking.city}
                  </span>
                )}

                {booking.paymentMethod && (
                  <span className="flex items-center gap-1 capitalize">
                    <CreditCard className="w-3.5 h-3.5 shrink-0" />
                    {normalizeStatus(booking.paymentMethod).replace(
                      /_/g,
                      " ",
                    )}{" "}
                    payment
                  </span>
                )}
              </div>

              {/* Payment / order result note */}

              <div
                className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs sm:text-sm ${paymentMessage.className}`}
              >
                <PaymentIcon className="w-4 h-4 mt-0.5 shrink-0" />

                <div>
                  <p className="font-semibold">{paymentMessage.title}</p>
                  <p className="mt-1 leading-relaxed">
                    {paymentMessage.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end lg:pt-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${status.wrapper}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {status.label}
            </span>

            <Link
              to={`/booking-details/${booking._id}`}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
            >
              View Details
            </Link>
          </div>
        </div>
      </article>
    );
  };

  // =========================================================
  // DASHBOARD UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-100">
      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64
          bg-white border-r border-slate-200
          transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>

            <div>
              <p className="font-bold text-slate-900">FIXNEAR</p>
              <p className="text-xs text-slate-500">Customer Panel</p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close sidebar"
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          <p className="px-3 pt-2 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={closeSidebar}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl
                  text-sm font-medium transition
                  ${
                    item.name === "Dashboard"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <div className="lg:ml-64">
        <CustomerNavbar />

        <main className="p-4 sm:p-6 lg:p-8">
          {/* WELCOME */}

          <div className="mb-8 mt-16">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Welcome back, {user?.name || "Customer"} 👋
            </h1>

            <p className="text-slate-500 mt-2">
              Here&apos;s what&apos;s happening with your bookings today.
            </p>
          </div>

          {/* FIND SERVICES BANNER */}

          <div className="mb-8 bg-linear-to-r from-blue-700 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Need a service?
                </p>

                <h2 className="text-2xl sm:text-3xl font-bold mt-1">
                  Find a trusted professional near you
                </h2>

                <p className="text-blue-100 mt-2 max-w-xl">
                  Browse available services and book a professional for your
                  home or business.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition"
                >
                  Find Services
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  to="/nearby-services"
                  className="inline-flex items-center justify-center gap-2 bg-blue-800 text-white border border-blue-400 px-6 py-3 rounded-xl font-semibold hover:bg-blue-900 transition"
                >
                  <LocateFixed className="w-5 h-5" />
                  Nearby Services
                </Link>
              </div>
            </div>
          </div>

          {/* STATISTICS */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {/* TOTAL BOOKINGS */}

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Bookings</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {loading ? "—" : totalBookings}
                  </p>
                </div>

                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-4">
                Successful orders and valid cash bookings
              </p>
            </div>

            {/* PENDING */}

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {loading ? "—" : pendingBookings}
                  </p>
                </div>

                <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <Clock3 className="w-6 h-6 text-yellow-600" />
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-4">
                Waiting for provider response
              </p>
            </div>

            {/* ACTIVE */}

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {loading ? "—" : acceptedBookings}
                  </p>
                </div>

                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <LoaderCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-4">
                Accepted or confirmed bookings
              </p>
            </div>

            {/* COMPLETED */}

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Completed</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {loading ? "—" : completedBookings}
                  </p>
                </div>

                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-4">
                Successfully completed services
              </p>
            </div>
          </div>

          {/* RECENT BOOKINGS - ALL RECORDS, WITH VISIBLE SCROLLBAR */}

          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 sm:px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Recent Bookings
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Successful orders and incomplete payment attempts
                </p>

                {!loading && (
                  <p className="text-xs text-slate-400 mt-1">
                    {recentBookings.length} record
                    {recentBookings.length === 1 ? "" : "s"} · Scroll to see
                    older bookings
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchBookings}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>

                <Link
                  to="/my-bookings"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
                >
                  View All
                </Link>
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div className="px-5 sm:px-6 py-5">
                <div className="rounded-xl bg-red-50 border border-red-200 p-5">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />

                    <div>
                      <h3 className="font-semibold text-red-800">
                        Unable to load bookings
                      </h3>

                      <p className="text-sm text-red-600 mt-1">{error}</p>

                      {error.includes("customer permission") && (
                        <p className="text-xs text-red-500 mt-3">
                          Please make sure the logged-in account has the{" "}
                          <strong>customer</strong> role.
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={fetchBookings}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LOADING */}

            {loading && !error && (
              <div className="px-6 py-12 text-center">
                <LoaderCircle className="w-7 h-7 text-blue-600 animate-spin mx-auto" />

                <p className="text-sm text-slate-500 mt-3">
                  Loading your bookings...
                </p>
              </div>
            )}

            {/* EMPTY */}

            {!loading && !error && recentBookings.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                  <CalendarDays className="w-8 h-8 text-slate-400" />
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mt-4">
                  No bookings yet
                </h3>

                <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
                  Your bookings will appear here. If you cancel an online
                  payment, the record can still appear here with a clear message
                  that the order was not successfully placed.
                </p>

                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Find a Service
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* SCROLLABLE BOOKING LIST */}

            {!loading && !error && recentBookings.length > 0 && (
              <div
                className="max-h-140 overflow-y-scroll divide-y divide-slate-100"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#2563eb #e2e8f0",
                  overscrollBehavior: "contain",
                }}
              >
                {recentBookings.map(renderBooking)}
              </div>
            )}

            {/* FOOTER HINT */}

            {!loading && !error && recentBookings.length > 0 && (
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                Scroll inside this list to view more bookings
              </div>
            )}
          </section>

          {/* QUICK LINKS */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mt-8">
            <Link
              to="/profile"
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">My Profile</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Manage your account
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/favorites"
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">Favorites</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Your saved providers
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/services"
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition"
            >
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                <Search className="w-5 h-5 text-green-600" />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">Find a Service</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Book a professional
                </p>
              </div>
            </Link>

            <Link
              to="/nearby-services"
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                <LocateFixed className="w-5 h-5 text-indigo-600" />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Nearby Services
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Find professionals close to you
                </p>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerDashboard;
