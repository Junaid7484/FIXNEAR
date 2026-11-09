import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Bell,
  CalendarDays,
  UserCheck,
  User,
  CreditCard,
  Star,
  Settings,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import API from "../services/api";

function NotificationDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH NOTIFICATION
  // =====================================================

  const fetchNotification = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(`/notifications/admin/${id}`);

      setNotification(response.data?.notification || null);
    } catch (err) {
      console.error("Fetch Notification Details Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/admin/login");
        return;
      }

      if (err.response?.status === 403) {
        setError(
          "Access denied. Only administrators can view this notification.",
        );
        return;
      }

      setError(err.response?.data?.message || "Failed to load notification.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD
  // =====================================================

  useEffect(() => {
    fetchNotification();
  }, [id]);

  // =====================================================
  // TYPE CONFIG
  // =====================================================

  const getTypeConfig = (type) => {
    switch (type) {
      case "booking":
        return {
          label: "Booking",
          icon: CalendarDays,
          className: "bg-blue-50 text-blue-600",
        };

      case "provider":
        return {
          label: "Provider",
          icon: UserCheck,
          className: "bg-violet-50 text-violet-600",
        };

      case "review":
        return {
          label: "Review",
          icon: Star,
          className: "bg-amber-50 text-amber-600",
        };

      case "payment":
        return {
          label: "Payment",
          icon: CreditCard,
          className: "bg-emerald-50 text-emerald-600",
        };

      case "system":
        return {
          label: "System",
          icon: Settings,
          className: "bg-slate-100 text-slate-600",
        };

      case "other":
        return {
          label: "Other",
          icon: Bell,
          className: "bg-slate-100 text-slate-600",
        };

      default:
        return {
          label: "Notification",
          icon: Bell,
          className: "bg-slate-100 text-slate-600",
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
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={42} className="mx-auto animate-spin text-blue-600" />

          <p className="mt-3 text-sm text-slate-500">Loading notification...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !notification) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => navigate("/admin/notifications")}
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
            Back to Notifications
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <AlertTriangle size={42} className="mx-auto text-red-500" />

            <h2 className="mt-4 text-lg font-bold text-red-800">
              Notification not found
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error || "The requested notification could not be found."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // CONFIG
  // =====================================================

  const config = getTypeConfig(notification.type);

  const Icon = config.icon;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/admin/notifications")}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Notification Details
            </h1>

            <p className="text-sm text-slate-500">
              View complete notification information
            </p>
          </div>
        </div>
      </header>

      {/* MAIN */}

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* NOTIFICATION CARD */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* TOP */}

          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${config.className}`}
              >
                <Icon size={26} />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    {notification.title || "Notification"}
                  </h2>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {config.label}
                  </span>

                  {notification.isRead ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle size={13} />
                      Read
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      Unread
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {notification.message || "No message available."}
                </p>
              </div>
            </div>
          </div>

          {/* INFORMATION */}

          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
            {/* USER */}

            <InfoCard title="User Information" icon={<User size={18} />}>
              {notification.user ? (
                <div className="space-y-2">
                  <InfoRow
                    label="Name"
                    value={notification.user.name || "Not available"}
                  />

                  <InfoRow
                    label="Email"
                    value={notification.user.email || "Not available"}
                  />

                  <InfoRow
                    label="Phone"
                    value={notification.user.phone || "Not available"}
                  />

                  <InfoRow
                    label="Role"
                    value={notification.user.role || "Not available"}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No user information available.
                </p>
              )}
            </InfoCard>

            {/* NOTIFICATION INFORMATION */}

            <InfoCard
              title="Notification Information"
              icon={<Bell size={18} />}
            >
              <div className="space-y-2">
                <InfoRow label="Type" value={config.label} />

                <InfoRow
                  label="Status"
                  value={notification.isRead ? "Read" : "Unread"}
                />

                <InfoRow
                  label="Created"
                  value={formatDate(notification.createdAt)}
                />

                <InfoRow
                  label="Updated"
                  value={formatDate(notification.updatedAt)}
                />
              </div>
            </InfoCard>

            {/* BOOKING */}

            {notification.booking && (
              <InfoCard
                title="Related Booking"
                icon={<CalendarDays size={18} />}
              >
                <div className="space-y-2">
                  <InfoRow
                    label="Booking ID"
                    value={notification.booking._id || "Not available"}
                  />

                  {notification.booking.status && (
                    <InfoRow
                      label="Status"
                      value={notification.booking.status}
                    />
                  )}

                  {notification.booking.price !== undefined && (
                    <InfoRow
                      label="Price"
                      value={`₹${notification.booking.price}`}
                    />
                  )}

                  <button
                    onClick={() =>
                      navigate(`/admin/bookings/${notification.booking._id}`)
                    }
                    className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    View Booking
                  </button>
                </div>
              </InfoCard>
            )}

            {/* PROVIDER */}

            {notification.provider && (
              <InfoCard title="Related Provider" icon={<UserCheck size={18} />}>
                <div className="space-y-2">
                  <InfoRow
                    label="Business"
                    value={
                      notification.provider.businessName || "Not available"
                    }
                  />

                  <InfoRow
                    label="City"
                    value={notification.provider.city || "Not available"}
                  />

                  <InfoRow
                    label="State"
                    value={notification.provider.state || "Not available"}
                  />

                  <InfoRow
                    label="Rating"
                    value={
                      notification.provider.rating !== undefined
                        ? notification.provider.rating
                        : "Not available"
                    }
                  />
                </div>
              </InfoCard>
            )}
          </div>
        </div>

        {/* BACK BUTTON */}

        <div className="mt-6">
          <button
            onClick={() => navigate("/admin/notifications")}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ArrowLeft size={17} />
            Back to Notifications
          </button>
        </div>
      </main>
    </div>
  );
}

// ======================================================
// INFO CARD
// ======================================================

function InfoCard({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-white p-2 text-slate-600 shadow-sm">
          {icon}
        </div>

        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>

      {children}
    </div>
  );
}

// ======================================================
// INFO ROW
// ======================================================

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-200 pb-2 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium text-slate-500">{label}</span>

      <span className="break-all text-sm font-semibold capitalize text-slate-800 sm:text-right">
        {String(value)}
      </span>
    </div>
  );
}

export default NotificationDetails;
