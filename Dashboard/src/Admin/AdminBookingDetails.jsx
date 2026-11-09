import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  UserRound,
  BriefcaseBusiness,
  IndianRupee,
  MapPin,
  FileText,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

const STATUS_OPTIONS = [
  "pending",
  "accepted",
  "confirmed",
  "in-progress",
  "completed",
  "rejected",
  "cancelled",
];

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  accepted: {
    label: "Accepted",
    className: "bg-blue-100 text-blue-700",
    icon: CheckCircle,
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-indigo-100 text-indigo-700",
    icon: CheckCircle,
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-purple-100 text-purple-700",
    icon: Loader2,
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-700",
    icon: Ban,
  },
};

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatDateTime = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCustomer = (booking) => {
  if (!booking?.customer) {
    return {};
  }

  return typeof booking.customer === "object" ? booking.customer : {};
};

const getProvider = (booking) => {
  if (!booking?.provider) {
    return {};
  }

  return typeof booking.provider === "object" ? booking.provider : {};
};

const getService = (booking) => {
  if (!booking?.service) {
    return {};
  }

  return typeof booking.service === "object" ? booking.service : {};
};

const getProviderService = (booking) => {
  if (!booking?.providerService) {
    return {};
  }

  return typeof booking.providerService === "object"
    ? booking.providerService
    : {};
};

const BookingDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");

  // ========================================
  // FETCH BOOKING
  // ========================================

  const fetchBooking = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await API.get(`/bookings/${id}`);

      const data = response.data?.booking;

      setBooking(data || null);

      if (data) {
        setSelectedStatus(data.status || "");
        setCancellationReason(data.cancellationReason || "");
      }
    } catch (err) {
      console.error("Fetch booking error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/admin/login");
        return;
      }

      if (err.response?.status === 403) {
        setError("You are not authorized to view this booking.");
        return;
      }

      if (err.response?.status === 404) {
        setError("Booking not found.");
        return;
      }

      setError(
        err.response?.data?.message || "Failed to load booking details.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]);

  // ========================================
  // UPDATE STATUS
  // ========================================

  const updateStatus = async () => {
    if (!booking || !selectedStatus) return;

    try {
      setUpdating(true);

      const response = await API.put(`/bookings/admin/${booking._id}/status`, {
        status: selectedStatus,
      });

      const updatedBooking = response.data?.booking;

      if (updatedBooking) {
        setBooking(updatedBooking);

        setSelectedStatus(updatedBooking.status || "");

        setCancellationReason(updatedBooking.cancellationReason || "");
      } else {
        await fetchBooking(true);
      }

      alert("Booking status updated successfully.");
    } catch (err) {
      console.error("Update booking status error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/admin/login");
        return;
      }

      alert(err.response?.data?.message || "Failed to update booking status.");
    } finally {
      setUpdating(false);
    }
  };

  // ========================================
  // CANCEL BOOKING
  // ========================================

  const cancelBooking = async () => {
    if (!booking) return;

    const reason = window.prompt(
      "Enter cancellation reason:",
      booking.cancellationReason || "Cancelled by admin",
    );

    if (reason === null) {
      return;
    }

    try {
      setUpdating(true);

      const response = await API.put(`/bookings/admin/${booking._id}/cancel`, {
        cancellationReason: reason.trim() || "Cancelled by admin",
      });

      const updatedBooking = response.data?.booking;

      if (updatedBooking) {
        setBooking(updatedBooking);
        setSelectedStatus(updatedBooking.status || "cancelled");
        setCancellationReason(updatedBooking.cancellationReason || "");
      } else {
        await fetchBooking(true);
      }

      alert("Booking cancelled successfully.");
    } catch (err) {
      console.error("Cancel booking error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/admin/login");
        return;
      }

      alert(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setUpdating(false);
    }
  };

  // ========================================
  // STATUS BADGE
  // ========================================

  const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || {
      label: formatStatus(status),
      className: "bg-gray-100 text-gray-700",
      icon: AlertCircle,
    };

    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${config.className}`}
      >
        <Icon size={16} />
        {config.label}
      </span>
    );
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader2
              size={42}
              className="mx-auto animate-spin text-indigo-600"
            />

            <p className="mt-4 text-sm text-slate-500">
              Loading booking details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => navigate("/admin/bookings")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600"
          >
            <ArrowLeft size={18} />
            Back to Bookings
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <AlertCircle size={45} className="mx-auto text-red-500" />

            <h2 className="mt-4 text-xl font-bold text-red-800">
              Unable to load booking
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error || "Booking not found."}
            </p>

            <button
              onClick={() => fetchBooking()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const customer = getCustomer(booking);
  const provider = getProvider(booking);
  const service = getService(booking);
  const providerService = getProviderService(booking);

  const price = Number(
    booking.price ?? providerService.price ?? service.price ?? 0,
  );

  // ========================================
  // PAGE
  // ========================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate("/admin/bookings")}
              className="mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Booking Details
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Booking #{booking._id?.slice(-8)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={booking.status} />

            <button
              onClick={() => fetchBooking(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* MAIN GRID */}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT */}

          <div className="space-y-6 lg:col-span-2">
            {/* BOOKING INFORMATION */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                  <CalendarDays size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Booking Information
                  </h2>

                  <p className="text-sm text-slate-500">
                    Basic booking details
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Booking ID
                  </p>

                  <p className="mt-1 break-all font-semibold text-slate-800">
                    {booking._id}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Created
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDateTime(booking.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Booking Date
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDateTime(booking.bookingDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Amount
                  </p>

                  <p className="mt-1 flex items-center font-bold text-indigo-700">
                    <IndianRupee size={17} />
                    {price.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            {/* CUSTOMER */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                  <UserRound size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">Customer</h2>

                  <p className="text-sm text-slate-500">Customer information</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Name
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {customer.name || "Unknown Customer"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Email
                  </p>

                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <Mail size={15} />
                    {customer.email || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Phone
                  </p>

                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <Phone size={15} />
                    {customer.phone || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    City
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {customer.city || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* PROVIDER */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                  <BriefcaseBusiness size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">Provider</h2>

                  <p className="text-sm text-slate-500">
                    Service provider information
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Business
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {provider.businessName ||
                      provider.name ||
                      "Unknown Provider"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Phone
                  </p>

                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <Phone size={15} />
                    {provider.phone || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    City
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {provider.city || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Experience
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {provider.experience ?? 0} years
                  </p>
                </div>
              </div>
            </div>

            {/* SERVICE */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-green-100 p-3 text-green-600">
                  <BriefcaseBusiness size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">Service</h2>

                  <p className="text-sm text-slate-500">
                    Selected service information
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Service Name
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {service.name || "Unknown Service"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Category
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {service.category || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Provider Price
                  </p>

                  <p className="mt-1 flex items-center font-semibold text-slate-800">
                    <IndianRupee size={15} />
                    {Number(
                      providerService.price ?? service.price ?? price,
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Duration
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {providerService.duration || service.duration || "N/A"}
                  </p>
                </div>
              </div>

              {service.description && (
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Description
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {service.description}
                  </p>
                </div>
              )}
            </div>

            {/* ADDRESS + NOTES */}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <MapPin size={21} className="text-red-500" />

                  <h2 className="font-bold text-slate-900">Service Address</h2>
                </div>

                <p className="text-sm leading-6 text-slate-600">
                  {booking.address || "N/A"}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {booking.city || ""}
                  {booking.city && booking.state ? ", " : ""}
                  {booking.state || ""}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <FileText size={21} className="text-indigo-500" />

                  <h2 className="font-bold text-slate-900">Customer Notes</h2>
                </div>

                <p className="text-sm leading-6 text-slate-600">
                  {booking.notes || "No additional notes provided."}
                </p>
              </div>
            </div>

            {/* CANCELLATION */}

            {booking.cancellationReason && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <div className="flex items-center gap-3">
                  <Ban size={21} className="text-red-600" />

                  <h2 className="font-bold text-red-800">
                    Cancellation Reason
                  </h2>
                </div>

                <p className="mt-3 text-sm leading-6 text-red-700">
                  {booking.cancellationReason}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}

          <div className="space-y-6">
            {/* STATUS MANAGEMENT */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Manage Status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Change the current booking status.
              </p>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Booking Status
                </label>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={updating}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={updateStatus}
                disabled={updating || selectedStatus === booking.status}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={17} />
                    Update Status
                  </>
                )}
              </button>
            </div>

            {/* CANCEL */}

            {booking.status !== "completed" &&
              booking.status !== "cancelled" && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                  <div className="flex items-center gap-3">
                    <Ban size={21} className="text-red-600" />

                    <h2 className="font-bold text-red-800">Cancel Booking</h2>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-red-600">
                    Cancelling this booking will mark it as cancelled.
                  </p>

                  <button
                    onClick={cancelBooking}
                    disabled={updating}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {updating ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Ban size={17} />
                    )}
                    Cancel Booking
                  </button>
                </div>
              )}

            {/* SUMMARY */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Quick Summary
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Status</span>

                  <StatusBadge status={booking.status} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Amount</span>

                  <span className="flex items-center font-bold text-slate-900">
                    <IndianRupee size={15} />
                    {price.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Created</span>

                  <span className="text-right text-sm font-medium text-slate-700">
                    {formatDateTime(booking.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* BACK */}

            <button
              onClick={() => navigate("/admin/bookings")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ArrowLeft size={17} />
              Back to All Bookings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
