import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  CalendarDays,
  UserRound,
  BriefcaseBusiness,
  IndianRupee,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  Ban,
  MapPin,
  ChevronDown,
  Filter,
  CreditCard,
  Wallet,
  Tags,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const STATUS_OPTIONS = [
  "all",
  "pending",
  "accepted",
  "confirmed",
  "in-progress",
  "completed",
  "rejected",
  "cancelled",
];

const ADMIN_STATUS_OPTIONS = [
  "pending",
  "accepted",
  "confirmed",
  "in-progress",
  "completed",
  "rejected",
  "cancelled",
];

const PAYMENT_FILTER_OPTIONS = [
  "all",
  "online",
  "cash",
  "paid",
  "pending",
  "failed",
  "refunded",
  "pay-after-service",
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

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const formatStatus = (status) => {
  if (!status) return "Unknown";
  return String(status)
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatDate = (date) => {
  if (!date) return "N/A";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "N/A";
  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "N/A";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "N/A";
  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCustomerName = (booking) => {
  if (!booking?.customer) return "Unknown Customer";
  if (typeof booking.customer === "string") return "Customer";
  return booking.customer.name || "Unknown Customer";
};

const getCustomerEmail = (booking) => {
  if (!booking?.customer || typeof booking.customer === "string") return "";
  return booking.customer.email || "";
};

const getProviderName = (booking) => {
  if (!booking?.provider) return "Unknown Provider";
  if (typeof booking.provider === "string") return "Provider";
  return (
    booking.provider.businessName ||
    booking.provider.name ||
    booking.provider.user?.name ||
    "Unknown Provider"
  );
};

const getServiceName = (booking) => {
  const service = booking?.service;
  const providerService = booking?.providerService;
  if (service && typeof service === "object") {
    return (
      service.name ||
      service.title ||
      providerService?.name ||
      "Unknown Service"
    );
  }
  if (providerService && typeof providerService === "object") {
    return providerService.name || providerService.service?.name || "Service";
  }
  return service ? "Service" : "Unknown Service";
};

const getCategoryName = (booking) => {
  const candidates = [
    booking?.category,
    booking?.serviceCategory,
    booking?.service?.category,
    booking?.providerService?.category,
    booking?.providerService?.service?.category,
    booking?.service?.categoryName,
    booking?.providerService?.categoryName,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim())
      return candidate.trim();
    if (candidate && typeof candidate === "object") {
      const name = candidate.name || candidate.title || candidate.categoryName;
      if (name) return String(name);
    }
  }
  return "Uncategorized";
};

const getPrice = (booking) => {
  const price =
    booking?.price ??
    booking?.totalAmount ??
    booking?.amount ??
    booking?.providerService?.price ??
    booking?.service?.price ??
    0;
  return Number(price) || 0;
};

const getLocation = (booking) => {
  const parts = [booking?.address, booking?.city, booking?.state].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(", ") : "N/A";
};

const getPaymentMethod = (booking) => {
  const raw = normalize(
    booking?.paymentMethod ??
      booking?.payment?.method ??
      booking?.paymentDetails?.method ??
      booking?.paymentMode ??
      booking?.paymentType,
  );

  if (
    [
      "cash",
      "cod",
      "cashonservice",
      "cashondelivery",
      "paylater",
      "cashafterservice",
    ].includes(raw)
  ) {
    return { key: "cash", label: "Cash / Pay After Service", icon: Wallet };
  }
  if (
    [
      "online",
      "razorpay",
      "card",
      "upi",
      "netbanking",
      "payonline",
      "gateway",
    ].includes(raw)
  ) {
    const label =
      raw === "razorpay"
        ? "Online (Razorpay)"
        : raw === "upi"
          ? "Online (UPI)"
          : raw === "card"
            ? "Online (Card)"
            : "Online";
    return { key: "online", label, icon: CreditCard };
  }
  return { key: "unknown", label: "Not specified", icon: CreditCard };
};

const getPaymentStatus = (booking) => {
  const raw = normalize(
    booking?.paymentStatus ??
      booking?.payment?.status ??
      booking?.paymentDetails?.status ??
      booking?.transactionStatus,
  );

  const method = getPaymentMethod(booking);
  const isPaid =
    [
      "paid",
      "success",
      "successful",
      "captured",
      "verified",
      "completed",
    ].includes(raw) ||
    booking?.isPaid === true ||
    booking?.paymentVerified === true ||
    booking?.payment?.verified === true;

  if (["refunded", "refund", "partiallyrefunded"].includes(raw)) {
    return {
      key: "refunded",
      label: "Refunded",
      className: "bg-orange-100 text-orange-700",
    };
  }
  if (["failed", "failure", "declined", "paymentfailed"].includes(raw)) {
    return {
      key: "failed",
      label: "Payment Failed",
      className: "bg-red-100 text-red-700",
    };
  }
  if (["cancelled", "canceled"].includes(raw)) {
    return {
      key: "failed",
      label: "Payment Cancelled",
      className: "bg-red-100 text-red-700",
    };
  }
  if (["partiallypaid", "partial"].includes(raw)) {
    return {
      key: "pending",
      label: "Partially Paid",
      className: "bg-orange-100 text-orange-700",
    };
  }
  if (isPaid) {
    return {
      key: "paid",
      label: "Paid",
      className: "bg-green-100 text-green-700",
    };
  }
  if (method.key === "cash") {
    return {
      key: "pay-after-service",
      label: "Pay After Service",
      className: "bg-amber-100 text-amber-800",
    };
  }
  if (
    method.key === "online" ||
    [
      "",
      "pending",
      "created",
      "authorized",
      "ordercreated",
      "pendingpayment",
    ].includes(raw)
  ) {
    return {
      key: "pending",
      label: "Payment Pending",
      className: "bg-yellow-100 text-yellow-700",
    };
  }
  return {
    key: "unknown",
    label: "Unknown",
    className: "bg-gray-100 text-gray-700",
  };
};

const getBookingOutcome = (booking) => {
  const bookingStatus = normalize(booking?.status);
  const payment = getPaymentStatus(booking);

  if (
    ["cancelled", "canceled", "rejected"].includes(bookingStatus) ||
    payment.key === "failed"
  ) {
    return {
      key: "failed",
      label: "Not Successful",
      className: "bg-red-100 text-red-700",
      description: "Booking/payment did not complete",
    };
  }

  if (payment.key === "pending" && getPaymentMethod(booking).key === "online") {
    return {
      key: "pending",
      label: "Awaiting Payment",
      className: "bg-yellow-100 text-yellow-700",
      description: "Online payment is not confirmed",
    };
  }

  if (
    ["pending", "accepted", "confirmed", "inprogress", "completed"].includes(
      bookingStatus,
    )
  ) {
    return {
      key: "success",
      label: "Booking Placed",
      className: "bg-green-100 text-green-700",
      description: "Booking record was created",
    };
  }

  return {
    key: "unknown",
    label: "Check Status",
    className: "bg-gray-100 text-gray-700",
    description: "Booking outcome is not available",
  };
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || {
    label: formatStatus(status),
    className: "bg-gray-100 text-gray-700",
    icon: AlertCircle,
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
};

const ManageBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [statusMenuId, setStatusMenuId] = useState(null);

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/admin/login");
  };

  const fetchBookings = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const response = await API.get("/bookings");
      const bookingData =
        response?.data?.bookings || response?.data?.data || [];
      setBookings(Array.isArray(bookingData) ? bookingData : []);
    } catch (err) {
      console.error("Fetch bookings error:", err);
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      if (err?.response?.status === 403) {
        setError("You are not authorized to access admin bookings.");
        return;
      }
      setError(
        err?.response?.data?.message ||
          "Failed to load bookings. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (bookingId, status) => {
    const booking = bookings.find((item) => item._id === bookingId);
    if (!booking) return;

    if (booking.status === status) {
      setStatusMenuId(null);
      return;
    }

    if (["completed", "cancelled", "rejected"].includes(booking.status)) {
      alert(
        "Completed, cancelled or rejected bookings cannot be moved to another status.",
      );
      setStatusMenuId(null);
      return;
    }

    let reason = "";
    if (status === "rejected") {
      reason =
        window.prompt("Enter rejection reason:", "Rejected by admin") ?? "";
      if (!reason.trim()) reason = "Rejected by admin";
    }
    if (status === "cancelled") {
      reason =
        window.prompt("Enter cancellation reason:", "Cancelled by admin") ?? "";
      if (!reason.trim()) reason = "Cancelled by admin";
    }

    try {
      setUpdatingId(bookingId);
      setStatusMenuId(null);
      const response = await API.put(`/bookings/admin/${bookingId}/status`, {
        status,
        cancellationReason: reason.trim(),
      });
      const updatedBooking = response?.data?.booking;
      if (updatedBooking) {
        setBookings((previous) =>
          previous.map((item) =>
            item._id === bookingId ? updatedBooking : item,
          ),
        );
      } else {
        await fetchBookings(true);
      }
    } catch (err) {
      console.error("Update booking status error:", err);
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      alert(err?.response?.data?.message || "Failed to update booking status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const cancelBooking = async (bookingId) => {
    const reason = window.prompt(
      "Enter cancellation reason:",
      "Cancelled by admin",
    );
    if (reason === null) return;

    try {
      setUpdatingId(bookingId);
      const response = await API.put(`/bookings/admin/${bookingId}/cancel`, {
        reason: reason.trim() || "Cancelled by admin",
      });
      const updatedBooking = response?.data?.booking;
      if (updatedBooking) {
        setBookings((previous) =>
          previous.map((booking) =>
            booking._id === bookingId ? updatedBooking : booking,
          ),
        );
      } else {
        await fetchBookings(true);
      }
    } catch (err) {
      console.error("Cancel booking error:", err);
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      alert(err?.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const method = getPaymentMethod(booking);
      const payment = getPaymentStatus(booking);
      const outcome = getBookingOutcome(booking);
      const searchValues = [
        getCustomerName(booking),
        getCustomerEmail(booking),
        getProviderName(booking),
        getServiceName(booking),
        getCategoryName(booking),
        booking?._id,
        getLocation(booking),
        method.label,
        payment.label,
        outcome.label,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchValues.includes(query);
      const matchesStatus =
        statusFilter === "all" ||
        normalize(booking?.status) === normalize(statusFilter);
      const matchesPayment =
        paymentFilter === "all" ||
        method.key === paymentFilter ||
        payment.key === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [bookings, search, statusFilter, paymentFilter]);

  const stats = useMemo(() => {
    const completedBookings = bookings.filter(
      (booking) => booking?.status === "completed",
    );
    const successful = bookings.filter(
      (booking) => getBookingOutcome(booking).key === "success",
    ).length;
    const unsuccessful = bookings.filter(
      (booking) => getBookingOutcome(booking).key === "failed",
    ).length;
    const paymentPending = bookings.filter(
      (booking) => getPaymentStatus(booking).key === "pending",
    ).length;
    const paid = bookings.filter(
      (booking) => getPaymentStatus(booking).key === "paid",
    ).length;

    return {
      total: bookings.length,
      successful,
      unsuccessful,
      paymentPending,
      paid,
      pending: bookings.filter((booking) => booking?.status === "pending")
        .length,
      accepted: bookings.filter((booking) => booking?.status === "accepted")
        .length,
      confirmed: bookings.filter((booking) => booking?.status === "confirmed")
        .length,
      inProgress: bookings.filter(
        (booking) => booking?.status === "in-progress",
      ).length,
      completed: completedBookings.length,
      earnings: completedBookings.reduce(
        (total, booking) => total + getPrice(booking),
        0,
      ),
    };
  }, [bookings]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentFilter("all");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <div className="text-center">
            <Loader2
              size={42}
              className="mx-auto animate-spin text-indigo-600"
            />
            <p className="mt-4 text-sm text-slate-500">Loading bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-lg bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                ADMIN
              </span>
              <span className="text-sm text-slate-400">/</span>
              <span className="text-sm text-slate-500">Bookings</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Manage Bookings
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View booking categories, placement results and payment details.
            </p>
          </div>
          <button
            onClick={() => fetchBookings(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Unable to load bookings</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={() => fetchBookings()}
              className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Bookings</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {stats.total}
            </p>
          </div>
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm text-green-700">Booking Placed</p>
            <p className="mt-2 text-2xl font-bold text-green-800">
              {stats.successful}
            </p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">Not Successful</p>
            <p className="mt-2 text-2xl font-bold text-red-800">
              {stats.unsuccessful}
            </p>
          </div>
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <p className="text-sm text-yellow-700">Payment Pending</p>
            <p className="mt-2 text-2xl font-bold text-yellow-800">
              {stats.paymentPending}
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <p className="text-sm text-indigo-700">Completed Value</p>
            <p className="mt-2 flex items-center text-2xl font-bold text-indigo-800">
              <IndianRupee size={21} />
              {stats.earnings.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_240px]">
            <div className="relative">
              <Search
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, provider, service, category, payment or booking ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="relative">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-10 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "all"
                      ? "All Booking Statuses"
                      : formatStatus(status)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
            <div className="relative">
              <CreditCard
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-10 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {PAYMENT_FILTER_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value === "all"
                      ? "All Payment Types"
                      : formatStatus(value)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {filteredBookings.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {bookings.length}
              </span>{" "}
              bookings
            </p>
            {(search || statusFilter !== "all" || paymentFilter !== "all") && (
              <button
                onClick={clearFilters}
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <CalendarDays size={45} className="mx-auto text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-800">
              No bookings found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
            {(search || statusFilter !== "all" || paymentFilter !== "all") && (
              <button
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1750px]">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      {[
                        "Booking",
                        "Customer",
                        "Provider",
                        "Service",
                        "Category",
                        "Date",
                        "Price",
                        "Booking Result",
                        "Payment Mode",
                        "Payment Status",
                        "Status",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((booking) => {
                      const isUpdating = updatingId === booking._id;
                      const method = getPaymentMethod(booking);
                      const payment = getPaymentStatus(booking);
                      const outcome = getBookingOutcome(booking);
                      const MethodIcon = method.icon;
                      return (
                        <tr
                          key={booking._id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">
                              #{booking._id?.slice(-8)}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Created {formatDate(booking.createdAt)}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                <UserRound size={17} />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">
                                  {getCustomerName(booking)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {getCustomerEmail(booking)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <BriefcaseBusiness
                                size={16}
                                className="text-slate-400"
                              />
                              <span className="font-medium text-slate-700">
                                {getProviderName(booking)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800">
                              {getServiceName(booking)}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {booking?.providerService?.duration
                                ? `${booking.providerService.duration} min`
                                : ""}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700">
                              <Tags size={13} />
                              {getCategoryName(booking)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <CalendarDays
                                size={16}
                                className="text-slate-400"
                              />
                              {formatDateTime(booking.bookingDate)}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center font-semibold text-slate-800">
                              <IndianRupee size={15} />
                              {getPrice(booking).toLocaleString("en-IN")}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${outcome.className}`}
                              title={outcome.description}
                            >
                              {outcome.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                              <MethodIcon
                                size={16}
                                className="text-slate-400"
                              />
                              {method.label}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${payment.className}`}
                            >
                              {payment.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={booking.status} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  navigate(`/admin/bookings/${booking._id}`)
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                <Eye size={15} />
                                View
                              </button>
                              <div className="relative">
                                <button
                                  disabled={isUpdating}
                                  onClick={() =>
                                    setStatusMenuId(
                                      statusMenuId === booking._id
                                        ? null
                                        : booking._id,
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <ChevronDown size={14} />
                                  )}
                                  Status
                                </button>
                                {statusMenuId === booking._id && (
                                  <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                                    {ADMIN_STATUS_OPTIONS.map((status) => (
                                      <button
                                        key={status}
                                        onClick={() =>
                                          updateStatus(booking._id, status)
                                        }
                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition hover:bg-slate-50 ${booking.status === status ? "bg-indigo-50 text-indigo-700" : "text-slate-700"}`}
                                      >
                                        <span>{formatStatus(status)}</span>
                                        {booking.status === status && (
                                          <CheckCircle size={14} />
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {!["completed", "cancelled", "rejected"].includes(
                                booking.status,
                              ) && (
                                <button
                                  disabled={isUpdating}
                                  onClick={() => cancelBooking(booking._id)}
                                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                >
                                  {isUpdating ? "..." : "Cancel"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 lg:hidden">
              {filteredBookings.map((booking) => {
                const isUpdating = updatingId === booking._id;
                const method = getPaymentMethod(booking);
                const payment = getPaymentStatus(booking);
                const outcome = getBookingOutcome(booking);
                const MethodIcon = method.icon;
                return (
                  <div
                    key={booking._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">
                          #{booking._id?.slice(-8)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Created {formatDate(booking.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="mt-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <UserRound
                          size={18}
                          className="mt-0.5 text-indigo-500"
                        />
                        <div>
                          <p className="text-xs text-slate-400">Customer</p>
                          <p className="font-semibold text-slate-800">
                            {getCustomerName(booking)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {getCustomerEmail(booking)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <BriefcaseBusiness
                          size={18}
                          className="mt-0.5 text-indigo-500"
                        />
                        <div>
                          <p className="text-xs text-slate-400">Provider</p>
                          <p className="font-semibold text-slate-800">
                            {getProviderName(booking)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarDays
                          size={18}
                          className="mt-0.5 text-indigo-500"
                        />
                        <div>
                          <p className="text-xs text-slate-400">
                            Service & Date
                          </p>
                          <p className="font-semibold text-slate-800">
                            {getServiceName(booking)}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDateTime(booking.bookingDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Tags size={18} className="mt-0.5 text-violet-500" />
                        <div>
                          <p className="text-xs text-slate-400">
                            Service Category
                          </p>
                          <p className="font-semibold text-slate-800">
                            {getCategoryName(booking)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin size={18} className="mt-0.5 text-indigo-500" />
                        <div>
                          <p className="text-xs text-slate-400">Location</p>
                          <p className="text-sm font-medium text-slate-700">
                            {getLocation(booking)}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-slate-500">
                            Booking Amount
                          </span>
                          <span className="flex items-center font-bold text-slate-900">
                            <IndianRupee size={16} />
                            {getPrice(booking).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-sm text-slate-500">
                            Booking Result
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${outcome.className}`}
                          >
                            {outcome.label}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-sm text-slate-500">
                            Payment Mode
                          </span>
                          <span className="flex items-center gap-1.5 text-right text-xs font-semibold text-slate-700">
                            <MethodIcon size={14} />
                            {method.label}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-sm text-slate-500">
                            Payment Status
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${payment.className}`}
                          >
                            {payment.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          navigate(`/admin/bookings/${booking._id}`)
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                      <div className="relative">
                        <button
                          disabled={isUpdating}
                          onClick={() =>
                            setStatusMenuId(
                              statusMenuId === booking._id ? null : booking._id,
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                          Status
                        </button>
                        {statusMenuId === booking._id && (
                          <div className="absolute bottom-full left-0 z-30 mb-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                            {ADMIN_STATUS_OPTIONS.map((status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  updateStatus(booking._id, status)
                                }
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 ${booking.status === status ? "bg-indigo-50 text-indigo-700" : "text-slate-700"}`}
                              >
                                {formatStatus(status)}
                                {booking.status === status && (
                                  <CheckCircle size={14} />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {!["completed", "cancelled", "rejected"].includes(
                      booking.status,
                    ) && (
                      <button
                        disabled={isUpdating}
                        onClick={() => cancelBooking(booking._id)}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Ban size={16} />
                        {isUpdating ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManageBookings;
