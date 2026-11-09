import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  Trash2,
  X,
  Loader2,
  Eye,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import API from "../services/api";

const ManageUsers = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Helper to extract image safely across multiple backend schema styles
  const getUserImage = (user) => {
    return (
      user?.profileImage || user?.avatar || user?.image || user?.photo || ""
    );
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    navigate("/admin/login");
  };

  const handleApiError = (error, defaultMessage = "Something went wrong.") => {
    console.error(error);

    const status = error?.response?.status;
    const message = error?.response?.data?.message || defaultMessage;

    if (status === 401) {
      handleUnauthorized();
      return;
    }

    if (status === 403) {
      alert("You are not authorized to perform this action.");
      return;
    }

    alert(message);
  };

  const fetchUsers = async (showRefreshLoader = false) => {
    try {
      setLoadError("");
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await API.get("/admin/users");

      if (response.data?.success) {
        // Filter out any providers and admins from the initial data
        const allUsers = response.data.users || [];
        const customersOnly = allUsers.filter((u) => {
          const role = (u?.role || "").toLowerCase();
          return role === "customer" || role === "user" || !role;
        });

        setUsers(customersOnly);
      } else {
        setUsers([]);
        setLoadError(response.data?.message || "Failed to load users.");
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to load users.";

      setLoadError(message);
      handleApiError(error, "Failed to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        user.name?.toLowerCase().includes(searchText) ||
        user.email?.toLowerCase().includes(searchText) ||
        user.phone?.toLowerCase().includes(searchText) ||
        user.city?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && user.isActive === true) ||
        (statusFilter === "Inactive" && user.isActive === false);

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.isActive === true).length;
    const inactive = users.filter((user) => user.isActive === false).length;

    return {
      total,
      active,
      inactive,
    };
  }, [users]);

  const getRoleStyle = (role) => {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
  };

  const getRoleLabel = (role) => {
    if (!role) return "Customer";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getStatusStyle = (isActive) => {
    if (isActive) {
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
    }
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20";
  };

  const getStatusLabel = (isActive) => {
    return isActive ? "Active" : "Inactive";
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleStatusChange = async (user) => {
    if (!user?._id) return;

    const newStatus = !user.isActive;
    const actionText = newStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${user.name}?`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(`status-${user._id}`);

      const response = await API.put(`/admin/users/${user._id}/status`, {
        isActive: newStatus,
      });

      if (response.data?.success) {
        await fetchUsers(true);

        if (selectedUser?._id === user._id) {
          setSelectedUser((previousUser) =>
            previousUser
              ? { ...previousUser, isActive: newStatus }
              : previousUser,
          );
        }

        alert(response.data.message || `User ${actionText}d successfully.`);
      } else {
        alert(response.data?.message || `Failed to ${actionText} user.`);
      }
    } catch (error) {
      handleApiError(error, `Failed to ${actionText} user.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!user?._id) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(`delete-${user._id}`);

      const response = await API.delete(`/admin/users/${user._id}`);

      if (response.data?.success) {
        setUsers((previousUsers) =>
          previousUsers.filter((item) => item._id !== user._id),
        );

        setSelectedUser(null);

        alert(response.data.message || "User deleted successfully.");
      } else {
        alert(response.data?.message || "Failed to delete user.");
      }
    } catch (error) {
      handleApiError(error, "Failed to delete user.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewUser = async (user) => {
    if (!user?._id) return;

    try {
      setSelectedUserLoading(true);
      setSelectedUser(user);

      const response = await API.get(`/admin/users/${user._id}`);

      if (response.data?.success && response.data.user) {
        setSelectedUser(response.data.user);
      } else {
        alert(response.data?.message || "Failed to load user details.");
      }
    } catch (error) {
      handleApiError(error, "Failed to load user details.");
    } finally {
      setSelectedUserLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header / Hero Banner */}
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-blue-950 to-blue-900 px-6 py-8 text-white shadow-xl shadow-blue-950/10 sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10 bg-white/5 blur-xl" />
          <div className="pointer-events-none absolute -bottom-24 right-40 h-64 w-64 rounded-full border border-white/10 bg-blue-400/10 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100 backdrop-blur-md">
                <Sparkles size={14} className="text-amber-300" />
                <span>FixNear Identity & Access</span>
              </div>

              <div className="mb-2 flex items-center gap-2 text-xs text-blue-200/80">
                <span>Dashboard</span>
                <ChevronRight size={12} />
                <span className="text-white font-medium">Manage Customers</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                Customer Management
              </h1>

              <p className="mt-2.5 max-w-xl text-sm leading-6 text-blue-100/80 sm:text-base">
                View, filter, manage account states, and supervise customer
                accounts.
              </p>
            </div>

            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2.5 self-start rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition hover:bg-white/20 active:scale-95 disabled:opacity-60 md:self-center"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              <span>{refreshing ? "Refreshing..." : "Refresh Customers"}</span>
            </button>
          </div>
        </section>

        {/* API Error Notification */}
        {loadError && !loading && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4.5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-rose-900">
                  Unable to load customers
                </p>
                <p className="text-xs text-rose-600 mt-0.5">{loadError}</p>
              </div>
            </div>

            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100/80 transition"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              Retry
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Customers
              </span>
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                <Users size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              {stats.total}
            </p>
            <p className="text-xs text-slate-400 mt-1">Registered consumers</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active
              </span>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                <UserCheck size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              {stats.active}
            </p>
            <p className="text-xs text-slate-400 mt-1">Enabled customers</p>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Inactive
              </span>
              <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
                <UserX size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              {stats.inactive}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Suspended / Deactivated
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <section className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone or city..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              {(search || statusFilter !== "All") && (
                <button
                  onClick={clearFilters}
                  className="rounded-xl px-3.5 py-2.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 active:scale-95"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs text-slate-500">
            <span>
              Showing{" "}
              <strong className="text-slate-800">{filteredUsers.length}</strong>{" "}
              of <strong className="text-slate-800">{users.length}</strong>{" "}
              customers
            </span>

            {statusFilter !== "All" && (
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <SlidersHorizontal size={13} />
                Filters active
              </span>
            )}
          </div>
        </section>

        {/* User Content / Tables */}
        {loading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xs">
            <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
            <h3 className="font-semibold text-slate-900">Loading directory</h3>
            <p className="mt-1 text-xs text-slate-400">
              Retrieving customers from database...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xs">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Search size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No matching customers found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Try adjusting your query or reset the filter parameters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-600 active:scale-95"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs lg:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Role
                      </th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Joined
                      </th>
                      <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => {
                      const userImg = getUserImage(user);

                      return (
                        <tr
                          key={user._id}
                          className="group transition-colors hover:bg-blue-50/30"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3.5">
                              {userImg ? (
                                <img
                                  src={userImg}
                                  alt={user.name || "Customer"}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.nextElementSibling?.classList.remove(
                                      "hidden",
                                    );
                                  }}
                                  className="h-10 w-10 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
                                />
                              ) : null}

                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-xs ${
                                  userImg ? "hidden" : ""
                                }`}
                              >
                                {user.name?.charAt(0)?.toUpperCase() || "U"}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {user.name || "Unnamed Customer"}
                                </p>
                                <span className="font-mono text-[11px] text-slate-400">
                                  ID: {user._id?.slice(-8)}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="flex items-center gap-1.5 text-xs text-slate-700">
                                <Mail size={13} className="text-slate-400" />
                                <span className="truncate max-w-[200px]">
                                  {user.email || "—"}
                                </span>
                              </p>
                              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Phone size={13} className="text-slate-400" />
                                <span>{user.phone || "—"}</span>
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${getRoleStyle(
                                user.role,
                              )}`}
                            >
                              {getRoleLabel(user.role)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                                user.isActive,
                              )}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  user.isActive
                                    ? "bg-emerald-500"
                                    : "bg-rose-500"
                                }`}
                              />
                              {getStatusLabel(user.isActive)}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-slate-500">
                            {formatDate(user.createdAt)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedUser(user)}
                                title="View details"
                                className="rounded-xl border border-slate-200/80 bg-white p-2 text-slate-600 shadow-2xs transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
                              >
                                <Eye size={15} />
                              </button>

                              <button
                                onClick={() => handleStatusChange(user)}
                                disabled={
                                  actionLoading === `status-${user._id}`
                                }
                                title={
                                  user.isActive
                                    ? "Deactivate customer"
                                    : "Activate customer"
                                }
                                className={`rounded-xl border p-2 shadow-2xs transition disabled:cursor-not-allowed disabled:opacity-40 active:scale-95 ${
                                  user.isActive
                                    ? "border-rose-200/80 bg-white text-rose-600 hover:bg-rose-50"
                                    : "border-emerald-200/80 bg-white text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {actionLoading === `status-${user._id}` ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : user.isActive ? (
                                  <UserX size={15} />
                                ) : (
                                  <UserCheck size={15} />
                                )}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={
                                  actionLoading === `delete-${user._id}`
                                }
                                title="Delete customer"
                                className="rounded-xl border border-slate-200/80 bg-white p-2 text-slate-400 shadow-2xs transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                              >
                                {actionLoading === `delete-${user._id}` ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {filteredUsers.map((user) => {
                const userImg = getUserImage(user);

                return (
                  <div
                    key={user._id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {userImg ? (
                          <img
                            src={userImg}
                            alt={user.name || "Customer"}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextElementSibling?.classList.remove(
                                "hidden",
                              );
                            }}
                            className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200"
                          />
                        ) : null}

                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white ${
                            userImg ? "hidden" : ""
                          }`}
                        >
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {user.name || "Unnamed Customer"}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {user.email || "No email provided"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                          user.isActive,
                        )}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.isActive ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {getStatusLabel(user.isActive)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-50 p-2.5">
                        <span className="text-slate-400 block mb-1">Role</span>
                        <span
                          className={`inline-block font-semibold px-2 py-0.5 rounded-md ${getRoleStyle(
                            user.role,
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2.5">
                        <span className="text-slate-400 block mb-1">
                          Joined
                        </span>
                        <span className="font-semibold text-slate-700">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-400" />
                        <span>{user.phone || "No phone"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-slate-400" />
                        <span>
                          {user.city || "No city"}
                          {user.state ? `, ${user.state}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3.5">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95"
                      >
                        <Eye size={14} />
                        View
                      </button>

                      <button
                        onClick={() => handleStatusChange(user)}
                        disabled={actionLoading === `status-${user._id}`}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold disabled:opacity-50 active:scale-95 ${
                          user.isActive
                            ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {actionLoading === `status-${user._id}` ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : user.isActive ? (
                          <UserX size={14} />
                        ) : (
                          <UserCheck size={14} />
                        )}
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={actionLoading === `delete-${user._id}`}
                        className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 active:scale-95"
                      >
                        {actionLoading === `delete-${user._id}` ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
            onClick={() => setSelectedUser(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Customer Profile
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customer information & permissions
                  </p>
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {selectedUserLoading ? (
                  <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                    <Loader2
                      size={32}
                      className="animate-spin text-blue-600 mb-3"
                    />
                    <p className="text-xs text-slate-500">
                      Syncing user record...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
                      {getUserImage(selectedUser) ? (
                        <img
                          src={getUserImage(selectedUser)}
                          alt={selectedUser.name || "Customer"}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden",
                            );
                          }}
                          className="h-20 w-20 rounded-3xl object-cover ring-4 ring-slate-100 shadow-sm"
                        />
                      ) : null}

                      <div
                        className={`flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-sm ${
                          getUserImage(selectedUser) ? "hidden" : ""
                        }`}
                      >
                        {selectedUser.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>

                      <h3 className="mt-3.5 text-lg font-bold text-slate-900">
                        {selectedUser.name || "Unnamed Customer"}
                      </h3>

                      <p className="font-mono text-xs text-slate-400">
                        ID: {selectedUser._id}
                      </p>

                      <div className="mt-3 flex flex-wrap justify-center gap-2">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${getRoleStyle(
                            selectedUser.role,
                          )}`}
                        >
                          {getRoleLabel(selectedUser.role)}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                            selectedUser.isActive,
                          )}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              selectedUser.isActive
                                ? "bg-emerald-500"
                                : "bg-rose-500"
                            }`}
                          />
                          {getStatusLabel(selectedUser.isActive)}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                          <Mail size={14} />
                          <span>Email</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 break-all">
                          {selectedUser.email || "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                          <Phone size={14} />
                          <span>Phone</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">
                          {selectedUser.phone || "—"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                          <MapPin size={14} />
                          <span>Location</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">
                          {selectedUser.city || "—"}
                          {selectedUser.state ? `, ${selectedUser.state}` : ""}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                          <CalendarDays size={14} />
                          <span>Joined Date</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">
                          {formatDate(selectedUser.createdAt)}
                        </p>
                      </div>
                    </div>

                    {selectedUser.address && (
                      <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                        <span className="text-slate-400 text-xs font-medium block mb-1">
                          Full Address
                        </span>
                        <p className="text-xs font-semibold text-slate-800">
                          {selectedUser.address}
                        </p>
                      </div>
                    )}

                    {/* Modal Bottom Actions */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => handleStatusChange(selectedUser)}
                        disabled={
                          selectedUserLoading ||
                          actionLoading === `status-${selectedUser._id}`
                        }
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition shadow-xs disabled:opacity-50 active:scale-95 ${
                          selectedUser.isActive
                            ? "bg-rose-600 text-white hover:bg-rose-700"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {actionLoading === `status-${selectedUser._id}` ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : selectedUser.isActive ? (
                          <UserX size={16} />
                        ) : (
                          <UserCheck size={16} />
                        )}
                        {selectedUser.isActive
                          ? "Deactivate Account"
                          : "Activate Account"}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(selectedUser)}
                        disabled={
                          selectedUserLoading ||
                          actionLoading === `delete-${selectedUser._id}`
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-xs font-bold text-rose-600 shadow-2xs transition hover:bg-rose-50 disabled:opacity-50 active:scale-95"
                      >
                        {actionLoading === `delete-${selectedUser._id}` ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Permanently Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
