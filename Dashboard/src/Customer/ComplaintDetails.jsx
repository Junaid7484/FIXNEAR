import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  XCircle,
  CalendarDays,
  MapPin,
  UserRound,
  IndianRupee,
  BriefcaseBusiness,
  ShieldCheck,
  Activity,
} from "lucide-react";
import API from "../services/api";

function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // =========================================================
  // AUTH ERROR
  // =========================================================

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    navigate("/login");
  };

  // =========================================================
  // FETCH COMPLAINT
  // GET /complaints/:id
  // =========================================================

  const fetchComplaint = async (showFullLoader = true) => {
    try {
      if (showFullLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await API.get(`/complaints/${id}`);

      console.log("Complaint Details Response:", response.data);

      setComplaint(response.data?.complaint || null);
    } catch (err) {
      console.error("Complaint Details Error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(err.response?.data?.message || "Failed to load complaint.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // INITIAL FETCH
  // =========================================================

  useEffect(() => {
    if (id) {
      fetchComplaint();
    }
  }, [id]);

  // =========================================================
  // STATUS
  // =========================================================

  const getStatusInfo = (status) => {
    switch (status) {
      case "open":
        return {
          label: "Open",
          className: "bg-blue-100 text-blue-700 border-blue-200",
          icon: <AlertCircle size={17} />,
        };

      case "in-progress":
        return {
          label: "In Progress",
          className: "bg-yellow-100 text-yellow-700 border-yellow-200",
          icon: <Clock3 size={17} />,
        };

      case "resolved":
        return {
          label: "Resolved",
          className: "bg-green-100 text-green-700 border-green-200",
          icon: <CheckCircle2 size={17} />,
        };

      case "rejected":
        return {
          label: "Rejected",
          className: "bg-red-100 text-red-700 border-red-200",
          icon: <XCircle size={17} />,
        };

      default:
        return {
          label: status || "Unknown",
          className: "bg-slate-100 text-slate-700 border-slate-200",
          icon: <FileText size={17} />,
        };
    }
  };

  // =========================================================
  // BOOKING STATUS
  // =========================================================

  const getBookingStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          className: "bg-yellow-100 text-yellow-700",
        };

      case "accepted":
        return {
          label: "Accepted",
          className: "bg-blue-100 text-blue-700",
        };

      case "confirmed":
        return {
          label: "Confirmed",
          className: "bg-indigo-100 text-indigo-700",
        };

      case "in-progress":
        return {
          label: "In Progress",
          className: "bg-orange-100 text-orange-700",
        };

      case "completed":
        return {
          label: "Completed",
          className: "bg-green-100 text-green-700",
        };

      case "cancelled":
        return {
          label: "Cancelled",
          className: "bg-red-100 text-red-700",
        };

      case "rejected":
        return {
          label: "Rejected",
          className: "bg-red-100 text-red-700",
        };

      default:
        return {
          label: status || "Unknown",
          className: "bg-slate-100 text-slate-700",
        };
    }
  };

  // =========================================================
  // CATEGORY
  // =========================================================

  const getCategoryLabel = (category) => {
    const categories = {
      booking: "Booking",
      provider: "Provider",
      service: "Service",
      payment: "Payment",
      other: "Other",
    };

    return categories[category] || "Other";
  };

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // =========================================================
  // MONEY
  // =========================================================

  const formatPrice = (price) => {
    if (price === undefined || price === null || price === "") {
      return "—";
    }

    const number = Number(price);

    if (Number.isNaN(number)) {
      return "—";
    }

    return `₹${number.toLocaleString("en-IN")}`;
  };

  // =========================================================
  // GET SERVICE NAME
  // =========================================================

  const getServiceName = (booking) => {
    if (!booking) {
      return "Service Booking";
    }

    if (booking.service && typeof booking.service === "object") {
      return booking.service.name || booking.service.title || "Service Booking";
    }

    if (
      booking.providerService &&
      typeof booking.providerService === "object"
    ) {
      return (
        booking.providerService.name ||
        booking.providerService.title ||
        "Service Booking"
      );
    }

    return "Service Booking";
  };

  // =========================================================
  // GET PROVIDER NAME
  // =========================================================

  const getProviderName = (provider) => {
    if (!provider) {
      return "Provider";
    }

    if (typeof provider === "object") {
      return provider.businessName || provider.name || "Provider";
    }

    return "Provider";
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />

          <p className="text-sm text-slate-500">Loading complaint...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={30} />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Unable to load complaint
          </h2>

          <p className="text-slate-500 mt-2">
            {error || "Complaint not found."}
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => navigate("/complaints")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <button
              onClick={() => fetchComplaint()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              <RefreshCw size={17} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(complaint.status);

  const booking = complaint.booking;

  const provider = complaint.provider;

  const bookingStatusInfo = getBookingStatusInfo(booking?.status);

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button
            onClick={() => navigate("/complaints")}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition"
          >
            <ArrowLeft size={18} />
            Back to Complaints
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mt-6">
            <div>
              <p className="text-sm text-blue-300 font-semibold uppercase tracking-wide">
                Customer Support
              </p>

              <h1 className="text-3xl sm:text-4xl font-bold mt-2">
                Complaint Details
              </h1>

              <p className="text-slate-300 mt-2">
                View the current status and response for your complaint.
              </p>
            </div>

            <button
              onClick={() => fetchComplaint(false)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 disabled:opacity-60 transition"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ===================================================
            COMPLAINT HEADER
        =================================================== */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  Complaint
                </p>

                <h2 className="text-2xl font-bold text-slate-900 mt-2">
                  {complaint.subject}
                </h2>

                <p className="text-sm text-slate-500 mt-2">
                  Submitted on {formatDate(complaint.createdAt)}
                </p>
              </div>

              <span
                className={`inline-flex items-center self-start gap-2 px-3 py-2 rounded-full text-sm font-semibold border ${statusInfo.className}`}
              >
                {statusInfo.icon}

                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* =================================================
              COMPLAINT DETAILS
          ================================================= */}

          <div className="p-6 sm:p-8 space-y-7">
            {/* =================================================
                CATEGORY
            ================================================= */}

            <div>
              <p className="text-sm font-semibold text-slate-500">Category</p>

              <div className="mt-2 inline-flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-slate-800 font-medium">
                <FileText size={16} />

                {getCategoryLabel(complaint.category)}
              </div>
            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Complaint Description
              </p>

              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-700 leading-7 whitespace-pre-wrap">
                {complaint.description}
              </div>
            </div>

            {/* =================================================
                RELATED BOOKING
            ================================================= */}

            {booking && (
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-sm font-semibold text-slate-500">
                    Related Booking
                  </p>

                  {booking._id && (
                    <Link
                      to={`/booking-details/${booking._id}`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View Booking
                    </Link>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      <BriefcaseBusiness size={21} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Service</p>

                      <h3 className="font-bold text-slate-900">
                        {getServiceName(booking)}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Booking Date */}

                    <div className="bg-white rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-2 text-slate-500">
                        <CalendarDays size={17} />

                        <span className="text-xs font-medium">
                          Booking Date
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-slate-900 mt-2">
                        {formatDate(booking.bookingDate)}
                      </p>
                    </div>

                    {/* Booking Status */}

                    <div className="bg-white rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Activity size={17} />

                        <span className="text-xs font-medium">
                          Booking Status
                        </span>
                      </div>

                      <span
                        className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${bookingStatusInfo.className}`}
                      >
                        {bookingStatusInfo.label}
                      </span>
                    </div>

                    {/* Price */}

                    <div className="bg-white rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-2 text-slate-500">
                        <IndianRupee size={17} />

                        <span className="text-xs font-medium">
                          Booking Amount
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-slate-900 mt-2">
                        {formatPrice(booking.price)}
                      </p>
                    </div>

                    {/* Location */}

                    <div className="bg-white rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin size={17} />

                        <span className="text-xs font-medium">Location</span>
                      </div>

                      <p className="text-sm font-semibold text-slate-900 mt-2">
                        {booking.city || booking.state || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Address */}

                  {booking.address && (
                    <div className="mt-4 bg-white rounded-xl p-4 border border-blue-100">
                      <p className="text-xs text-slate-500 font-medium">
                        Service Address
                      </p>

                      <p className="text-sm text-slate-800 mt-1">
                        {booking.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =================================================
                PROVIDER
            ================================================= */}

            {provider && (
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-3">
                  Related Provider
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600">
                        <UserRound size={22} />
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Service Provider
                        </p>

                        <h3 className="font-bold text-slate-900">
                          {getProviderName(provider)}
                        </h3>
                      </div>
                    </div>

                    {provider.isVerified && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        <ShieldCheck size={15} />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 mt-5 text-sm text-slate-500">
                    {provider.city && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={16} />

                        {provider.city}
                      </span>
                    )}

                    {provider.isAvailable !== undefined && (
                      <span
                        className={
                          provider.isAvailable
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {provider.isAvailable
                          ? "Currently Available"
                          : "Currently Unavailable"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                ADMIN RESPONSE
            ================================================= */}

            <div className="border-t border-slate-100 pt-7">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={19}
                  className={
                    complaint.adminResponse
                      ? "text-green-600"
                      : "text-slate-400"
                  }
                />

                <p className="text-sm font-semibold text-slate-500">
                  Admin Response
                </p>
              </div>

              {complaint.adminResponse ? (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-5 text-green-800 leading-7 whitespace-pre-wrap">
                  {complaint.adminResponse}
                </div>
              ) : (
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-500">
                  No response from admin yet.
                </div>
              )}
            </div>

            {/* =================================================
                RESOLVED DATE
            ================================================= */}

            {complaint.resolvedAt && (
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Resolved On
                </p>

                <p className="text-green-600 font-semibold mt-1">
                  {formatDate(complaint.resolvedAt)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================
            BOTTOM ACTIONS
        =================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
          <button
            onClick={() => navigate("/complaints")}
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
          >
            <ArrowLeft size={18} />
            Back to Complaints
          </button>

          {complaint.status === "resolved" && (
            <div className="inline-flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-semibold">
              <CheckCircle2 size={18} />
              Complaint Resolved
            </div>
          )}

          {complaint.status === "in-progress" && (
            <div className="inline-flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl text-sm font-semibold">
              <Clock3 size={18} />
              Admin is reviewing your complaint
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ComplaintDetails;
