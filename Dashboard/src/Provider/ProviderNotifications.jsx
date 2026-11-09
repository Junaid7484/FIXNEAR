import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Loader2,
  RefreshCw,
  Trash2,
  AlertCircle,
  CalendarDays,
  MessageSquare,
  Star,
  Info,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

const ProviderNotifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------------------
  // FETCH NOTIFICATIONS
  // -----------------------------------------

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      // Backend route:
      // GET /api/notifications/my
      const response = await API.get("/notifications/my");

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Provider Notifications Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // MARK ONE AS READ
  // -----------------------------------------

  const markAsRead = async (notificationId) => {
    try {
      setActionLoading(true);
      setError("");

      const response = await API.put(
        `/notifications/${notificationId}/read`
      );

      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? {
                  ...notification,
                  isRead: true,
                }
              : notification
          )
        );
      }
    } catch (err) {
      console.error(
        "Mark Notification Read Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to mark notification as read."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // -----------------------------------------
  // MARK ALL AS READ
  // -----------------------------------------

  const markAllAsRead = async () => {
    try {
      setActionLoading(true);
      setError("");

      // Backend route:
      // PUT /api/notifications/read-all
      const response = await API.put(
        "/notifications/read-all"
      );

      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            isRead: true,
          }))
        );
      }
    } catch (err) {
      console.error(
        "Mark All Notifications Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to mark all notifications as read."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // -----------------------------------------
  // DELETE NOTIFICATION
  // -----------------------------------------

  const deleteNotification = async (notificationId) => {
    try {
      setActionLoading(true);
      setError("");

      // Backend route:
      // DELETE /api/notifications/:id
      const response = await API.delete(
        `/notifications/${notificationId}`
      );

      if (response.data.success) {
        setNotifications((prev) =>
          prev.filter(
            (notification) =>
              notification._id !== notificationId
          )
        );
      }
    } catch (err) {
      console.error(
        "Delete Notification Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete notification."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // -----------------------------------------
  // INITIAL LOAD
  // -----------------------------------------

  useEffect(() => {
    fetchNotifications();
  }, []);

  // -----------------------------------------
  // NOTIFICATION ICON
  // -----------------------------------------

  const getNotificationIcon = (type) => {
    switch (type) {
      case "booking":
      case "booking_created":
      case "booking_accepted":
      case "booking_rejected":
      case "booking_completed":
        return <CalendarDays className="w-5 h-5" />;

      case "review":
        return <Star className="w-5 h-5" />;

      case "message":
        return <MessageSquare className="w-5 h-5" />;

      case "success":
        return <Check className="w-5 h-5" />;

      case "warning":
        return <AlertCircle className="w-5 h-5" />;

      default:
        return <Info className="w-5 h-5" />;
    }
  };

  // -----------------------------------------
  // NOTIFICATION COLOR
  // -----------------------------------------

  const getNotificationColor = (type) => {
    switch (type) {
      case "booking":
      case "booking_created":
      case "booking_accepted":
        return "bg-blue-50 text-blue-600";

      case "booking_rejected":
      case "warning":
        return "bg-red-50 text-red-600";

      case "booking_completed":
      case "success":
        return "bg-emerald-50 text-emerald-600";

      case "review":
        return "bg-amber-50 text-amber-600";

      case "message":
        return "bg-purple-50 text-purple-600";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  // -----------------------------------------
  // DATE FORMAT
  // -----------------------------------------

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // -----------------------------------------
  // COUNTS
  // -----------------------------------------

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  // -----------------------------------------
  // LOADING
  // -----------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />

          <h2 className="text-lg font-semibold text-slate-800">
            Loading notifications...
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Fetching your latest notifications
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------
  // MAIN UI
  // -----------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="h-16 flex items-center justify-between">

            <div className="flex items-center gap-4">

              <Link
                to="/provider/dashboard"
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </Link>

              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Notifications
                </h1>

                <p className="text-xs text-slate-500">
                  Stay updated with your account
                </p>
              </div>

            </div>

            <button
              onClick={fetchNotifications}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

          </div>

        </div>

      </header>

      {/* MAIN */}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">

            <AlertCircle className="w-5 h-5 text-red-600" />

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* PAGE HEADING */}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">

          <div>

            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
              Updates
            </p>

            <h2 className="text-3xl font-bold text-slate-900 mt-1">
              Your Notifications
            </h2>

            <p className="text-slate-500 mt-2">
              Important updates about your bookings and services.
            </p>

          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}

        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Total Notifications
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {notifications.length}
                </p>
              </div>

            </div>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Unread
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {unreadCount}
                </p>
              </div>

            </div>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCheck className="w-5 h-5 text-emerald-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Read
                </p>

                <p className="text-2xl font-bold text-slate-900">
                  {notifications.length - unreadCount}
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* NOTIFICATIONS */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-200">

            <h3 className="text-lg font-bold text-slate-900">
              Recent Notifications
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Your latest account updates
            </p>

          </div>

          {notifications.length === 0 ? (

            <div className="py-20 text-center px-6">

              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">

                <Bell className="w-7 h-7 text-slate-400" />

              </div>

              <h4 className="text-lg font-semibold text-slate-800">
                No notifications yet
              </h4>

              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                You will see booking, review and account updates here.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {notifications.map((notification) => (

                <div
                  key={notification._id}
                  className={`p-5 sm:p-6 transition ${
                    notification.isRead
                      ? "bg-white hover:bg-slate-50"
                      : "bg-blue-50/40 hover:bg-blue-50/70"
                  }`}
                >

                  <div className="flex items-start gap-4">

                    {/* ICON */}

                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${getNotificationColor(
                        notification.type
                      )}`}
                    >
                      {getNotificationIcon(
                        notification.type
                      )}
                    </div>

                    {/* CONTENT */}

                    <div className="flex-1 min-w-0">

                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

                        <div>

                          <div className="flex items-center gap-2">

                            <h4 className="font-semibold text-slate-900">
                              {notification.title ||
                                "Notification"}
                            </h4>

                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            )}

                          </div>

                          <p className="text-sm text-slate-600 mt-1 leading-6">
                            {notification.message ||
                              "You have a new notification."}
                          </p>

                        </div>

                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {formatDate(
                            notification.createdAt
                          )}
                        </span>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex flex-wrap items-center gap-2 mt-4">

                        {!notification.isRead && (
                          <button
                            onClick={() =>
                              markAsRead(
                                notification._id
                              )
                            }
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold disabled:opacity-50 transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Mark as read
                          </button>
                        )}

                        <button
                          onClick={() =>
                            deleteNotification(
                              notification._id
                            )
                          }
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold disabled:opacity-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </main>

    </div>
  );
};

export default ProviderNotifications;