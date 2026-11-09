import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  RefreshCw,
  XCircle,
  CalendarDays,
  MapPin,
  UserRound,
} from "lucide-react";
import API from "../services/api";

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    booking: "",
    subject: "",
    description: "",
    category: "other",
  });

  // =========================================================
  // LOGOUT / AUTH ERROR
  // =========================================================

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    window.location.href = "/login";
  };

  // =========================================================
  // GET CUSTOMER COMPLAINTS
  // =========================================================

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/complaints/my");

      console.log("Customer Complaints:", response.data);

      setComplaints(response.data?.complaints || []);
    } catch (err) {
      console.error("Complaints Error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(err.response?.data?.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // GET CUSTOMER BOOKINGS
  // =========================================================

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);

      const response = await API.get("/bookings/my");

      console.log("Customer Bookings:", response.data);

      const bookingList = response.data?.bookings || response.data?.data || [];

      setBookings(Array.isArray(bookingList) ? bookingList : []);
    } catch (err) {
      console.error("Bookings Error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(err.response?.data?.message || "Failed to load your bookings.");
    } finally {
      setBookingsLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchComplaints();
    fetchBookings();
  }, []);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // OPEN FORM
  // =========================================================

  const openComplaintForm = () => {
    setError("");
    setSuccess("");

    setFormData({
      booking: "",
      subject: "",
      description: "",
      category: "other",
    });

    setShowForm(true);
  };

  // =========================================================
  // CLOSE FORM
  // =========================================================

  const closeComplaintForm = () => {
    if (submitting) {
      return;
    }

    setShowForm(false);
    setError("");

    setFormData({
      booking: "",
      subject: "",
      description: "",
      category: "other",
    });
  };

  // =========================================================
  // CREATE COMPLAINT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // -------------------------------------------------------
    // Validate subject
    // -------------------------------------------------------

    if (!formData.subject.trim()) {
      setError("Please enter a complaint subject.");
      return;
    }

    // -------------------------------------------------------
    // Validate description
    // -------------------------------------------------------

    if (!formData.description.trim()) {
      setError("Please enter complaint description.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const complaintData = {
        subject: formData.subject.trim(),

        description: formData.description.trim(),

        category: formData.category,
      };

      // -----------------------------------------------------
      // Add booking only when selected
      // -----------------------------------------------------

      if (formData.booking) {
        complaintData.booking = formData.booking;
      }

      const response = await API.post("/complaints", complaintData);

      console.log("Created Complaint:", response.data);

      setSuccess(response.data?.message || "Complaint submitted successfully.");

      setFormData({
        booking: "",
        subject: "",
        description: "",
        category: "other",
      });

      setShowForm(false);

      await fetchComplaints();
    } catch (err) {
      console.error("Create Complaint Error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(err.response?.data?.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // STATUS
  // =========================================================

  const getStatusInfo = (status) => {
    switch (status) {
      case "open":
        return {
          label: "Open",
          className: "bg-blue-100 text-blue-700 border-blue-200",
          icon: <AlertCircle size={16} />,
        };

      case "in-progress":
        return {
          label: "In Progress",
          className: "bg-yellow-100 text-yellow-700 border-yellow-200",
          icon: <Clock3 size={16} />,
        };

      case "resolved":
        return {
          label: "Resolved",
          className: "bg-green-100 text-green-700 border-green-200",
          icon: <CheckCircle2 size={16} />,
        };

      case "rejected":
        return {
          label: "Rejected",
          className: "bg-red-100 text-red-700 border-red-200",
          icon: <XCircle size={16} />,
        };

      default:
        return {
          label: status || "Unknown",
          className: "bg-slate-100 text-slate-700 border-slate-200",
          icon: <FileText size={16} />,
        };
    }
  };

  // =========================================================
  // CATEGORY
  // =========================================================

  const getCategoryLabel = (category) => {
    const categories = {
      booking: "Booking",
      provider: "Provider",
      service: "Service",
      payment: "Payment",
      other: "Other",
    };

    return categories[category] || "Other";
  };

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // =========================================================
  // BOOKING DATE
  // =========================================================

  const formatBookingDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // =========================================================
  // GET BOOKING ID
  // =========================================================

  const getBookingId = (booking) => {
    if (!booking) {
      return "";
    }

    if (typeof booking === "string") {
      return booking;
    }

    return booking._id || "";
  };

  // =========================================================
  // GET BOOKING DISPLAY TITLE
  // =========================================================

  const getBookingTitle = (booking) => {
    if (!booking) {
      return "Booking";
    }

    const service = booking.service;

    if (service && typeof service === "object") {
      return service.name || service.title || "Service Booking";
    }

    return "Service Booking";
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />

          <p className="text-slate-500">Loading complaints...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-sm text-blue-300 font-semibold uppercase tracking-wide">
                Customer Support
              </p>

              <h1 className="text-3xl sm:text-4xl font-bold mt-2">
                My Complaints
              </h1>

              <p className="text-slate-300 mt-2">
                Submit and track your complaints.
              </p>
            </div>

            <button
              onClick={() =>
                showForm ? closeComplaintForm() : openComplaintForm()
              }
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              <Plus size={18} />

              {showForm ? "Close Form" : "New Complaint"}
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ===================================================
            SUCCESS
        =================================================== */}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 size={20} />

            <p className="font-medium">{success}</p>
          </div>
        )}

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle size={20} />

            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* ===================================================
            NEW COMPLAINT FORM
        =================================================== */}

        {showForm && (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Submit a Complaint
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Tell us about the issue you are facing.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* =================================================
                  RELATED BOOKING
              ================================================= */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Related Booking
                </label>

                <select
                  name="booking"
                  value={formData.booking}
                  onChange={handleChange}
                  disabled={bookingsLoading}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {bookingsLoading
                      ? "Loading bookings..."
                      : "Select a booking (optional)"}
                  </option>

                  {bookings.map((booking) => {
                    const bookingId = getBookingId(booking);

                    return (
                      <option key={bookingId} value={bookingId}>
                        {getBookingTitle(booking)} -{" "}
                        {formatBookingDate(booking.bookingDate)}
                      </option>
                    );
                  })}
                </select>

                <p className="text-xs text-slate-500 mt-2">
                  Select the booking related to your complaint if applicable.
                </p>
              </div>

              {/* =================================================
                  SUBJECT
              ================================================= */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Subject
                </label>

                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  maxLength={150}
                  placeholder="Enter complaint subject"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* =================================================
                  CATEGORY
              ================================================= */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Category
                </label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="booking">Booking</option>

                  <option value="provider">Provider</option>

                  <option value="service">Service</option>

                  <option value="payment">Payment</option>

                  <option value="other">Other</option>
                </select>
              </div>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  maxLength={2000}
                  placeholder="Describe your problem..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                <p className="text-xs text-slate-400 mt-2 text-right">
                  {formData.description.length}/2000
                </p>
              </div>

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      Submit Complaint
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={closeComplaintForm}
                  disabled={submitting}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-60 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =====================================================
            REFRESH
        ===================================================== */}

        <div className="flex justify-end mb-5">
          <button
            onClick={() => {
              setError("");
              fetchComplaints();
              fetchBookings();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {/* =====================================================
            EMPTY
        ===================================================== */}

        {complaints.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <FileText size={30} />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mt-5">
              No complaints yet
            </h2>

            <p className="text-slate-500 mt-2">
              You have not submitted any complaints.
            </p>

            <button
              onClick={openComplaintForm}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              Submit Complaint
            </button>
          </div>
        ) : (
          /* ===================================================
             COMPLAINT LIST
          =================================================== */

          <div className="space-y-5">
            {complaints.map((complaint) => {
              const statusInfo = getStatusInfo(complaint.status);

              const booking = complaint.booking;

              return (
                <div
                  key={complaint._id}
                  className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
                >
                  {/* =================================================
                        TOP
                    ================================================= */}

                  <div className="p-6 sm:p-7">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-bold text-slate-900">
                            {complaint.subject}
                          </h2>

                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.className}`}
                          >
                            {statusInfo.icon}

                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-500">
                          <span>
                            Category:{" "}
                            <span className="font-medium text-slate-700">
                              {getCategoryLabel(complaint.category)}
                            </span>
                          </span>

                          <span>•</span>

                          <span>
                            Submitted: {formatDate(complaint.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* =================================================
                            VIEW DETAILS
                        ================================================= */}

                      <Link
                        to={`/complaints/${complaint._id}`}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
                      >
                        View Details
                      </Link>
                    </div>

                    {/* =================================================
                          BOOKING INFORMATION
                      ================================================= */}

                    {booking && (
                      <div className="mt-5 bg-blue-50 border border-blue-100 rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-blue-700">
                          <CalendarDays size={18} />

                          <p className="font-bold">Related Booking</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                          <div className="flex items-start gap-2">
                            <FileText
                              size={17}
                              className="text-blue-600 mt-0.5"
                            />

                            <div>
                              <p className="text-xs text-slate-500">Booking</p>

                              <p className="text-sm font-semibold text-slate-800">
                                {getBookingTitle(booking)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <CalendarDays
                              size={17}
                              className="text-blue-600 mt-0.5"
                            />

                            <div>
                              <p className="text-xs text-slate-500">
                                Booking Date
                              </p>

                              <p className="text-sm font-semibold text-slate-800">
                                {formatBookingDate(booking.bookingDate)}
                              </p>
                            </div>
                          </div>

                          {booking.city && (
                            <div className="flex items-start gap-2">
                              <MapPin
                                size={17}
                                className="text-blue-600 mt-0.5"
                              />

                              <div>
                                <p className="text-xs text-slate-500">
                                  Location
                                </p>

                                <p className="text-sm font-semibold text-slate-800">
                                  {booking.city}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* =================================================
                          DESCRIPTION
                      ================================================= */}

                    <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-slate-600 mb-1">
                        Your Complaint
                      </p>

                      <p className="text-slate-700 whitespace-pre-wrap leading-6">
                        {complaint.description}
                      </p>
                    </div>

                    {/* =================================================
                          PROVIDER
                      ================================================= */}

                    {complaint.provider && (
                      <div className="mt-5 flex items-center gap-3 text-sm text-slate-500">
                        <UserRound size={17} className="text-slate-400" />

                        <span>
                          Provider:{" "}
                          <span className="font-semibold text-slate-700">
                            {complaint.provider?.businessName || "Provider"}
                          </span>
                        </span>
                      </div>
                    )}

                    {/* =================================================
                          ADMIN RESPONSE
                      ================================================= */}

                    {complaint.adminResponse && (
                      <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 size={19} />

                          <p className="font-bold">Admin Response</p>
                        </div>

                        <p className="text-green-800 mt-3 leading-6 whitespace-pre-wrap">
                          {complaint.adminResponse}
                        </p>
                      </div>
                    )}

                    {/* =================================================
                          RESOLVED DATE
                      ================================================= */}

                    {complaint.resolvedAt && (
                      <div className="mt-4 text-sm text-slate-500">
                        Resolved on:{" "}
                        <span className="font-medium text-slate-700">
                          {formatDate(complaint.resolvedAt)}
                        </span>
                      </div>
                    )}
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

export default Complaints;
