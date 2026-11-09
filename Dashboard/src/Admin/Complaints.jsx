import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  Search,
  Eye,
  XCircle,
  X,
} from "lucide-react";
import API from "../services/api";

function Complaints() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // =========================================================
  // FETCH ALL COMPLAINTS
  // GET /complaints
  // =========================================================

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/complaints");

      console.log("Admin Complaints:", response.data);

      setComplaints(
        Array.isArray(response.data?.complaints)
          ? response.data.complaints
          : [],
      );
    } catch (err) {
      console.error("Admin Complaints Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate("/admin/login");
        return;
      }

      if (err.response?.status === 403) {
        setError("You do not have permission to view complaints.");
        return;
      }

      setError(err.response?.data?.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // =========================================================
  // STATUS INFORMATION
  // =========================================================

  const getStatusInfo = (status) => {
    switch (status) {
      case "open":
        return {
          label: "Open",
          className: "bg-blue-100 text-blue-700 border-blue-200",
          icon: <AlertCircle size={15} />,
        };

      case "in-progress":
        return {
          label: "In Progress",
          className: "bg-yellow-100 text-yellow-700 border-yellow-200",
          icon: <Clock3 size={15} />,
        };

      case "resolved":
        return {
          label: "Resolved",
          className: "bg-green-100 text-green-700 border-green-200",
          icon: <CheckCircle2 size={15} />,
        };

      case "rejected":
        return {
          label: "Rejected",
          className: "bg-red-100 text-red-700 border-red-200",
          icon: <XCircle size={15} />,
        };

      default:
        return {
          label: status || "Unknown",
          className: "bg-slate-100 text-slate-700 border-slate-200",
          icon: <FileText size={15} />,
        };
    }
  };

  // =========================================================
  // DATE FORMAT
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
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "all" || categoryFilter !== "all";

  // =========================================================
  // FILTER COMPLAINTS
  // =========================================================

  const filteredComplaints = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return complaints.filter((complaint) => {
      const customerName = complaint.customer?.name || "";

      const customerEmail = complaint.customer?.email || "";

      const providerName = complaint.provider?.businessName || "";

      const subject = complaint.subject || "";

      const description = complaint.description || "";

      const category = complaint.category || "";

      // SEARCH
      const matchesSearch =
        subject.toLowerCase().includes(searchText) ||
        description.toLowerCase().includes(searchText) ||
        customerName.toLowerCase().includes(searchText) ||
        customerEmail.toLowerCase().includes(searchText) ||
        providerName.toLowerCase().includes(searchText) ||
        category.toLowerCase().includes(searchText);

      // STATUS
      const matchesStatus =
        statusFilter === "all" || complaint.status === statusFilter;

      // CATEGORY
      const matchesCategory =
        categoryFilter === "all" || complaint.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [complaints, search, statusFilter, categoryFilter]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const stats = useMemo(() => {
    return {
      total: complaints.length,

      open: complaints.filter((item) => item.status === "open").length,

      inProgress: complaints.filter((item) => item.status === "in-progress")
        .length,

      resolved: complaints.filter((item) => item.status === "resolved").length,

      rejected: complaints.filter((item) => item.status === "rejected").length,
    };
  }, [complaints]);

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
      ====================================================== */}

      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-sm text-blue-300 font-semibold uppercase tracking-wide">
                Admin Panel
              </p>

              <h1 className="text-3xl sm:text-4xl font-bold mt-2">
                Complaint Management
              </h1>

              <p className="text-slate-300 mt-2">
                Manage customer complaints and support requests.
              </p>
            </div>

            <button
              onClick={fetchComplaints}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-slate-800 rounded-xl font-semibold hover:bg-slate-100 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ===================================================
            STATISTICS
        ==================================================== */}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {/* TOTAL */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total</p>

            <p className="text-3xl font-bold text-slate-900 mt-2">
              {stats.total}
            </p>
          </div>

          {/* OPEN */}
          <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-blue-600">Open</p>

            <p className="text-3xl font-bold text-blue-700 mt-2">
              {stats.open}
            </p>
          </div>

          {/* IN PROGRESS */}
          <div className="bg-white border border-yellow-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-yellow-600">In Progress</p>

            <p className="text-3xl font-bold text-yellow-700 mt-2">
              {stats.inProgress}
            </p>
          </div>

          {/* RESOLVED */}
          <div className="bg-white border border-green-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-green-600">Resolved</p>

            <p className="text-3xl font-bold text-green-700 mt-2">
              {stats.resolved}
            </p>
          </div>

          {/* REJECTED */}
          <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-red-600">Rejected</p>

            <p className="text-3xl font-bold text-red-700 mt-2">
              {stats.rejected}
            </p>
          </div>
        </div>

        {/* ===================================================
            SEARCH + FILTER
        ==================================================== */}

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* SEARCH */}

            <div className="md:col-span-2 relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject, customer, email or provider..."
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* STATUS FILTER */}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>

              <option value="open">Open</option>

              <option value="in-progress">In Progress</option>

              <option value="resolved">Resolved</option>

              <option value="rejected">Rejected</option>
            </select>

            {/* CATEGORY FILTER */}

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>

              <option value="booking">Booking</option>

              <option value="provider">Provider</option>

              <option value="service">Service</option>

              <option value="payment">Payment</option>

              <option value="other">Other</option>
            </select>
          </div>

          {/* CLEAR FILTERS */}

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                <X size={16} />
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* ===================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle size={20} />

            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* ===================================================
            RESULT COUNT
        ==================================================== */}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredComplaints.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {complaints.length}
            </span>{" "}
            complaints
          </p>
        </div>

        {/* ===================================================
            EMPTY STATE
        ==================================================== */}

        {filteredComplaints.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
              <FileText size={30} />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mt-5">
              {complaints.length === 0
                ? "No complaints yet"
                : "No complaints found"}
            </h2>

            <p className="text-slate-500 mt-2">
              {complaints.length === 0
                ? "There are currently no customer complaints."
                : "No complaints match your current search or filters."}
            </p>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-5 inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition"
              >
                <X size={17} />
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* =================================================
             COMPLAINT LIST
          ================================================== */

          <div className="space-y-4">
            {filteredComplaints.map((complaint) => {
              const statusInfo = getStatusInfo(complaint.status);

              return (
                <div
                  key={complaint._id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                      {/* =====================================
                          LEFT CONTENT
                      ====================================== */}

                      <div className="flex-1">
                        {/* TITLE + STATUS */}

                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-bold text-slate-900">
                            {complaint.subject || "Untitled Complaint"}
                          </h2>

                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.className}`}
                          >
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* CATEGORY + DATE + ID */}

                        <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-500">
                          <span className="capitalize">
                            Category: {complaint.category || "other"}
                          </span>

                          <span>•</span>

                          <span>
                            Submitted: {formatDate(complaint.createdAt)}
                          </span>

                          <span>•</span>

                          <span className="font-mono text-xs">
                            ID: {complaint._id || "—"}
                          </span>
                        </div>

                        {/* CUSTOMER / PROVIDER / BOOKING */}

                        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* CUSTOMER */}

                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <p className="text-xs font-semibold text-slate-400 uppercase">
                              Customer
                            </p>

                            <p className="font-semibold text-slate-900 mt-1">
                              {complaint.customer?.name || "Unknown"}
                            </p>

                            <p className="text-sm text-slate-500 mt-1 break-all">
                              {complaint.customer?.email || "No email"}
                            </p>
                          </div>

                          {/* PROVIDER */}

                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <p className="text-xs font-semibold text-slate-400 uppercase">
                              Provider
                            </p>

                            <p className="font-semibold text-slate-900 mt-1">
                              {complaint.provider?.businessName ||
                                "Not specified"}
                            </p>
                          </div>

                          {/* BOOKING */}

                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <p className="text-xs font-semibold text-slate-400 uppercase">
                              Booking
                            </p>

                            <p className="font-semibold text-slate-900 mt-1 break-all">
                              {complaint.booking?._id || "Not linked"}
                            </p>
                          </div>
                        </div>

                        {/* DESCRIPTION */}

                        <div className="mt-5">
                          <p className="text-sm font-semibold text-slate-500 mb-2">
                            Complaint
                          </p>

                          <p className="text-slate-700 leading-6 line-clamp-2">
                            {complaint.description ||
                              "No description provided."}
                          </p>
                        </div>
                      </div>

                      {/* =====================================
                          ACTION
                      ====================================== */}

                      <div>
                        <Link
                          to={`/admin/complaints/${complaint._id}`}
                          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                        >
                          <Eye size={17} />
                          View Details
                        </Link>
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

export default Complaints;
