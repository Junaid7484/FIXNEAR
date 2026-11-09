import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  X,
  Loader2,
  RefreshCw,
  Clock3,
  CheckCircle2,
  XCircle,
  PlayCircle,
  User,
  Phone,
  IndianRupee,
  Search,
  Filter,
  MapPin,
  FileText,
} from "lucide-react";
import API from "../services/api";

function ProviderBookings() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // =========================================================
  // FETCH PROVIDER BOOKINGS
  // GET /api/bookings/provider/my
  // =========================================================
  const fetchBookings = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await API.get("/bookings/provider/my");

      console.log("Provider Bookings:", response.data);

      if (response.data?.success) {
        setBookings(response.data.bookings || []);
      } else {
        setBookings([]);
        setError(response.data?.message || "Unable to load bookings.");
      }
    } catch (err) {
      console.error("Provider Bookings Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("provider");
        localStorage.removeItem("role");

        navigate("/login");
        return;
      }

      if (err.response?.status === 403) {
        setError(
          err.response?.data?.message ||
            "You do not have permission to view provider bookings.",
        );
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load bookings. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // =========================================================
  // ACCEPT BOOKING
  // PUT /api/bookings/provider/:id/accept
  // =========================================================
  const handleAccept = async (bookingId) => {
    try {
      setActionLoading(`accept-${bookingId}`);
      setError("");

      const response = await API.put(`/bookings/provider/${bookingId}/accept`);

      console.log("Accept Response:", response.data);

      if (response.data?.success) {
        await fetchBookings(true);
      } else {
        alert(response.data?.message || "Unable to accept booking.");
      }
    } catch (err) {
      console.error("Accept Error:", err);

      alert(err.response?.data?.message || "Unable to accept booking.");
    } finally {
      setActionLoading("");
    }
  };

  // =========================================================
  // REJECT BOOKING
  // PUT /api/bookings/provider/:id/reject
  // =========================================================
  const handleReject = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this booking?",
    );

    if (!confirmed) return;

    try {
      setActionLoading(`reject-${bookingId}`);
      setError("");

      const response = await API.put(`/bookings/provider/${bookingId}/reject`);

      console.log("Reject Response:", response.data);

      if (response.data?.success) {
        await fetchBookings(true);
      } else {
        alert(response.data?.message || "Unable to reject booking.");
      }
    } catch (err) {
      console.error("Reject Error:", err);

      alert(err.response?.data?.message || "Unable to reject booking.");
    } finally {
      setActionLoading("");
    }
  };

  // =========================================================
  // UPDATE BOOKING STATUS
  // PUT /api/bookings/provider/:id/status
  // =========================================================
  const handleStatusUpdate = async (bookingId, status) => {
    try {
      setActionLoading(`status-${bookingId}`);
      setError("");

      const response = await API.put(`/bookings/provider/${bookingId}/status`, {
        status,
      });

      console.log("Status Update Response:", response.data);

      if (response.data?.success) {
        await fetchBookings(true);
      } else {
        alert(response.data?.message || "Unable to update booking status.");
      }
    } catch (err) {
      console.error("Status Update Error:", err);

      alert(err.response?.data?.message || "Unable to update booking status.");
    } finally {
      setActionLoading("");
    }
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
        return "bg-slate-100 text-slate-600 border-slate-200";

      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
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
        return "Unknown";
    }
  };

  // =========================================================
  // DATE FORMAT
  // =========================================================
  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // TIME FORMAT
  // =========================================================
  const formatTime = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // CUSTOMER NAME
  // =========================================================
  const getCustomerName = (booking) => {
    return (
      booking?.customer?.name ||
      booking?.customer?.fullName ||
      booking?.customer?.username ||
      booking?.customer?.email ||
      "Customer"
    );
  };

  // =========================================================
  // CUSTOMER PHONE
  // =========================================================
  const getCustomerPhone = (booking) => {
    return (
      booking?.customer?.phone ||
      booking?.customer?.mobile ||
      booking?.customer?.phoneNumber ||
      "Not available"
    );
  };

  // =========================================================
  // SERVICE NAME
  // =========================================================
  const getServiceName = (booking) => {
    return (
      booking?.service?.name ||
      booking?.service?.title ||
      booking?.service?.serviceName ||
      "Service Booking"
    );
  };

  // =========================================================
  // FILTER + SEARCH + SORT
  // =========================================================
  const filteredBookings = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return [...bookings]
      .filter((booking) => {
        if (statusFilter !== "all" && booking?.status !== statusFilter) {
          return false;
        }

        if (!searchText) {
          return true;
        }

        const customerName = getCustomerName(booking).toLowerCase();

        const customerPhone = getCustomerPhone(booking).toLowerCase();

        const serviceName = getServiceName(booking).toLowerCase();

        const city = booking?.city?.toLowerCase() || "";

        const state = booking?.state?.toLowerCase() || "";

        const bookingId = booking?._id?.toLowerCase() || "";

        return (
          customerName.includes(searchText) ||
          customerPhone.includes(searchText) ||
          serviceName.includes(searchText) ||
          city.includes(searchText) ||
          state.includes(searchText) ||
          bookingId.includes(searchText)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a?.bookingDate).getTime();

        const dateB = new Date(b?.bookingDate).getTime();

        return dateA - dateB;
      });
  }, [bookings, search, statusFilter]);

  // =========================================================
  // STATISTICS
  // =========================================================
  const pendingCount = bookings.filter(
    (booking) => booking?.status === "pending",
  ).length;

  const acceptedCount = bookings.filter(
    (booking) =>
      booking?.status === "accepted" ||
      booking?.status === "confirmed" ||
      booking?.status === "in-progress",
  ).length;

  const completedCount = bookings.filter(
    (booking) => booking?.status === "completed",
  ).length;

  const cancelledCount = bookings.filter(
    (booking) =>
      booking?.status === "cancelled" || booking?.status === "rejected",
  ).length;

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={42} className="animate-spin text-blue-600 mx-auto" />

          <p className="mt-4 text-slate-500">Loading bookings...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================
  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-4">
              <Link
                to="/provider/dashboard"
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <ArrowLeft size={19} />
              </Link>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  My Bookings
                </h1>

                <p className="text-xs sm:text-sm text-slate-500">
                  Manage customer bookings
                </p>
              </div>
            </div>

            {/* REFRESH */}
            <button
              onClick={() => fetchBookings(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ERROR */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            {error}
          </div>
        )}

        {/* ===================================================
            STATISTICS
        ==================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* PENDING */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock3 size={20} />
            </div>

            <p className="text-sm text-slate-500 mt-4">Pending</p>

            <p className="text-2xl font-black text-slate-900 mt-1">
              {pendingCount}
            </p>
          </div>

          {/* ACTIVE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>

            <p className="text-sm text-slate-500 mt-4">Active</p>

            <p className="text-2xl font-black text-slate-900 mt-1">
              {acceptedCount}
            </p>
          </div>

          {/* COMPLETED */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <Check size={20} />
            </div>

            <p className="text-sm text-slate-500 mt-4">Completed</p>

            <p className="text-2xl font-black text-slate-900 mt-1">
              {completedCount}
            </p>
          </div>

          {/* CANCELLED */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle size={20} />
            </div>

            <p className="text-sm text-slate-500 mt-4">Cancelled / Rejected</p>

            <p className="text-2xl font-black text-slate-900 mt-1">
              {cancelledCount}
            </p>
          </div>
        </div>

        {/* ===================================================
            SEARCH + FILTER
        ==================================================== */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            {/* SEARCH */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, service, phone or booking ID..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* STATUS FILTER */}
            <div className="relative md:w-56">
              <Filter
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none"
              >
                <option value="all">All Bookings</option>

                <option value="pending">Pending</option>

                <option value="accepted">Accepted</option>

                <option value="confirmed">Confirmed</option>

                <option value="in-progress">In Progress</option>

                <option value="completed">Completed</option>

                <option value="rejected">Rejected</option>

                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* RESULT COUNT */}
          <div className="mt-3 text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredBookings.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {bookings.length}
            </span>{" "}
            bookings
          </div>
        </div>

        {/* ===================================================
            NO BOOKINGS
        ==================================================== */}
        {bookings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <CalendarDays size={30} className="text-slate-400" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mt-5">
              No bookings found
            </h2>

            <p className="text-slate-500 mt-2">
              Customer bookings will appear here.
            </p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <Search size={34} className="text-slate-300 mx-auto" />

            <h2 className="text-xl font-bold text-slate-900 mt-5">
              No matching bookings
            </h2>

            <p className="text-slate-500 mt-2">
              Try changing your search or status filter.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* =================================================
             BOOKINGS
          ================================================== */
          <div className="space-y-5">
            {filteredBookings.map((booking) => {
              const bookingId = booking?._id;

              const isAcceptLoading = actionLoading === `accept-${bookingId}`;

              const isRejectLoading = actionLoading === `reject-${bookingId}`;

              const isStatusLoading = actionLoading === `status-${bookingId}`;

              const customerName = getCustomerName(booking);

              const customerPhone = getCustomerPhone(booking);

              const serviceName = getServiceName(booking);

              return (
                <div
                  key={bookingId}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6"
                >
                  {/* =================================================
                      TOP
                  ================================================== */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <CalendarDays size={22} />
                      </div>

                      <div>
                        <h2 className="font-bold text-slate-900 text-lg">
                          {serviceName}
                        </h2>

                        <p className="text-sm text-slate-500 mt-1 break-all">
                          Booking ID: {bookingId}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`self-start inline-flex px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusClass(
                        booking?.status,
                      )}`}
                    >
                      {getStatusLabel(booking?.status)}
                    </span>
                  </div>

                  {/* =================================================
                      DETAILS
                  ================================================== */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-100">
                    {/* CUSTOMER */}
                    <div className="flex items-start gap-3">
                      <User
                        size={18}
                        className="text-slate-400 mt-0.5 shrink-0"
                      />

                      <div>
                        <p className="text-xs text-slate-400">Customer</p>

                        <p className="font-semibold text-slate-900 mt-1">
                          {customerName}
                        </p>
                      </div>
                    </div>

                    {/* PHONE */}
                    <div className="flex items-start gap-3">
                      <Phone
                        size={18}
                        className="text-slate-400 mt-0.5 shrink-0"
                      />

                      <div>
                        <p className="text-xs text-slate-400">Phone</p>

                        <p className="font-semibold text-slate-900 mt-1 break-all">
                          {customerPhone}
                        </p>
                      </div>
                    </div>

                    {/* DATE */}
                    <div className="flex items-start gap-3">
                      <CalendarDays
                        size={18}
                        className="text-slate-400 mt-0.5 shrink-0"
                      />

                      <div>
                        <p className="text-xs text-slate-400">Booking Date</p>

                        <p className="font-semibold text-slate-900 mt-1">
                          {formatDate(booking?.bookingDate)}
                        </p>
                      </div>
                    </div>

                    {/* TIME */}
                    <div className="flex items-start gap-3">
                      <Clock3
                        size={18}
                        className="text-slate-400 mt-0.5 shrink-0"
                      />

                      <div>
                        <p className="text-xs text-slate-400">Time</p>

                        <p className="font-semibold text-slate-900 mt-1">
                          {formatTime(booking?.bookingDate)}
                        </p>
                      </div>
                    </div>

                    {/* PRICE */}
                    <div className="flex items-start gap-3">
                      <IndianRupee
                        size={18}
                        className="text-slate-400 mt-0.5 shrink-0"
                      />

                      <div>
                        <p className="text-xs text-slate-400">Amount</p>

                        <p className="font-semibold text-slate-900 mt-1">
                          ₹{Number(booking?.price || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      LOCATION
                  ================================================== */}
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <div className="flex items-start gap-3">
                      <MapPin
                        size={18}
                        className="text-slate-400 mt-0.5 shrink-0"
                      />

                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Service Location
                        </p>

                        <p className="text-sm font-medium text-slate-800">
                          {booking?.address || "N/A"}
                        </p>

                        {(booking?.city || booking?.state) && (
                          <p className="text-sm text-slate-500 mt-1">
                            {booking?.city || ""}
                            {booking?.city && booking?.state ? ", " : ""}
                            {booking?.state || ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      NOTES
                  ================================================== */}
                  {booking?.notes && (
                    <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <FileText size={17} className="text-blue-600 mt-0.5" />

                        <div>
                          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                            Customer Notes
                          </p>

                          <p className="text-sm text-blue-900 mt-1">
                            {booking.notes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      ACTIONS
                  ================================================== */}
                  <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-slate-100">
                    {/* ===============================================
                        PENDING
                    ================================================ */}
                    {booking?.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAccept(bookingId)}
                          disabled={actionLoading !== ""}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm disabled:opacity-60 transition"
                        >
                          {isAcceptLoading ? (
                            <Loader2 size={17} className="animate-spin" />
                          ) : (
                            <Check size={17} />
                          )}
                          Accept Booking
                        </button>

                        <button
                          onClick={() => handleReject(bookingId)}
                          disabled={actionLoading !== ""}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm disabled:opacity-60 transition"
                        >
                          {isRejectLoading ? (
                            <Loader2 size={17} className="animate-spin" />
                          ) : (
                            <X size={17} />
                          )}
                          Reject
                        </button>
                      </>
                    )}

                    {/* ===============================================
                        ACCEPTED
                    ================================================ */}
                    {booking?.status === "accepted" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(bookingId, "confirmed")
                        }
                        disabled={actionLoading !== ""}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-60"
                      >
                        {isStatusLoading ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={17} />
                        )}
                        Confirm Booking
                      </button>
                    )}

                    {/* ===============================================
                        CONFIRMED
                    ================================================ */}
                    {booking?.status === "confirmed" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(bookingId, "in-progress")
                        }
                        disabled={actionLoading !== ""}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm disabled:opacity-60"
                      >
                        {isStatusLoading ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <PlayCircle size={17} />
                        )}
                        Start Service
                      </button>
                    )}

                    {/* ===============================================
                        IN PROGRESS
                    ================================================ */}
                    {booking?.status === "in-progress" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(bookingId, "completed")
                        }
                        disabled={actionLoading !== ""}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm disabled:opacity-60"
                      >
                        {isStatusLoading ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={17} />
                        )}
                        Mark Completed
                      </button>
                    )}

                    {/* ===============================================
                        VIEW DETAILS
                    ================================================ */}
                    <Link
                      to={`/provider/bookings/${bookingId}`}
                      className="inline-flex items-center px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProviderBookings;
