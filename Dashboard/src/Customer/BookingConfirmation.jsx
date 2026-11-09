import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  CheckCircle2,
  CalendarDays,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  IndianRupee,
  FileText,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  XCircle,
  Circle,
} from "lucide-react";

import API from "../services/api";

function BookingConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FETCH BOOKING
  // =========================================================

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!id) {
        setError("Booking ID is missing.");
        return;
      }

      const response = await API.get(`/bookings/${id}`);

      console.log("Booking Confirmation Response:", response.data);

      if (response.data.success) {
        setBooking(response.data.booking);
      } else {
        setError(response.data.message || "Unable to load booking details.");
      }
    } catch (err) {
      console.error("Booking Confirmation Error:", err);

      // Unauthorized
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message || "Unable to load booking details.",
      );
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // =========================================================
  // SERVICE HELPERS
  // =========================================================

  const getServiceName = () => {
    return (
      booking?.service?.name ||
      booking?.service?.title ||
      booking?.providerService?.service?.name ||
      booking?.providerService?.service?.title ||
      "Service"
    );
  };

  const getServiceCategory = () => {
    return (
      booking?.service?.category ||
      booking?.providerService?.service?.category ||
      ""
    );
  };

  const getServiceDescription = () => {
    return (
      booking?.providerService?.description ||
      booking?.service?.description ||
      booking?.providerService?.service?.description ||
      ""
    );
  };

  const getServiceImage = () => {
    return (
      booking?.service?.image || booking?.providerService?.service?.image || ""
    );
  };

  // =========================================================
  // PROVIDER HELPERS
  // =========================================================

  const getProviderName = () => {
    return (
      booking?.provider?.businessName ||
      booking?.provider?.user?.name ||
      booking?.provider?.name ||
      "Service Provider"
    );
  };

  const getProviderPhone = () => {
    return booking?.provider?.phone || booking?.provider?.user?.phone || "";
  };

  const getProviderEmail = () => {
    return booking?.provider?.user?.email || booking?.provider?.email || "";
  };

  const getProviderImage = () => {
    return (
      booking?.provider?.profileImage ||
      booking?.provider?.user?.profileImage ||
      ""
    );
  };

  // =========================================================
  // PRICE
  // =========================================================

  const getPrice = () => {
    return Number(
      booking?.price ?? booking?.amount ?? booking?.providerService?.price ?? 0,
    );
  };

  // =========================================================
  // BOOKING DATE
  // =========================================================

  const getBookingDate = () => {
    return booking?.bookingDate || booking?.date || null;
  };

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    try {
      return new Date(date).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Not available";
    }
  };

  // =========================================================
  // TIME FORMAT
  // =========================================================

  const formatTime = (date) => {
    if (!date) {
      return "Not available";
    }

    try {
      return new Date(date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Not available";
    }
  };

  // =========================================================
  // CREATED DATE
  // =========================================================

  const formatCreatedDate = (date) => {
    if (!date) {
      return "Not available";
    }

    try {
      return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Not available";
    }
  };

  // =========================================================
  // STATUS CLASS
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

  // =========================================================
  // STATUS LABEL
  // =========================================================

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
  // HEADER TITLE
  // =========================================================

  const getHeaderTitle = (status) => {
    switch (status) {
      case "pending":
        return "Booking Request Sent!";

      case "accepted":
        return "Booking Accepted!";

      case "confirmed":
        return "Booking Confirmed!";

      case "in-progress":
        return "Service In Progress";

      case "completed":
        return "Service Completed!";

      case "cancelled":
        return "Booking Cancelled";

      case "rejected":
        return "Booking Rejected";

      default:
        return "Booking Details";
    }
  };

  // =========================================================
  // HEADER MESSAGE
  // =========================================================

  const getHeaderMessage = (status) => {
    switch (status) {
      case "pending":
        return "Your booking request has been sent to the service provider.";

      case "accepted":
        return "The provider has accepted your booking request.";

      case "confirmed":
        return "Your service booking has been confirmed.";

      case "in-progress":
        return "Your service is currently in progress.";

      case "completed":
        return "Your service has been completed successfully.";

      case "cancelled":
        return "This booking has been cancelled.";

      case "rejected":
        return "The provider has rejected this booking request.";

      default:
        return "You can track your booking status from your dashboard.";
    }
  };

  // =========================================================
  // STATUS TIMELINE
  // =========================================================

  const statusSteps = [
    {
      key: "pending",
      label: "Booking Requested",
      description: "Your booking request was submitted.",
    },
    {
      key: "accepted",
      label: "Provider Response",
      description: "Provider has accepted your request.",
    },
    {
      key: "confirmed",
      label: "Booking Confirmed",
      description: "Your booking has been confirmed.",
    },
    {
      key: "in-progress",
      label: "Service In Progress",
      description: "The provider is working on your service.",
    },
    {
      key: "completed",
      label: "Completed",
      description: "The service has been completed.",
    },
  ];

  const getStatusIndex = (status) => {
    const index = statusSteps.findIndex((step) => step.key === status);

    return index === -1 ? 0 : index;
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 size={42} className="animate-spin text-blue-600 mx-auto" />

          <p className="mt-4 text-slate-600 font-medium">
            Loading booking confirmation...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mt-5">
            Booking Not Found
          </h1>

          <p className="text-slate-500 mt-2">
            {error || "We could not find this booking."}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
            <button
              onClick={fetchBooking}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition inline-flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Try Again
            </button>

            <Link
              to="/customer/dashboard"
              className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition text-center"
            >
              Customer Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VALUES
  // =========================================================

  const bookingDate = getBookingDate();
  const price = getPrice();

  const currentStatus = booking.status;

  const currentStatusIndex = getStatusIndex(currentStatus);

  const serviceImage = getServiceImage();

  const providerImage = getProviderImage();

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* =================================================
            HEADER
        ================================================== */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div
            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
              currentStatus === "cancelled" || currentStatus === "rejected"
                ? "bg-red-50"
                : currentStatus === "completed"
                  ? "bg-green-50"
                  : "bg-blue-50"
            }`}
          >
            {currentStatus === "cancelled" || currentStatus === "rejected" ? (
              <XCircle size={48} className="text-red-600" />
            ) : (
              <CheckCircle2
                size={48}
                className={
                  currentStatus === "completed"
                    ? "text-green-600"
                    : "text-blue-600"
                }
              />
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-5">
            {getHeaderTitle(currentStatus)}
          </h1>

          <p className="text-slate-500 mt-2 max-w-xl mx-auto">
            {getHeaderMessage(currentStatus)}
          </p>

          {/* BOOKING ID */}

          <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3">
            <span className="text-sm text-slate-500">Booking ID:</span>

            <span className="font-bold text-slate-900 break-all">
              {booking._id || id}
            </span>
          </div>

          {/* STATUS */}

          <div className="mt-4">
            <span
              className={`inline-flex px-4 py-2 rounded-full border text-sm font-bold ${getStatusClass(
                booking.status,
              )}`}
            >
              {getStatusLabel(booking.status)}
            </span>
          </div>
        </div>

        {/* =================================================
            MAIN CONTENT
        ================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* =================================================
              LEFT SIDE
          ================================================== */}

          <div className="lg:col-span-2 space-y-6">
            {/* =================================================
                SERVICE DETAILS
            ================================================== */}

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Service Details
                  </h2>

                  <p className="text-sm text-slate-500">
                    Your selected service
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row gap-5">
                  {/* SERVICE IMAGE */}

                  {serviceImage && (
                    <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img
                        src={serviceImage}
                        alt={getServiceName()}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      {getServiceName()}
                    </h3>

                    {getServiceCategory() && (
                      <p className="text-sm text-blue-600 font-medium mt-1">
                        {getServiceCategory()}
                      </p>
                    )}

                    {getServiceDescription() && (
                      <p className="text-sm text-slate-500 mt-3 leading-6">
                        {getServiceDescription()}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDays size={16} />

                        <span>{formatDate(bookingDate)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock size={16} />

                        <span>{formatTime(bookingDate)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <IndianRupee size={18} />

                        <span>{price.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                BOOKING INFORMATION
            ================================================== */}

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-5">
                Booking Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* DATE */}

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <CalendarDays size={19} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Booking Date</p>

                    <p className="font-semibold text-slate-900 mt-1">
                      {formatDate(bookingDate)}
                    </p>
                  </div>
                </div>

                {/* TIME */}

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Clock size={19} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Booking Time</p>

                    <p className="font-semibold text-slate-900 mt-1">
                      {formatTime(bookingDate)}
                    </p>
                  </div>
                </div>

                {/* ADDRESS */}

                <div className="flex gap-3 sm:col-span-2">
                  <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                    <MapPin size={19} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Service Address</p>

                    <p className="font-semibold text-slate-900 mt-1">
                      {booking.address || "Not available"}
                    </p>

                    {(booking.city || booking.state) && (
                      <p className="text-sm text-slate-500 mt-1">
                        {booking.city || ""}
                        {booking.city && booking.state ? ", " : ""}
                        {booking.state || ""}
                      </p>
                    )}
                  </div>
                </div>

                {/* NOTES */}

                {booking.notes && (
                  <div className="flex gap-3 sm:col-span-2">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <FileText size={19} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Notes</p>

                      <p className="text-sm text-slate-700 mt-1 leading-6">
                        {booking.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* CREATED AT */}

                {booking.createdAt && (
                  <div className="flex gap-3 sm:col-span-2">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Clock size={19} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Booking Created</p>

                      <p className="font-semibold text-slate-900 mt-1">
                        {formatCreatedDate(booking.createdAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* CANCELLATION REASON */}

                {booking.cancellationReason && (
                  <div className="flex gap-3 sm:col-span-2">
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <XCircle size={19} />
                    </div>

                    <div>
                      <p className="text-xs text-red-600">
                        Cancellation Reason
                      </p>

                      <p className="text-sm text-slate-700 mt-1 leading-6">
                        {booking.cancellationReason}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* =================================================
                PROVIDER
            ================================================== */}

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-5">
                Service Provider
              </h2>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  {/* PROVIDER IMAGE */}

                  {providerImage ? (
                    <img
                      src={providerImage}
                      alt={getProviderName()}
                      className="w-14 h-14 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <User size={27} />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-900">
                        {getProviderName()}
                      </h3>

                      {booking.provider?.isVerified && (
                        <ShieldCheck size={18} className="text-blue-600" />
                      )}
                    </div>

                    {(booking.provider?.city || booking.provider?.state) && (
                      <p className="text-sm text-slate-500 mt-1">
                        {booking.provider?.city || ""}

                        {booking.provider?.city && booking.provider?.state
                          ? `, ${booking.provider.state}`
                          : booking.provider?.state || ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {getProviderPhone() && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={16} />
                      <span>{getProviderPhone()}</span>
                    </div>
                  )}

                  {getProviderEmail() && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={16} />
                      <span>{getProviderEmail()}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* =================================================
              RIGHT SIDE
          ================================================== */}

          <div>
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-bold text-slate-900">
                Booking Summary
              </h2>

              <div className="mt-6 space-y-4">
                {/* SERVICE */}

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Service</span>

                  <span className="font-semibold text-slate-900 text-right">
                    {getServiceName()}
                  </span>
                </div>

                <div className="border-t border-slate-100" />

                {/* BOOKING ID */}

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Booking ID</span>

                  <span className="font-semibold text-slate-900 text-right break-all max-w-[180px]">
                    {booking._id || id}
                  </span>
                </div>

                <div className="border-t border-slate-100" />

                {/* STATUS */}

                <div className="flex justify-between gap-4 items-center">
                  <span className="text-slate-500">Status</span>

                  <span
                    className={`px-3 py-1 rounded-full border text-xs font-bold ${getStatusClass(
                      booking.status,
                    )}`}
                  >
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                <div className="border-t border-slate-100" />

                {/* DATE */}

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Date</span>

                  <span className="font-semibold text-slate-900 text-right">
                    {formatDate(bookingDate)}
                  </span>
                </div>

                <div className="border-t border-slate-100" />

                {/* TIME */}

                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Time</span>

                  <span className="font-semibold text-slate-900">
                    {formatTime(bookingDate)}
                  </span>
                </div>

                <div className="border-t border-slate-100" />

                {/* TOTAL */}

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">
                    Total Amount
                  </span>

                  <span className="text-2xl font-black text-slate-900">
                    ₹{price.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="mt-7 space-y-3">
                <Link
                  to="/my-bookings"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
                >
                  View My Bookings
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/customer/dashboard"
                  className="w-full inline-flex items-center justify-center px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition"
                >
                  Go to Dashboard
                </Link>
              </div>
            </section>
          </div>
        </div>

        {/* =================================================
            BOOKING STATUS TIMELINE
        ================================================== */}

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Booking Status
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Track your booking progress
              </p>
            </div>

            <span
              className={`px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusClass(
                currentStatus,
              )}`}
            >
              {getStatusLabel(currentStatus)}
            </span>
          </div>

          {/* CANCELLED / REJECTED */}

          {(currentStatus === "cancelled" || currentStatus === "rejected") && (
            <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
              <XCircle size={22} className="text-red-500 shrink-0 mt-0.5" />

              <div>
                <h3 className="font-bold text-red-700">
                  Booking{" "}
                  {currentStatus === "cancelled" ? "Cancelled" : "Rejected"}
                </h3>

                <p className="text-sm text-red-600 mt-1">
                  {booking.cancellationReason ||
                    "This booking is no longer active."}
                </p>
              </div>
            </div>
          )}

          {/* NORMAL TIMELINE */}

          {currentStatus !== "cancelled" && currentStatus !== "rejected" && (
            <div className="mt-7">
              {statusSteps.map((step, index) => {
                const completed = index <= currentStatusIndex;

                const isCurrent = index === currentStatusIndex;

                return (
                  <div key={step.key} className="flex gap-4">
                    {/* ICON / LINE */}

                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          completed
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-slate-200 text-slate-300"
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          <Circle size={18} />
                        )}
                      </div>

                      {index < statusSteps.length - 1 && (
                        <div
                          className={`w-0.5 h-12 ${
                            index < currentStatusIndex
                              ? "bg-blue-600"
                              : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>

                    {/* CONTENT */}

                    <div className="pb-7">
                      <h3
                        className={`font-bold ${
                          isCurrent
                            ? "text-blue-600"
                            : completed
                              ? "text-slate-900"
                              : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =================================================
            NEXT STEPS
        ================================================== */}

        <section className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mt-6">
          <h2 className="text-lg font-bold text-slate-900">
            What happens next?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
            <div>
              <div className="font-bold text-blue-600">01</div>

              <h3 className="font-semibold text-slate-900 mt-2">
                Provider receives booking
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Your booking request has been sent to the service provider.
              </p>
            </div>

            <div>
              <div className="font-bold text-blue-600">02</div>

              <h3 className="font-semibold text-slate-900 mt-2">
                Provider responds
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                The provider can accept or reject your booking request.
              </p>
            </div>

            <div>
              <div className="font-bold text-blue-600">03</div>

              <h3 className="font-semibold text-slate-900 mt-2">
                Track your booking
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                You can monitor the booking status from My Bookings.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default BookingConfirmation;
