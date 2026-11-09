import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  CalendarDays,
  UserCheck,
  CreditCard,
  Star,
  Settings,
  Search,
  Filter,
  ChevronDown,
  Circle,
  RefreshCw,
  Loader2,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";

import API from "../services/api";

function AdminNotifications() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [filter, setFilter] = useState("All");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  // =====================================================
  // FETCH ADMIN NOTIFICATIONS
  // =====================================================

  const fetchNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = {};

      // Search
      if (search.trim()) {
        params.search = search.trim();
      }

      // Read / unread
      if (filter === "Read") {
        params.status = "read";
      }

      if (filter === "Unread") {
        params.status = "unread";
      }

      // Notification type
      if (category !== "All") {
        params.type = category;
      }

      const response = await API.get("/notifications/admin/all", {
        params,
      });

      setNotifications(response.data?.notifications || []);
    } catch (err) {
      console.error("Fetch Admin Notifications Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/admin/login");
        return;
      }

      if (err.response?.status === 403) {
        setError("Access denied. Only administrators can view notifications.");
        return;
      }

      setError(err.response?.data?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchNotifications();
  }, []);

  // =====================================================
  // RELOAD WHEN FILTERS CHANGE
  // =====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, filter, category]);

  // =====================================================
  // COUNTS
  // =====================================================

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  const readCount = notifications.filter(
    (notification) => notification.isRead,
  ).length;

  const bookingCount = notifications.filter(
    (notification) => notification.type === "booking",
  ).length;

  const providerCount = notifications.filter(
    (notification) => notification.type === "provider",
  ).length;

  const reviewCount = notifications.filter(
    (notification) => notification.type === "review",
  ).length;

  const paymentCount = notifications.filter(
    (notification) => notification.type === "payment",
  ).length;

  // =====================================================
  // TYPE CONFIG
  // =====================================================

  const getTypeConfig = (type) => {
    switch (type) {
      case "booking":
        return {
          label: "Booking",
          icon: CalendarDays,
          wrapper: "bg-blue-50 text-blue-600",
        };

      case "provider":
        return {
          label: "Provider",
          icon: UserCheck,
          wrapper: "bg-violet-50 text-violet-600",
        };

      case "review":
        return {
          label: "Review",
          icon: Star,
          wrapper: "bg-amber-50 text-amber-600",
        };

      case "payment":
        return {
          label: "Payment",
          icon: CreditCard,
          wrapper: "bg-emerald-50 text-emerald-600",
        };

      case "system":
        return {
          label: "System",
          icon: Settings,
          wrapper: "bg-slate-100 text-slate-600",
        };

      case "other":
        return {
          label: "Other",
          icon: MoreHorizontal,
          wrapper: "bg-slate-100 text-slate-600",
        };

      default:
        return {
          label: "Notification",
          icon: Bell,
          wrapper: "bg-slate-100 text-slate-600",
        };
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "Unknown date";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown date";
    }

    return parsedDate.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // =====================================================
  // TIME AGO
  // =====================================================

  const getTimeAgo = (date) => {
    if (!date) {
      return "";
    }

    const created = new Date(date).getTime();

    if (Number.isNaN(created)) {
      return "";
    }

    const now = Date.now();

    const difference = Math.floor((now - created) / 1000);

    if (difference < 60) {
      return "Just now";
    }

    const minutes = Math.floor(difference / 60);

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    }

    return new Date(date).toLocaleDateString("en-IN");
  };

  // =====================================================
  // MARK ONE AS READ
  // =====================================================

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/admin/${id}/read`);

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );
    } catch (err) {
      console.error("Mark Notification Read Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/admin/login");
        return;
      }

      alert(
        err.response?.data?.message || "Unable to mark notification as read.",
      );
    }
  };

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  const markAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      await API.put("/notifications/admin/read-all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
    } catch (err) {
      console.error("Mark All Notifications Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/admin/login");
        return;
      }

      alert(
        err.response?.data?.message || "Unable to mark notifications as read.",
      );
    }
  };

  // =====================================================
  // DELETE NOTIFICATION
  // =====================================================

  const deleteNotification = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this notification?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(`/notifications/admin/${id}`);

      setNotifications((current) =>
        current.filter((notification) => notification._id !== id),
      );
    } catch (err) {
      console.error("Delete Notification Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/admin/login");
        return;
      }

      alert(err.response?.data?.message || "Unable to delete notification.");
    }
  };

  // =====================================================
  // VIEW NOTIFICATION
  // =====================================================

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Booking notification
    if (notification.booking?._id) {
      navigate(`/admin/bookings/${notification.booking._id}`);
      return;
    }

    // Provider notification
    if (notification.provider?._id) {
      navigate(`/admin/providers/${notification.provider._id}`);
      return;
    }

    // User notification
    if (notification.user?._id) {
      navigate(`/admin/users/${notification.user._id}`);
      return;
    }

    // No related resource
    return;
  };

  // =====================================================
  // CLIENT-SIDE FILTER
  // =====================================================

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const searchText = search.toLowerCase();

      const title = notification.title || "";

      const message = notification.message || "";

      const userName = notification.user?.name || "";

      const userEmail = notification.user?.email || "";

      const matchesSearch =
        title.toLowerCase().includes(searchText) ||
        message.toLowerCase().includes(searchText) ||
        userName.toLowerCase().includes(searchText) ||
        userEmail.toLowerCase().includes(searchText);

      const matchesFilter =
        filter === "All" ||
        (filter === "Unread" && !notification.isRead) ||
        (filter === "Read" && notification.isRead);

      const matchesCategory =
        category === "All" || notification.type === category;

      return matchesSearch && matchesFilter && matchesCategory;
    });
  }, [notifications, search, filter, category]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto animate-spin text-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  Notifications
                </h1>

                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-500">
                Stay updated with FIXNEAR activity
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 sm:flex">
            <BellRing size={18} />
            Admin Alerts
          </div>
        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertTriangle size={20} />

            <p className="flex-1 text-sm font-medium">{error}</p>

            <button
              onClick={() => fetchNotifications(true)}
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Notifications"
            value={notifications.length}
            icon={<Bell size={21} />}
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Unread"
            value={unreadCount}
            icon={<BellRing size={21} />}
            iconClass="bg-red-50 text-red-600"
          />

          <StatCard
            title="Read"
            value={readCount}
            icon={<CheckCheck size={21} />}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Provider Alerts"
            value={providerCount}
            icon={<UserCheck size={21} />}
            iconClass="bg-violet-50 text-violet-600"
          />
        </div>

        {/* =================================================
            TYPE SUMMARY
        ================================================= */}

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat
            label="Bookings"
            value={bookingCount}
            icon={<CalendarDays size={17} />}
          />

          <MiniStat
            label="Providers"
            value={providerCount}
            icon={<UserCheck size={17} />}
          />

          <MiniStat
            label="Reviews"
            value={reviewCount}
            icon={<Star size={17} />}
          />

          <MiniStat
            label="Payments"
            value={paymentCount}
            icon={<CreditCard size={17} />}
          />
        </div>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
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
                placeholder="Search notifications, users, email..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {/* READ FILTER */}

              <div className="relative">
                <Filter
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-40"
                >
                  <option value="All">All</option>

                  <option value="Unread">Unread</option>

                  <option value="Read">Read</option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {/* TYPE FILTER */}

              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-48"
                >
                  <option value="All">All Types</option>

                  <option value="booking">Bookings</option>

                  <option value="provider">Providers</option>

                  <option value="review">Reviews</option>

                  <option value="payment">Payments</option>

                  <option value="system">System</option>

                  <option value="other">Other</option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {/* REFRESH */}

              <button
                onClick={() => fetchNotifications(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>

              {/* MARK ALL */}

              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCheck size={17} />
                Mark all read
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            LIST HEADING
        ================================================= */}

        <div className="mt-6 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Notification Center
            </h2>

            <p className="text-sm text-slate-500">
              Showing {filteredNotifications.length} notifications
            </p>
          </div>
        </div>

        {/* =================================================
            NOTIFICATION LIST
        ================================================= */}

        <div className="mt-4 space-y-3">
          {filteredNotifications.map((notification) => {
            const config = getTypeConfig(notification.type);

            const Icon = config.icon;

            return (
              <div
                key={notification._id}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition sm:p-5 ${
                  notification.isRead
                    ? "border-slate-200"
                    : "border-blue-200 bg-blue-50/30"
                }`}
              >
                <div className="flex gap-3 sm:gap-4">
                  {/* ICON */}

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.wrapper}`}
                  >
                    <Icon size={21} />
                  </div>

                  {/* CONTENT */}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                          )}

                          <h3
                            className={`font-semibold ${
                              notification.isRead
                                ? "text-slate-800"
                                : "text-slate-900"
                            }`}
                          >
                            {notification.title || "Notification"}
                          </h3>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            {config.label}
                          </span>
                        </div>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                          {notification.message || "No message available."}
                        </p>

                        {/* USER */}

                        {notification.user && (
                          <div className="mt-2 text-xs text-slate-400">
                            User:{" "}
                            <span className="font-medium text-slate-600">
                              {notification.user.name || "Unknown User"}
                            </span>
                            {notification.user.email && (
                              <> · {notification.user.email}</>
                            )}
                            {notification.user.role && (
                              <>
                                {" "}
                                ·{" "}
                                <span className="capitalize">
                                  {notification.user.role}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <span className="shrink-0 text-xs text-slate-400">
                        {getTimeAgo(notification.createdAt)}
                      </span>
                    </div>

                    {/* BOTTOM */}

                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Circle size={11} className="fill-current" />

                        {formatDate(notification.createdAt)}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* VIEW */}

                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          View
                        </button>

                        {/* MARK READ */}

                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <Check size={14} />
                            Mark read
                          </button>
                        )}

                        {/* DELETE */}

                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {filteredNotifications.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Bell size={42} className="mx-auto text-slate-300" />

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No notifications found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-amber-500"
            />

            <div>
              <h3 className="font-semibold text-slate-900">
                Notification center
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Notifications shown here are loaded directly from the FIXNEAR
                backend. Administrators can search, filter, mark notifications
                as read, view related records, and delete notifications.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ======================================================
// STAT CARD
// ======================================================

function StatCard({ title, value, icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>{icon}</div>
      </div>
    </div>
  );
}

// ======================================================
// MINI STAT
// ======================================================

function MiniStat({ label, value, icon }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</div>

      <div>
        <p className="text-xs text-slate-500">{label}</p>

        <p className="text-lg font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default AdminNotifications;
