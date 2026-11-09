import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  Save,
  User,
  Building2,
  CalendarDays,
  Tag,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import API from "../services/api";

function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [status, setStatus] = useState("");
  const [adminResponse, setAdminResponse] = useState("");

  // =========================================================
  // FETCH COMPLAINT
  // =========================================================

  const fetchComplaint = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await API.get(`/complaints/${id}`);

      console.log("Complaint Details:", response.data);

      const data =
        response.data?.complaint || response.data?.data || response.data;

      if (!data) {
        throw new Error("Complaint data not found.");
      }

      setComplaint(data);

      setStatus(data?.status || "open");

      setAdminResponse(data?.adminResponse || "");
    } catch (err) {
      console.error("Complaint Details Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate("/admin/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load complaint.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchComplaint();
    }
  }, [id]);

  // =========================================================
  // STATUS INFORMATION
  // =========================================================

  const getStatusInfo = (currentStatus) => {
    switch (currentStatus) {
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
          icon: <AlertCircle size={16} />,
        };

      default:
        return {
          label: currentStatus || "Unknown",
          className: "bg-slate-100 text-slate-700 border-slate-200",
          icon: <FileText size={16} />,
        };
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "—";

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
  // UPDATE COMPLAINT
  // =========================================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!complaint) {
      return;
    }

    if (!status) {
      setError("Please select a complaint status.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await API.put(`/complaints/${id}`, {
        status,
        adminResponse: adminResponse.trim(),
      });

      console.log("Updated Complaint:", response.data);

      const updatedComplaint =
        response.data?.complaint || response.data?.data || response.data;

      if (updatedComplaint) {
        setComplaint(updatedComplaint);

        setStatus(updatedComplaint.status || status);

        setAdminResponse(updatedComplaint.adminResponse ?? adminResponse);
      }

      setSuccess(response.data?.message || "Complaint updated successfully.");
    } catch (err) {
      console.error("Update Complaint Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate("/admin/login");
        return;
      }

      setError(err.response?.data?.message || "Failed to update complaint.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />

          <p className="text-sm text-slate-500">Loading complaint...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR / NOT FOUND
  // =========================================================

  if (error && !complaint) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={30} />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Unable to load complaint
          </h2>

          <p className="text-slate-500 mt-2">
            {error || "Complaint not found."}
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => navigate("/admin/complaints")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <button
              onClick={() => fetchComplaint()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              <RefreshCw size={17} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return null;
  }

  const statusInfo = getStatusInfo(complaint.status);

  const customer = complaint.customer;
  const provider = complaint.provider;
  const booking = complaint.booking;

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
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate("/admin/complaints")}
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition"
            >
              <ArrowLeft size={18} />
              Back to Complaints
            </button>

            <button
              onClick={() => fetchComplaint(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mt-7">
            <div className="flex items-center gap-2 text-blue-300">
              <ShieldCheck size={18} />

              <p className="text-sm font-semibold uppercase tracking-wide">
                Admin Panel
              </p>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mt-2">
              Complaint Details
            </h1>

            <p className="text-slate-300 mt-2">
              Review the complaint and update its status and response.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* SUCCESS */}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 size={20} />

            <p className="font-medium">{success}</p>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle size={20} />

            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <div className="lg:col-span-2 space-y-6">
            {/* =================================================
                COMPLAINT INFORMATION
            ================================================= */}

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              {/* TITLE */}

              <div className="p-6 sm:p-8 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      Complaint
                    </p>

                    <h2 className="text-2xl font-bold text-slate-900 mt-2">
                      {complaint.subject}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold border ${statusInfo.className}`}
                  >
                    {statusInfo.icon}

                    {statusInfo.label}
                  </span>
                </div>
              </div>

              {/* DETAILS */}

              <div className="p-6 sm:p-8 space-y-7">
                {/* CATEGORY */}

                <div>
                  <div className="flex items-center gap-2">
                    <Tag size={17} className="text-blue-600" />

                    <p className="text-sm font-semibold text-slate-500">
                      Category
                    </p>
                  </div>

                  <p className="text-slate-900 mt-2 capitalize font-medium">
                    {complaint.category || "other"}
                  </p>
                </div>

                {/* DESCRIPTION */}

                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquare size={17} className="text-blue-600" />

                    <p className="text-sm font-semibold text-slate-500">
                      Complaint Description
                    </p>
                  </div>

                  <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-700 leading-7 whitespace-pre-wrap">
                    {complaint.description}
                  </div>
                </div>

                {/* BOOKING */}

                {booking && (
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarDays size={18} className="text-blue-600" />

                      <p className="text-sm font-semibold text-slate-500">
                        Related Booking
                      </p>
                    </div>

                    <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-sm text-slate-500">Booking ID</p>

                      <p className="text-slate-900 font-medium break-all">
                        {booking?._id || booking}
                      </p>

                      {booking?.bookingDate && (
                        <p className="text-sm text-slate-600 mt-2">
                          Booking Date:{" "}
                          <span className="font-medium">
                            {formatDate(booking.bookingDate)}
                          </span>
                        </p>
                      )}

                      {booking?.status && (
                        <p className="text-sm text-slate-600 mt-1 capitalize">
                          Booking Status:{" "}
                          <span className="font-medium">{booking.status}</span>
                        </p>
                      )}

                      {booking?.price !== undefined && (
                        <p className="text-sm text-slate-600 mt-1">
                          Booking Amount:{" "}
                          <span className="font-medium">₹{booking.price}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* SUBMITTED */}

                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Submitted On
                  </p>

                  <p className="text-slate-900 mt-1">
                    {formatDate(complaint.createdAt)}
                  </p>
                </div>

                {/* LAST UPDATED */}

                {complaint.updatedAt && (
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Last Updated
                    </p>

                    <p className="text-slate-900 mt-1">
                      {formatDate(complaint.updatedAt)}
                    </p>
                  </div>
                )}

                {/* CURRENT ADMIN RESPONSE */}

                {complaint.adminResponse && (
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-green-600" />

                      <p className="text-sm font-semibold text-slate-500">
                        Current Admin Response
                      </p>
                    </div>

                    <div className="mt-2 bg-green-50 border border-green-200 rounded-xl p-5 text-green-800 leading-7 whitespace-pre-wrap">
                      {complaint.adminResponse}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* =================================================
                CUSTOMER / PROVIDER
            ================================================= */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CUSTOMER */}

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <User size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">Customer</h3>

                    <p className="text-xs text-slate-500">
                      Complaint submitted by
                    </p>
                  </div>
                </div>

                {customer ? (
                  <>
                    <p className="font-semibold text-slate-900">
                      {customer.name || "Unknown Customer"}
                    </p>

                    {customer.email && (
                      <p className="text-sm text-slate-500 mt-1">
                        {customer.email}
                      </p>
                    )}

                    {customer.phone && (
                      <p className="text-sm text-slate-500 mt-1">
                        {customer.phone}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500">
                    Customer information unavailable.
                  </p>
                )}
              </div>

              {/* PROVIDER */}

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                    <Building2 size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">Provider</h3>

                    <p className="text-xs text-slate-500">
                      Related service provider
                    </p>
                  </div>
                </div>

                {provider ? (
                  <>
                    <p className="font-semibold text-slate-900">
                      {provider.businessName ||
                        provider.name ||
                        provider._id ||
                        "Unknown Provider"}
                    </p>

                    {provider.city && (
                      <p className="text-sm text-slate-500 mt-1">
                        {provider.city}

                        {provider.state ? `, ${provider.state}` : ""}
                      </p>
                    )}

                    {provider.phone && (
                      <p className="text-sm text-slate-500 mt-1">
                        {provider.phone}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500">No provider specified.</p>
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              RIGHT SIDE - ADMIN ACTION
          ================================================= */}

          <div>
            <form
              onSubmit={handleUpdate}
              className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sticky top-6"
            >
              {/* HEADER */}

              <div className="mb-6">
                <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold">
                  Admin Action
                </p>

                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  Update Complaint
                </h2>

                <p className="text-sm text-slate-500 mt-2">
                  Update the complaint status and send a response to the
                  customer.
                </p>
              </div>

              {/* STATUS */}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Complaint Status
                </label>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="open">Open</option>

                  <option value="in-progress">In Progress</option>

                  <option value="resolved">Resolved</option>

                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* STATUS PREVIEW */}

              <div className="mb-6">
                <p className="text-xs text-slate-500 mb-2">Selected Status</p>

                <span
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold border ${getStatusInfo(status).className}`}
                >
                  {getStatusInfo(status).icon}

                  {getStatusInfo(status).label}
                </span>
              </div>

              {/* ADMIN RESPONSE */}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Admin Response
                </label>

                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={8}
                  placeholder="Write your response to the customer..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                <p className="text-xs text-slate-400 mt-2">
                  This response will be visible to the customer.
                </p>
              </div>

              {/* SAVE */}

              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {saving ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>

              {/* BACK BUTTON */}

              <button
                type="button"
                onClick={() => navigate("/admin/complaints")}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition"
              >
                <ArrowLeft size={18} />
                Back to Complaints
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ComplaintDetails;
