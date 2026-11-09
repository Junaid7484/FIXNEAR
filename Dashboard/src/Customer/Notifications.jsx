import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  AlertCircle,
  CalendarCheck,
  Star,
  XCircle,
  Info,
  FileText,
} from "lucide-react";

import API from "../services/api";

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(null);

  // ============================================
  // GET CUSTOMER NOTIFICATIONS
  // GET /api/notifications/my
  // ============================================

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/notifications/my");

      console.log("Notifications API Response:", response.data);

      const receivedNotifications =
        response.data?.notifications ||
        response.data?.data ||
        (Array.isArray(response.data) ? response.data : []);

      setNotifications(receivedNotifications);
    } catch (err) {
      console.error("Fetch Notifications Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // MARK ONE NOTIFICATION AS READ
  // ============================================

  const markAsRead = async (notificationId) => {
    if (!notificationId) return;

    try {
      setActionLoading(notificationId);

      await API.put(`/notifications/${notificationId}/read`);

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
                read: true,
              }
            : notification,
        ),
      );
    } catch (err) {
      console.error("Mark Notification Read Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message || "Failed to mark notification as read.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================
  // MARK ALL AS READ
  // ============================================

  const markAllAsRead = async () => {
    try {
      setActionLoading("all");

      await API.put("/notifications/read-all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          read: true,
        })),
      );
    } catch (err) {
      console.error("Mark All Notifications Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to mark all notifications as read.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================
  // DELETE NOTIFICATION
  // ============================================

  const deleteNotification = async (notificationId) => {
    if (!notificationId) return;

    try {
      setActionLoading(notificationId);

      await API.delete(`/notifications/${notificationId}`);

      setNotifications((current) =>
        current.filter((notification) => notification._id !== notificationId),
      );
    } catch (err) {
      console.error("Delete Notification Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Failed to delete notification.");
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================
  // OPEN COMPLAINT FROM NOTIFICATION
  // ============================================

  const openComplaint = async (notification) => {
    const notificationId = notification?._id;

    const complaintId = notification?.complaint?._id || notification?.complaint;

    if (!complaintId) {
      return;
    }

    try {
      // Mark notification as read first
      if (!isNotificationRead(notification)) {
        await markAsRead(notificationId);
      }

      // Open existing customer complaint details
      navigate(`/complaints/${complaintId}`);
    } catch (error) {
      console.error("Open Complaint Notification Error:", error);
    }
  };

  // ============================================
  // NOTIFICATION ICON
  // ============================================

  const getNotificationIcon = (notification) => {
    const type = String(notification?.type || "").toLowerCase();

    // Complaint notification
    if (notification?.complaint) {
      return <FileText size={20} className="text-orange-600" />;
    }

    if (type.includes("booking") || type.includes("appointment")) {
      return <CalendarCheck size={20} className="text-blue-600" />;
    }

    if (type.includes("review")) {
      return <Star size={20} className="text-yellow-500" />;
    }

    if (type.includes("cancel") || type.includes("reject")) {
      return <XCircle size={20} className="text-red-500" />;
    }

    return <Info size={20} className="text-blue-600" />;
  };

  // ============================================
  // NOTIFICATION DATE
  // ============================================

  const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // ============================================
  // CHECK READ STATUS
  // ============================================

  const isNotificationRead = (notification) => {
    return notification?.isRead === true || notification?.read === true;
  };

  // ============================================
  // LOAD
  // ============================================

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ============================================
  // UNREAD COUNT
  // ============================================

  const unreadCount = notifications.filter(
    (notification) => !isNotificationRead(notification),
  ).length;

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="min-h-150 bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />

          <p className="text-sm text-slate-500">Loading notifications...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // COMPLETE ERROR
  // ============================================

  if (error && notifications.length === 0) {
    return (
      <div className="min-h-150 bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={30} />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Unable to load notifications
          </h2>

          <p className="text-slate-500 mt-2">{error}</p>

          <button
            onClick={fetchNotifications}
            className="mt-6 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition"
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
      {/* HEADER */}

      <section className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
            <Bell size={16} />
            Notifications
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mt-5">
            My Notifications
          </h1>

          <p className="text-slate-300 mt-2">
            Stay updated about your bookings, reviews, complaints, and account
            activity.
          </p>
        </div>
      </section>

      {/* CONTENT */}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* TOP BAR */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-slate-500">{unreadCount} unread</p>

            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Recent Notifications
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchNotifications}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={actionLoading === "all"}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
              >
                <CheckCheck size={16} />

                {actionLoading === "all" ? "Updating..." : "Mark All Read"}
              </button>
            )}
          </div>
        </div>

        {/* ERROR */}

        {error && notifications.length > 0 && (
          <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4">
            <AlertCircle size={19} />

            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* EMPTY */}

        {notifications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 sm:p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <Bell size={36} className="text-blue-500" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mt-6">
              No notifications
            </h3>

            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              You don't have any notifications right now. New booking,
              complaint, and account updates will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const notificationId = notification?._id;

              const read = isNotificationRead(notification);

              const complaintId =
                notification?.complaint?._id || notification?.complaint;

              return (
                <div
                  key={notificationId}
                  className={`bg-white border rounded-2xl p-5 shadow-sm transition ${
                    read ? "border-slate-200" : "border-blue-200 bg-blue-50/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* ICON */}

                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                        read ? "bg-slate-100" : "bg-blue-100"
                      }`}
                    >
                      {getNotificationIcon(notification)}
                    </div>

                    {/* CONTENT */}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {notification?.title || "Notification"}
                          </h3>

                          <p className="text-sm text-slate-600 mt-1">
                            {notification?.message ||
                              notification?.description ||
                              "You have a new notification."}
                          </p>
                        </div>

                        {!read && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                            New
                          </span>
                        )}
                      </div>

                      {/* DATE */}

                      <p className="text-xs text-slate-400 mt-3">
                        {formatDate(
                          notification?.createdAt ||
                            notification?.created_at ||
                            notification?.date,
                        )}
                      </p>

                      {/* ACTIONS */}

                      <div className="flex flex-wrap items-center gap-3 mt-4">
                        {/* MARK AS READ */}

                        {!read && (
                          <button
                            onClick={() => markAsRead(notificationId)}
                            disabled={actionLoading === notificationId}
                            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                          >
                            <Check size={16} />

                            {actionLoading === notificationId
                              ? "Updating..."
                              : "Mark as read"}
                          </button>
                        )}

                        {/* VIEW COMPLAINT */}

                        {complaintId && (
                          <button
                            onClick={() => openComplaint(notification)}
                            className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700"
                          >
                            <FileText size={16} />
                            View Complaint
                          </button>
                        )}

                        {/* DELETE */}

                        <button
                          onClick={() => deleteNotification(notificationId)}
                          disabled={actionLoading === notificationId}
                          className="inline-flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
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

export default Notifications;
