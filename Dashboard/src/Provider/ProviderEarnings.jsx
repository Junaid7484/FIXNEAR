import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IndianRupee,
  CheckCircle,
  Clock,
  CalendarDays,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import API from "../services/api";

const ProviderEarnings = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // FETCH EARNINGS
  // ========================================

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/provider/login");
        return;
      }

      const response = await API.get("/bookings/provider/stats");

      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        setError(
          response.data.message || "Unable to load earnings."
        );
      }
    } catch (err) {
      console.error("Provider Earnings Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("provider");

        navigate("/provider/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load earnings."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // LOAD DATA
  // ========================================

  useEffect(() => {
    fetchEarnings();
  }, []);

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-slate-600 font-medium">
            Loading your earnings...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate("/provider/dashboard")}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold mb-6"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">
                !
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Unable to Load Earnings
            </h2>

            <p className="text-slate-600 mb-6">
              {error}
            </p>

            <button
              onClick={fetchEarnings}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition"
            >
              <RefreshCw size={17} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // SAFE VALUES
  // ========================================

  const totalEarnings = stats?.totalEarnings || 0;
  const totalBookings = stats?.totalBookings || 0;
  const completedBookings = stats?.completedBookings || 0;
  const pendingBookings = stats?.pendingBookings || 0;
  const acceptedBookings = stats?.acceptedBookings || 0;
  const confirmedBookings = stats?.confirmedBookings || 0;
  const inProgressBookings =
    stats?.inProgressBookings || 0;
  const rejectedBookings = stats?.rejectedBookings || 0;
  const cancelledBookings =
    stats?.cancelledBookings || 0;

  // ========================================
  // PAGE
  // ========================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">

        {/* ========================================
            HEADER
        ======================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

          <div>
            <button
              onClick={() =>
                navigate("/provider/dashboard")
              }
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold text-sm mb-3 transition"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-slate-900">
              Earnings
            </h1>

            <p className="text-slate-500 mt-1">
              Track your completed bookings and earnings.
            </p>
          </div>

          <button
            onClick={fetchEarnings}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold transition shadow-sm"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {/* ========================================
            TOTAL EARNINGS
        ======================================== */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Total Earnings
              </p>

              <div className="flex items-center gap-2 mt-3">
                <IndianRupee
                  size={34}
                  className="text-emerald-600"
                />

                <span className="text-4xl sm:text-5xl font-bold text-slate-900">
                  {totalEarnings.toLocaleString("en-IN")}
                </span>
              </div>

              <p className="text-slate-500 mt-3">
                Earnings from completed bookings
              </p>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp
                size={38}
                className="text-emerald-600"
              />
            </div>

          </div>
        </div>

        {/* ========================================
            MAIN STAT CARDS
        ======================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          {/* Total Bookings */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

            <div className="flex items-center justify-between mb-4">

              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                <CalendarDays
                  size={22}
                  className="text-indigo-600"
                />
              </div>

              <span className="text-xs font-semibold text-slate-400">
                ALL
              </span>

            </div>

            <p className="text-sm text-slate-500">
              Total Bookings
            </p>

            <p className="text-3xl font-bold text-slate-900 mt-1">
              {totalBookings}
            </p>

          </div>

          {/* Completed */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

            <div className="flex items-center justify-between mb-4">

              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle
                  size={22}
                  className="text-emerald-600"
                />
              </div>

              <span className="text-xs font-semibold text-emerald-600">
                DONE
              </span>

            </div>

            <p className="text-sm text-slate-500">
              Completed
            </p>

            <p className="text-3xl font-bold text-slate-900 mt-1">
              {completedBookings}
            </p>

          </div>

          {/* Pending */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

            <div className="flex items-center justify-between mb-4">

              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock
                  size={22}
                  className="text-amber-600"
                />
              </div>

              <span className="text-xs font-semibold text-amber-600">
                WAITING
              </span>

            </div>

            <p className="text-sm text-slate-500">
              Pending
            </p>

            <p className="text-3xl font-bold text-slate-900 mt-1">
              {pendingBookings}
            </p>

          </div>

          {/* Average */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

            <div className="flex items-center justify-between mb-4">

              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <IndianRupee
                  size={22}
                  className="text-blue-600"
                />
              </div>

              <span className="text-xs font-semibold text-blue-600">
                AVERAGE
              </span>

            </div>

            <p className="text-sm text-slate-500">
              Per Completed Booking
            </p>

            <p className="text-3xl font-bold text-slate-900 mt-1">
              ₹
              {completedBookings > 0
                ? Math.round(
                    totalEarnings /
                      completedBookings
                  ).toLocaleString("en-IN")
                : "0"}
            </p>

          </div>
        </div>

        {/* ========================================
            BOOKING STATUS BREAKDOWN
        ======================================== */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Booking Status
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Overview of all your booking statuses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-sm text-slate-500">
                Accepted
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-1">
                {acceptedBookings}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <p className="text-sm text-blue-600">
                Confirmed
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-1">
                {confirmedBookings}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
              <p className="text-sm text-purple-600">
                In Progress
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-1">
                {inProgressBookings}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">
                Rejected
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-1">
                {rejectedBookings}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <p className="text-sm text-gray-500">
                Cancelled
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-1">
                {cancelledBookings}
              </p>
            </div>

          </div>
        </div>

        {/* ========================================
            NOTE
        ======================================== */}

        <div className="mt-6 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">

          <p className="text-sm text-indigo-800">
            <span className="font-bold">
              Earnings calculation:
            </span>{" "}
            Only bookings with{" "}
            <span className="font-semibold">
              completed
            </span>{" "}
            status are included in total earnings.
          </p>

        </div>

      </div>
    </div>
  );
};

export default ProviderEarnings;