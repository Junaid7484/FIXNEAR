import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  MapPin,
  IndianRupee,
  Wrench,
  User,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ClipboardList,
  Search,
  XCircle,
  Loader2,
  CheckCircle2,
  Star,
  Heart,
  CreditCard,
  ListFilter,
  PackageCheck,
  Ban,
  Hourglass,
} from "lucide-react";
import API from "../services/api";

const normalizeStatus = (value) =>
  String(value || "pending")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

const normalizePayment = (value) =>
  String(value || "pending")
    .trim()
    .toLowerCase();

const isOnline = (booking) =>
  normalizePayment(booking?.paymentMethod) === "online";

const isPaid = (booking) => normalizePayment(booking?.paymentStatus) === "paid";

const isIncompleteOnlinePayment = (booking) =>
  isOnline(booking) && !isPaid(booking);

const isCancelledOrRejected = (booking) =>
  ["cancelled", "rejected"].includes(normalizeStatus(booking?.status));

const isSuccessfulBooking = (booking) =>
  !isIncompleteOnlinePayment(booking) &&
  normalizeStatus(booking?.status) !== "pending_payment";

const getId = (value) =>
  typeof value === "object" ? value?._id || value?.id : value;

function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [reviewedBookingIds, setReviewedBookingIds] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected tab controls which booking list is displayed.
  const [activeTab, setActiveTab] = useState("all");

  const [cancellingId, setCancellingId] = useState(null);
  const [favoriteLoadingId, setFavoriteLoadingId] = useState(null);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  }, [navigate]);

  const fetchBookings = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        setError("");

        const response = await API.get("/bookings/my");
        const data = response?.data;

        const received = Array.isArray(data)
          ? data
          : Array.isArray(data?.bookings)
            ? data.bookings
            : Array.isArray(data?.data?.bookings)
              ? data.data.bookings
              : Array.isArray(data?.data)
                ? data.data
                : [];

        setBookings(received);
      } catch (err) {
        console.error("Fetch My Bookings Error:", err);

        if (err?.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        setError(
          err?.response?.data?.message || "Failed to load your bookings.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [handleUnauthorized],
  );

  const fetchMyReviews = useCallback(async () => {
    try {
      const response = await API.get("/reviews/my");
      const data = response?.data;

      const reviews = Array.isArray(data)
        ? data
        : Array.isArray(data?.reviews)
          ? data.reviews
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setReviewedBookingIds(
        reviews
          .map((review) => getId(review?.booking))
          .filter(Boolean)
          .map(String),
      );
    } catch (err) {
      console.error("Fetch My Reviews Error:", err);
      setReviewedBookingIds([]);
    }
  }, []);

  const getFavoriteDetails = (booking) => {
    const providerId = getId(booking?.provider);
    const providerServiceId = getId(booking?.providerService);

    return providerId && providerServiceId
      ? {
          providerId: String(providerId),
          providerServiceId: String(providerServiceId),
        }
      : null;
  };

  const getFavoriteKey = (booking) => {
    const details = getFavoriteDetails(booking);

    return details
      ? `${details.providerId}:${details.providerServiceId}`
      : null;
  };

  const fetchMyFavorites = useCallback(async () => {
    try {
      const response = await API.get("/favorites");
      const data = response?.data;

      const favorites = Array.isArray(data)
        ? data
        : Array.isArray(data?.favorites)
          ? data.favorites
          : Array.isArray(data?.data)
            ? data.data
            : [];

      const keys = favorites
        .map((favorite) => {
          const providerId = getId(favorite?.provider);
          const providerServiceId = getId(favorite?.providerService);

          return providerId && providerServiceId
            ? `${providerId}:${providerServiceId}`
            : null;
        })
        .filter(Boolean);

      setFavoriteItems(new Set(keys));
    } catch (err) {
      console.error("Fetch Favorites Error:", err);

      if (err?.response?.status === 401) {
        handleUnauthorized();
      }
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    fetchBookings();
    fetchMyReviews();
    fetchMyFavorites();
  }, [fetchBookings, fetchMyReviews, fetchMyFavorites]);

  const getServiceName = (booking) =>
    booking?.service?.name ||
    booking?.service?.title ||
    booking?.providerService?.service?.name ||
    booking?.providerService?.service?.title ||
    booking?.serviceName ||
    "Service";

  const getServiceCategory = (booking) =>
    booking?.service?.category || booking?.serviceCategory || "";

  const getProviderName = (booking) => {
    const provider = booking?.provider;

    return (
      (provider && typeof provider === "object"
        ? provider?.businessName ||
          provider?.name ||
          provider?.user?.name ||
          provider?.user?.fullName ||
          provider?.user?.username
        : booking?.providerName) || "Provider not assigned"
    );
  };

  const getProviderImage = (booking) => {
    const provider = booking?.provider;

    if (!provider || typeof provider !== "object") return "";

    return (
      provider?.profileImage?.url ||
      provider?.profileImage ||
      provider?.user?.profileImage?.url ||
      provider?.user?.profileImage ||
      ""
    );
  };

  const getPrice = (booking) => {
    const amount = Number(
      booking?.price ?? booking?.providerService?.price ?? 0,
    );

    return Number.isFinite(amount) ? amount : 0;
  };

  const formatPrice = (amount) => Number(amount || 0).toLocaleString("en-IN");

  const formatDateValue = (
    value,
    options = {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ) => {
    if (!value || Number.isNaN(new Date(value).getTime())) {
      return "Not specified";
    }

    return new Date(value).toLocaleDateString("en-IN", options);
  };

  const formatBookingTime = (booking) => {
    if (
      !booking?.bookingDate ||
      Number.isNaN(new Date(booking.bookingDate).getTime())
    ) {
      return "Not specified";
    }

    return new Date(booking.bookingDate).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getLocation = (booking) =>
    [booking?.address, booking?.city, booking?.state]
      .filter(Boolean)
      .join(", ");

  const canCancel = (status) =>
    ["pending", "accepted", "confirmed"].includes(normalizeStatus(status));

  const isReviewed = (id) =>
    Boolean(id && reviewedBookingIds.includes(String(id)));

  const toggleFavorite = async (booking) => {
    const details = getFavoriteDetails(booking);
    const key = getFavoriteKey(booking);

    if (!details || !key || favoriteLoadingId) return;

    const currentlyFavorite = favoriteItems.has(key);

    try {
      setFavoriteLoadingId(booking._id);

      if (currentlyFavorite) {
        await API.delete(
          `/favorites/${details.providerId}/${details.providerServiceId}`,
        );

        setFavoriteItems((old) => {
          const next = new Set(old);
          next.delete(key);
          return next;
        });
      } else {
        await API.post("/favorites", {
          provider: details.providerId,
          providerService: details.providerServiceId,
        });

        setFavoriteItems((old) => new Set(old).add(key));
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      alert(
        err?.response?.data?.message ||
          "Unable to update favorite. Please try again.",
      );
    } finally {
      setFavoriteLoadingId(null);
    }
  };

  const handleCancelBooking = async (booking) => {
    if (
      !booking?._id ||
      !window.confirm("Are you sure you want to cancel this booking?")
    ) {
      return;
    }

    try {
      setCancellingId(booking._id);
      setError("");

      await API.put(`/bookings/${booking._id}/cancel`, {
        cancellationReason: "Cancelled by customer",
      });

      await fetchBookings(true);
    } catch (err) {
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      alert(err?.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  // Separate incomplete online payment attempts from regular bookings.
  const incompletePayments = useMemo(
    () =>
      bookings
        .filter(isIncompleteOnlinePayment)
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.bookingDate || 0) -
            new Date(a.createdAt || a.bookingDate || 0),
        ),
    [bookings],
  );

  const regularBookings = useMemo(
    () => bookings.filter(isSuccessfulBooking),
    [bookings],
  );

  const confirmedBookings = useMemo(
    () =>
      regularBookings.filter(
        (booking) => normalizeStatus(booking.status) === "confirmed",
      ),
    [regularBookings],
  );

  const otherBookings = useMemo(
    () =>
      regularBookings.filter((booking) =>
        ["pending", "accepted", "in-progress"].includes(
          normalizeStatus(booking.status),
        ),
      ),
    [regularBookings],
  );

  const completedBookings = useMemo(
    () =>
      regularBookings.filter(
        (booking) => normalizeStatus(booking.status) === "completed",
      ),
    [regularBookings],
  );

  const cancelledBookings = useMemo(
    () => regularBookings.filter(isCancelledOrRejected),
    [regularBookings],
  );

  const bookingStats = useMemo(
    () => ({
      total: regularBookings.length,
      confirmed: confirmedBookings.length,
      other: otherBookings.length,
      completed: completedBookings.length,
      cancelled: cancelledBookings.length,
      incomplete: incompletePayments.length,
    }),
    [
      regularBookings,
      confirmedBookings,
      otherBookings,
      completedBookings,
      cancelledBookings,
      incompletePayments,
    ],
  );

  // The selected tab determines the source list.
  const activeBookings = useMemo(() => {
    switch (activeTab) {
      case "confirmed":
        return confirmedBookings;
      case "other":
        return otherBookings;
      case "completed":
        return completedBookings;
      case "cancelled":
        return cancelledBookings;
      case "payments":
        return [];
      case "all":
      default:
        return regularBookings;
    }
  }, [
    activeTab,
    regularBookings,
    confirmedBookings,
    otherBookings,
    completedBookings,
    cancelledBookings,
  ]);

  const filteredBookings = useMemo(() => {
    const value = search.trim().toLowerCase();

    return activeBookings.filter((booking) => {
      const status = normalizeStatus(booking?.status);

      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      if (!value) return true;

      return [
        getServiceName(booking),
        getProviderName(booking),
        booking?._id,
        booking?.city,
        booking?.address,
      ].some((item) =>
        String(item || "")
          .toLowerCase()
          .includes(value),
      );
    });
  }, [activeBookings, search, statusFilter]);

  const getStatusClass = (status) => {
    switch (normalizeStatus(status)) {
      case "confirmed":
        return "bg-green-50 text-green-700 border-green-200";
      case "accepted":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelled":
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "in-progress":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status) => {
    const value = normalizeStatus(status);

    if (["completed", "confirmed", "accepted"].includes(value)) {
      return CheckCircle2;
    }

    if (["cancelled", "rejected"].includes(value)) {
      return XCircle;
    }

    if (value === "in-progress") return Loader2;

    return Clock;
  };

  const formatStatus = (status) =>
    String(status || "Pending")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearch("");
    setStatusFilter("all");
  };

  const tabs = [
    {
      id: "all",
      label: "All Orders",
      count: bookingStats.total,
      icon: ClipboardList,
    },
    {
      id: "confirmed",
      label: "Confirmed Orders",
      count: bookingStats.confirmed,
      icon: PackageCheck,
    },
    {
      id: "other",
      label: "Other Bookings",
      count: bookingStats.other,
      icon: Hourglass,
    },
    {
      id: "completed",
      label: "Completed",
      count: bookingStats.completed,
      icon: CheckCircle2,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      count: bookingStats.cancelled,
      icon: Ban,
    },
    {
      id: "payments",
      label: "Incomplete Payments",
      count: bookingStats.incomplete,
      icon: CreditCard,
    },
  ];

  const tabDescription = {
    all: "View every regular service booking in one place.",
    confirmed: "These bookings have been confirmed.",
    other: "Bookings waiting for action or currently in progress.",
    completed: "Your successfully completed service bookings.",
    cancelled: "Cancelled or rejected service bookings.",
    payments: "Online payment attempts that have not been marked as paid.",
  };

  const renderIncompletePayment = (booking) => (
    <article
      key={booking._id}
      className="bg-white border border-red-200 rounded-2xl p-5 sm:p-6 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <CreditCard size={22} />
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900">
              {getServiceName(booking)}
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Booking ID: <span className="break-all">{booking._id}</span>
            </p>

            <p className="text-sm text-red-700 font-semibold mt-2">
              Online payment not completed or verified
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Payment status: {booking.paymentStatus || "pending"}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-2 self-start rounded-full bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 text-xs font-semibold">
          <AlertCircle size={14} />
          Payment Incomplete
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
        <p className="text-sm text-slate-600">
          <CalendarDays size={16} className="inline mr-2 text-blue-600" />
          {formatDateValue(booking.bookingDate)}
        </p>

        <p className="text-sm text-slate-600">
          <IndianRupee size={16} className="inline mr-1 text-green-600" />
          {formatPrice(getPrice(booking))}
        </p>

        <p className="text-sm text-slate-600">
          <MapPin size={16} className="inline mr-2 text-blue-600" />
          {booking.city || booking.address || "Location not specified"}
        </p>
      </div>

      <div className="mt-5 flex justify-end">
        <Link
          to={`/booking-details/${booking._id}`}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          View Payment Details
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={30} />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Unable to load bookings
          </h2>

          <p className="text-slate-500 mt-2">{error}</p>

          <button
            onClick={() => fetchBookings()}
            className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium"
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
            <ClipboardList size={16} />
            FIXNEAR BOOKINGS
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mt-5">My Bookings</h1>

          <p className="text-slate-300 mt-2 max-w-2xl">
            Track confirmed orders, manage upcoming services, and review your
            booking history.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && bookings.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-sm">{error}</p>

            <button
              onClick={() => fetchBookings(true)}
              className="text-sm font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Page heading and new booking button */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-7">
          <div>
            <p className="text-sm text-slate-500">
              {bookings.length} total record
              {bookings.length === 1 ? "" : "s"}
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Your Service Orders
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                fetchBookings(true);
                fetchMyFavorites();
                fetchMyReviews();
              }}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
            >
              Book New Service
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            {
              label: "All Orders",
              count: bookingStats.total,
              color: "text-slate-900",
            },
            {
              label: "Confirmed",
              count: bookingStats.confirmed,
              color: "text-green-600",
            },
            {
              label: "Other Bookings",
              count: bookingStats.other,
              color: "text-blue-600",
            },
            {
              label: "Completed",
              count: bookingStats.completed,
              color: "text-emerald-600",
            },
            {
              label: "Cancelled",
              count: bookingStats.cancelled,
              color: "text-red-600",
            },
            {
              label: "Payment Incomplete",
              count: bookingStats.incomplete,
              color: "text-orange-600",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
            >
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.color}`}>
                {item.count}
              </p>
            </div>
          ))}
        </div>

        {/* CLICKABLE ORDER TABS */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-7 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ListFilter size={19} className="text-blue-600" />

            <h2 className="text-lg font-bold text-slate-900">
              Order Categories
            </h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const selected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => changeTab(tab.id)}
                  aria-pressed={selected}
                  className={`shrink-0 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    selected
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                      : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <TabIcon size={17} />
                  <span>{tab.label}</span>

                  <span
                    className={`min-w-6 h-6 px-1.5 rounded-full inline-flex items-center justify-center text-xs ${
                      selected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-sm text-slate-500 mt-3">
            {tabDescription[activeTab]}
          </p>
        </section>

        {/* Selected tab heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {activeTab === "payments"
                ? `${incompletePayments.length} incomplete payment attempt${incompletePayments.length === 1 ? "" : "s"}`
                : `${filteredBookings.length} of ${activeBookings.length} booking${activeBookings.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {/* Search and status filters: only for regular booking tabs */}
        {activeTab !== "payments" && activeBookings.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-7">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search service, provider, city or booking ID..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="md:w-56 px-4 py-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter bookings by status"
              >
                <option value="all">All statuses in this tab</option>
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
        )}

        {/* INCOMPLETE PAYMENT TAB */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            {incompletePayments.length > 0 ? (
              incompletePayments.map(renderIncompletePayment)
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={30} className="text-emerald-600" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 mt-5">
                  No incomplete payments
                </h3>

                <p className="text-slate-500 mt-2">
                  You don't have any unpaid or unverified online payment
                  attempts in your booking records.
                </p>

                <button
                  type="button"
                  onClick={() => changeTab("all")}
                  className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold"
                >
                  View All Orders
                </button>
              </div>
            )}
          </div>
        )}

        {/* REGULAR BOOKING TABS */}
        {activeTab !== "payments" && (
          <>
            {bookings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 sm:p-16 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <ClipboardList size={34} className="text-slate-400" />
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mt-6">
                  No bookings yet
                </h3>

                <p className="text-slate-500 mt-2">
                  You haven't booked any services yet. Find a trusted
                  professional and book your first service.
                </p>

                <Link
                  to="/services"
                  className="mt-7 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
                >
                  Browse Services
                  <ArrowRight size={18} />
                </Link>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
                <Search size={40} className="mx-auto text-slate-300" />

                <h3 className="text-xl font-bold text-slate-900 mt-4">
                  No matching bookings
                </h3>

                <p className="text-slate-500 mt-2">
                  There are no bookings in this category matching your search or
                  status filter.
                </p>

                <div className="flex flex-wrap justify-center gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                    }}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl"
                  >
                    Clear Filters
                  </button>

                  {activeTab !== "all" && (
                    <button
                      type="button"
                      onClick={() => changeTab("all")}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                    >
                      View All Orders
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredBookings.map((booking) => {
                  const serviceName = getServiceName(booking);
                  const category = getServiceCategory(booking);
                  const providerName = getProviderName(booking);
                  const image = getProviderImage(booking);
                  const price = getPrice(booking);
                  const status = normalizeStatus(booking.status);
                  const location = getLocation(booking);
                  const StatusIcon = getStatusIcon(status);
                  const completed = status === "completed";
                  const favoriteKey = getFavoriteKey(booking);
                  const favorite =
                    favoriteKey && favoriteItems.has(favoriteKey);
                  const details = getFavoriteDetails(booking);
                  const updatingFavorite = favoriteLoadingId === booking._id;
                  const reviewed = isReviewed(booking._id);

                  return (
                    <article
                      key={booking._id}
                      className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden"
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                              {image ? (
                                <img
                                  src={image}
                                  alt={providerName}
                                  className="w-full h-full object-cover"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <Wrench size={22} />
                              )}
                            </div>

                            <div className="min-w-0">
                              <h3 className="text-lg font-bold text-slate-900">
                                {serviceName}
                              </h3>

                              {category && (
                                <p className="text-xs text-blue-600 font-medium mt-1">
                                  {category}
                                </p>
                              )}

                              <p className="text-sm text-slate-500 mt-1">
                                Booking ID:{" "}
                                <span className="font-medium break-all">
                                  {booking._id}
                                </span>
                              </p>

                              {isOnline(booking) && isPaid(booking) && (
                                <p className="text-xs text-emerald-700 mt-1 font-semibold">
                                  Online payment verified
                                </p>
                              )}
                            </div>
                          </div>

                          <span
                            className={`self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusClass(status)}`}
                          >
                            <StatusIcon
                              size={14}
                              className={
                                status === "in-progress" ? "animate-spin" : ""
                              }
                            />
                            {formatStatus(status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100">
                          <div className="flex items-start gap-3">
                            <CalendarDays
                              size={18}
                              className="text-blue-600 mt-0.5 shrink-0"
                            />
                            <div>
                              <p className="text-xs text-slate-400">Date</p>
                              <p className="text-sm font-semibold text-slate-700 mt-1">
                                {formatDateValue(booking.bookingDate)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Clock
                              size={18}
                              className="text-blue-600 mt-0.5 shrink-0"
                            />
                            <div>
                              <p className="text-xs text-slate-400">Time</p>
                              <p className="text-sm font-semibold text-slate-700 mt-1">
                                {formatBookingTime(booking)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <User
                              size={18}
                              className="text-blue-600 mt-0.5 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs text-slate-400">Provider</p>
                              <p className="text-sm font-semibold text-slate-700 mt-1 break-words">
                                {providerName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <IndianRupee
                              size={18}
                              className="text-green-600 mt-0.5 shrink-0"
                            />
                            <div>
                              <p className="text-xs text-slate-400">Amount</p>
                              <p className="text-sm font-semibold text-slate-700 mt-1">
                                ₹{formatPrice(price)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {location && (
                          <div className="flex items-start gap-3 mt-5">
                            <MapPin
                              size={18}
                              className="text-blue-600 mt-0.5 shrink-0"
                            />
                            <div>
                              <p className="text-xs text-slate-400">
                                Service Location
                              </p>
                              <p className="text-sm text-slate-600 mt-1">
                                {location}
                              </p>
                            </div>
                          </div>
                        )}

                        {booking.notes && (
                          <div className="mt-4 bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-slate-400">
                              Booking Notes
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              {booking.notes}
                            </p>
                          </div>
                        )}

                        {booking.cancellationReason && (
                          <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
                            <p className="text-xs text-red-500 font-medium">
                              Cancellation Reason
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                              {booking.cancellationReason}
                            </p>
                          </div>
                        )}

                        {booking.createdAt && (
                          <p className="text-xs text-slate-400 mt-5">
                            Booking created on{" "}
                            {formatDateValue(booking.createdAt)}
                          </p>
                        )}

                        {/* Booking actions */}
                        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-3">
                          <Link
                            to={`/booking-details/${booking._id}`}
                            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                          >
                            View Booking
                            <ArrowRight size={16} />
                          </Link>

                          {canCancel(status) && (
                            <button
                              type="button"
                              onClick={() => handleCancelBooking(booking)}
                              disabled={cancellingId === booking._id}
                              className="inline-flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                            >
                              {cancellingId === booking._id ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <XCircle size={16} />
                                  Cancel Booking
                                </>
                              )}
                            </button>
                          )}

                          {completed && (
                            <button
                              type="button"
                              onClick={() => toggleFavorite(booking)}
                              disabled={updatingFavorite || !details}
                              className={`inline-flex items-center justify-center gap-2 border px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 ${
                                favorite
                                  ? "border-red-200 bg-red-50 text-red-600"
                                  : "border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600"
                              }`}
                            >
                              {updatingFavorite ? (
                                <Loader2 size={17} className="animate-spin" />
                              ) : (
                                <Heart
                                  size={17}
                                  className={
                                    favorite ? "fill-red-500 text-red-500" : ""
                                  }
                                />
                              )}

                              {updatingFavorite
                                ? "Updating..."
                                : favorite
                                  ? "Remove Favourite"
                                  : "Make Favourite"}
                            </button>
                          )}

                          {completed && !reviewed && (
                            <Link
                              to={`/review/${booking._id}`}
                              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
                            >
                              <Star size={16} fill="currentColor" />
                              Write Review
                            </Link>
                          )}

                          {completed && reviewed && (
                            <span className="inline-flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-2.5 rounded-xl text-sm font-semibold">
                              <CheckCircle2 size={16} />
                              Reviewed
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Bottom refresh */}
        {bookings.length > 0 && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                fetchBookings(true);
                fetchMyFavorites();
                fetchMyReviews();
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh Bookings"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default MyBookings;
