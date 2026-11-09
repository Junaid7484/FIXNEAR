import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Edit3,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  XCircle,
  Heart,
  Bell,
  Settings,
  ClipboardList,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import API from "../services/api";

function Profile() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // FETCH PROFILE + BOOKINGS
  // =========================================
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileResponse, bookingsResponse] = await Promise.all([
        API.get("/users/profile"),
        API.get("/bookings/my"),
      ]);

      console.log("Profile API Response:", profileResponse.data);

      console.log("Bookings API Response:", bookingsResponse.data);

      const receivedUser =
        profileResponse.data?.user ||
        profileResponse.data?.data ||
        profileResponse.data;

      const receivedBookings =
        bookingsResponse.data?.bookings ||
        bookingsResponse.data?.data ||
        (Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);

      setUser(receivedUser);
      setBookings(receivedBookings);
    } catch (error) {
      console.error("Fetch Profile Data Error:", error);

      setError(error.response?.data?.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // BOOKING STATISTICS
  // =========================================
  const totalBookings = bookings.length;

  const completedBookings = bookings.filter(
    (booking) => booking.status?.toLowerCase() === "completed",
  ).length;

  const pendingBookings = bookings.filter(
    (booking) => booking.status?.toLowerCase() === "pending",
  ).length;

  const cancelledBookings = bookings.filter((booking) => {
    const status = booking.status?.toLowerCase();

    return status === "cancelled" || status === "rejected";
  }).length;

  const stats = [
    {
      label: "Total Bookings",
      value: totalBookings,
      icon: CalendarDays,
      className: "bg-blue-50 text-blue-600",
    },
    {
      label: "Completed",
      value: completedBookings,
      icon: CheckCircle2,
      className: "bg-green-50 text-green-600",
    },
    {
      label: "Pending",
      value: pendingBookings,
      icon: Clock3,
      className: "bg-amber-50 text-amber-600",
    },
    {
      label: "Cancelled",
      value: cancelledBookings,
      icon: XCircle,
      className: "bg-red-50 text-red-600",
    },
  ];

  // =========================================
  // MEMBER SINCE
  // =========================================
  const getMemberSince = () => {
    if (!user?.createdAt) {
      return "FIXNEAR Member";
    }

    return new Date(user.createdAt).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  // =========================================
  // LOADING
  // =========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-11 h-11 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

          <p className="text-slate-600 mt-4 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  // =========================================
  // ERROR
  // =========================================
  if (error || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={30} />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Unable to load profile
          </h2>

          <p className="text-slate-500 mt-2">
            {error || "Profile information was not found."}
          </p>

          <button
            onClick={fetchProfileData}
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
      {/* =========================================
          HEADER
      ========================================= */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-blue-400 font-semibold text-sm">MY ACCOUNT</p>

          <h1 className="text-3xl sm:text-4xl font-bold mt-2">My Profile</h1>

          <p className="text-slate-400 mt-2 max-w-2xl">
            Manage your personal information, bookings and account preferences.
          </p>
        </div>
      </section>

      {/* =========================================
          MAIN
      ========================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* =====================================
              PROFILE CARD
          ===================================== */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col items-center text-center">
              {/* Profile Image */}
              <div className="w-28 h-28 rounded-full bg-blue-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} className="text-blue-600" />
                )}
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mt-5">
                {user.name || "Customer"}
              </h2>

              <p className="text-slate-500 mt-1">Customer</p>

              <div className="flex items-center gap-2 mt-3 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold">
                <ShieldCheck size={16} />
                {user.isVerified ? "Verified Account" : "Account"}
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t border-slate-200 mt-6 pt-6 space-y-4">
              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Mail size={18} className="text-slate-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Email</p>

                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {user.email || "Not available"}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Phone size={18} className="text-slate-600" />
                </div>

                <div>
                  <p className="text-xs text-slate-500">Phone</p>

                  <p className="text-sm font-semibold text-slate-900">
                    {user.phone || "Not available"}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <MapPin size={18} className="text-slate-600" />
                </div>

                <div>
                  <p className="text-xs text-slate-500">Location</p>

                  <p className="text-sm font-semibold text-slate-900">
                    {[user.city, user.state].filter(Boolean).join(", ") ||
                      "Location not added"}
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <CalendarDays size={18} className="text-slate-600" />
                </div>

                <div>
                  <p className="text-xs text-slate-500">Member Since</p>

                  <p className="text-sm font-semibold text-slate-900">
                    {getMemberSince()}
                  </p>
                </div>
              </div>
            </div>

            {/* Edit */}
            <Link
              to="/profile/edit"
              className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
            >
              <Edit3 size={18} />
              Edit Profile
            </Link>
          </section>

          {/* =====================================
              RIGHT CONTENT
          ===================================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Statistics */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Booking Overview
              </h2>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.label}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.className}`}
                      >
                        <Icon size={21} />
                      </div>

                      <p className="text-2xl font-bold text-slate-900 mt-4">
                        {stat.value}
                      </p>

                      <p className="text-sm text-slate-500 mt-1">
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Personal Information */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Personal Information
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Your basic account information
                  </p>
                </div>

                <Link
                  to="/profile/edit"
                  className="hidden sm:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
                >
                  <Edit3 size={16} />
                  Edit
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                <div>
                  <p className="text-sm text-slate-500">Full Name</p>

                  <p className="font-semibold text-slate-900 mt-1">
                    {user.name || "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Email Address</p>

                  <p className="font-semibold text-slate-900 mt-1 break-all">
                    {user.email || "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Phone Number</p>

                  <p className="font-semibold text-slate-900 mt-1">
                    {user.phone || "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">City</p>

                  <p className="font-semibold text-slate-900 mt-1">
                    {user.city || "Not added"}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-sm text-slate-500">Address</p>

                  <p className="font-semibold text-slate-900 mt-1">
                    {[user.address, user.city, user.state]
                      .filter(Boolean)
                      .join(", ") || "Address not added"}
                  </p>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Quick Actions
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Quickly access your important account pages.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <Link
                  to="/my-bookings"
                  className="group border border-slate-200 hover:border-blue-300 hover:shadow-sm rounded-xl p-4 transition"
                >
                  <CalendarDays size={23} className="text-blue-600" />

                  <h3 className="font-semibold text-slate-900 mt-3">
                    My Bookings
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    View your service bookings
                  </p>
                </Link>

                <Link
                  to="/favorites"
                  className="group border border-slate-200 hover:border-red-300 hover:shadow-sm rounded-xl p-4 transition"
                >
                  <Heart size={23} className="text-red-500" />

                  <h3 className="font-semibold text-slate-900 mt-3">
                    Favorites
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    View saved providers
                  </p>
                </Link>

                <Link
                  to="/notifications"
                  className="group border border-slate-200 hover:border-purple-300 hover:shadow-sm rounded-xl p-4 transition"
                >
                  <Bell size={23} className="text-purple-600" />

                  <h3 className="font-semibold text-slate-900 mt-3">
                    Notifications
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Check your latest updates
                  </p>
                </Link>
              </div>
            </section>

            {/* Account Settings */}
            <section className="bg-slate-900 rounded-2xl p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Settings size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold">Account Settings</h2>

                  <p className="text-slate-400 text-sm mt-1">
                    Manage your password, notifications and account preferences.
                  </p>

                  <Link
                    to="/settings"
                    className="inline-flex items-center gap-2 mt-4 bg-white text-slate-900 hover:bg-slate-100 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                  >
                    Manage Settings
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
