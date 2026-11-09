import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  FolderTree,
  Image as ImageIcon,
  AlertCircle,
  Power,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import API from "../services/api";

const ManageCategories = () => {
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  // Prevent older requests from overwriting newer results.
  const requestIdRef = useRef(0);

  // ==========================================
  // AUTH ERROR HANDLER
  // ==========================================

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/admin/login");
  }, [navigate]);

  // ==========================================
  // FETCH CATEGORIES
  // SERVER-SIDE SEARCH + FILTER + PAGINATION
  // ==========================================

  const fetchCategories = useCallback(
    async (showRefresh = false) => {
      const requestId = ++requestIdRef.current;

      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = {
          page: currentPage,
          limit,
          search: search.trim(),
        };

        if (statusFilter !== "All") {
          params.status = statusFilter;
        }

        const response = await API.get("/categories/admin/all", {
          params,
        });

        // Ignore outdated responses.
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (response?.data?.success) {
          const fetchedCategories = Array.isArray(response.data.categories)
            ? response.data.categories
            : [];

          const serverPagination = response.data.pagination || {};

          const total = Number(
            serverPagination.total ?? fetchedCategories.length,
          );

          const totalPages = Number(
            serverPagination.totalPages ?? Math.ceil(total / limit),
          );

          // If the current page no longer exists, return to
          // the last available page.
          if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
            return;
          }

          setCategories(fetchedCategories);

          setPagination({
            page: Number(serverPagination.page ?? currentPage),
            limit: Number(serverPagination.limit ?? limit),
            total,
            totalPages,
            hasNextPage:
              serverPagination.hasNextPage ?? currentPage < totalPages,
            hasPrevPage: serverPagination.hasPrevPage ?? currentPage > 1,
          });
        } else {
          setCategories([]);
          setPagination({
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          });

          setError(response?.data?.message || "Failed to fetch categories.");
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        console.error("Fetch Categories Error:", err);

        if (err?.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        if (err?.response?.status === 403) {
          setError("You are not authorized to manage categories.");
          return;
        }

        setError(
          err?.response?.data?.message ||
            "Failed to fetch categories. Please try again.",
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [currentPage, limit, search, statusFilter, handleUnauthorized],
  );

  // ==========================================
  // INITIAL LOAD + FILTER/PAGE CHANGES
  // ==========================================

  useEffect(() => {
    // Debounce search requests.
    const timer = setTimeout(() => {
      fetchCategories();
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchCategories]);

  // ==========================================
  // STATISTICS
  // ==========================================

  // Total is supplied by the backend for the current
  // search/status filters, not just the current page.
  const totalCategories = pagination.total;

  // Active/inactive figures below describe the current page.
  const activeCategories = categories.filter(
    (category) => category?.isActive === true,
  ).length;

  const inactiveCategories = categories.filter(
    (category) => category?.isActive === false,
  ).length;

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCurrentPage(1);
  };

  // ==========================================
  // DEACTIVATE CATEGORY
  // ==========================================

  const handleDeactivate = async (category) => {
    if (!category?._id) {
      setError("Invalid category ID.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${category.name}"?`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(category._id);
      setError("");

      const response = await API.delete(`/categories/${category._id}`);

      if (response?.data?.success) {
        await fetchCategories(true);
      } else {
        setError(response?.data?.message || "Failed to deactivate category.");
      }
    } catch (err) {
      console.error("Deactivate Category Error:", err);

      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      if (err?.response?.status === 403) {
        setError("You are not authorized to deactivate categories.");
        return;
      }

      setError(
        err?.response?.data?.message || "Failed to deactivate category.",
      );
    } finally {
      setActionLoading("");
    }
  };

  // ==========================================
  // ACTIVATE CATEGORY
  // ==========================================

  const handleActivate = async (category) => {
    if (!category?._id) {
      setError("Invalid category ID.");
      return;
    }

    const confirmed = window.confirm(`Activate "${category.name}"?`);

    if (!confirmed) return;

    try {
      setActionLoading(category._id);
      setError("");

      const response = await API.put(`/categories/${category._id}`, {
        isActive: true,
      });

      if (response?.data?.success) {
        await fetchCategories(true);
      } else {
        setError(response?.data?.message || "Failed to activate category.");
      }
    } catch (err) {
      console.error("Activate Category Error:", err);

      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      if (err?.response?.status === 403) {
        setError("You are not authorized to activate categories.");
        return;
      }

      setError(err?.response?.data?.message || "Failed to activate category.");
    } finally {
      setActionLoading("");
    }
  };

  // ==========================================
  // EDIT CATEGORY
  // ==========================================

  const handleEdit = (id) => {
    if (!id) {
      setError("Invalid category ID.");
      return;
    }

    navigate(`/admin/categories/${id}/edit`);
  };

  // ==========================================
  // CREATE CATEGORY
  // ==========================================

  const handleCreate = () => {
    navigate("/admin/categories/add");
  };

  // ==========================================
  // IMAGE FALLBACK
  // ==========================================

  const handleImageError = (event) => {
    event.currentTarget.style.display = "none";

    const parent = event.currentTarget.parentElement;

    if (parent) {
      parent.classList.add("flex", "items-center", "justify-center");
    }
  };

  // ==========================================
  // PAGE NAVIGATION
  // ==========================================

  const goToPreviousPage = () => {
    if (pagination.hasPrevPage && !loading) {
      setCurrentPage((previous) => Math.max(1, previous - 1));
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNextPage && !loading) {
      setCurrentPage((previous) => previous + 1);
    }
  };

  const handleLimitChange = (event) => {
    setLimit(Number(event.target.value));
    setCurrentPage(1);
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-125 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

              <p className="text-sm font-medium text-slate-600">
                Loading categories...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <FolderTree size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Manage Categories
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Create, edit and manage service categories
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus size={19} />
            Add Category
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">Something went wrong</p>

              <p className="mt-1 text-sm">{error}</p>

              <button
                onClick={() => fetchCategories(true)}
                disabled={refreshing}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                Retry
              </button>
            </div>

            <button
              onClick={() => setError("")}
              className="text-sm font-medium text-red-600 hover:text-red-800"
            >
              Close
            </button>
          </div>
        )}

        {/* STATISTICS */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Matching Categories
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalCategories}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FolderTree size={22} />
              </div>
            </div>
          </div>

          {/* ACTIVE ON CURRENT PAGE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active on This Page
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {activeCategories}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle size={22} />
              </div>
            </div>
          </div>

          {/* INACTIVE ON CURRENT PAGE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Inactive on This Page
                </p>

                <p className="mt-2 text-3xl font-bold text-red-600">
                  {inactiveCategories}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <XCircle size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH + FILTERS */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* SEARCH */}

            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search category name or description..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* PAGE SIZE */}

            <select
              value={limit}
              onChange={handleLimitChange}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              title="Categories per page"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>

            {/* REFRESH */}

            <button
              onClick={() => fetchCategories(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            {/* CLEAR */}

            {(search || statusFilter !== "All") && (
              <button
                onClick={clearFilters}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* RESULTS HEADER */}

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Categories</h2>

            <p className="text-sm text-slate-500">
              {totalCategories}{" "}
              {totalCategories === 1 ? "category" : "categories"} found
              {totalCategories > 0 && (
                <>
                  {" "}
                  • Page {currentPage} of {pagination.totalPages}
                </>
              )}
            </p>
          </div>

          {loading && (
            <span className="inline-flex items-center gap-2 text-sm text-indigo-600">
              <RefreshCw size={15} className="animate-spin" />
              Updating...
            </span>
          )}
        </div>

        {/* EMPTY STATE */}

        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FolderTree size={30} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              No categories found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {search || statusFilter !== "All"
                ? "Try changing your search or filters."
                : "You haven't created any categories yet."}
            </p>

            {search || statusFilter !== "All" ? (
              <button
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={18} />
                Create Category
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-212.5">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Category
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Description
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Created
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {categories.map((category) => {
                      const isProcessing = actionLoading === category?._id;

                      return (
                        <tr
                          key={category?._id}
                          className="transition hover:bg-slate-50/70"
                        >
                          {/* CATEGORY */}

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                                {category?.image ? (
                                  <img
                                    src={category.image}
                                    alt={category.name || "Category"}
                                    className="h-full w-full object-cover"
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <ImageIcon size={22} />
                                )}
                              </div>

                              <div>
                                <p className="font-bold text-slate-900">
                                  {category?.name || "Unnamed Category"}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  ID: {category?._id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* DESCRIPTION */}

                          <td className="max-w-sm px-6 py-5">
                            <p className="line-clamp-2 text-sm text-slate-600">
                              {category?.description || "No description added"}
                            </p>
                          </td>

                          {/* STATUS */}

                          <td className="px-6 py-5">
                            {category?.isActive ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                <CheckCircle size={14} />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                                <XCircle size={14} />
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* CREATED */}

                          <td className="px-6 py-5 text-sm text-slate-500">
                            {category?.createdAt
                              ? new Date(
                                  category.createdAt,
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          {/* ACTIONS */}

                          <td className="px-6 py-5">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(category?._id)}
                                disabled={isProcessing}
                                title="Edit category"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Edit size={16} />
                              </button>

                              {category?.isActive ? (
                                <button
                                  onClick={() => handleDeactivate(category)}
                                  disabled={isProcessing}
                                  title="Deactivate category"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing ? (
                                    <RefreshCw
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivate(category)}
                                  disabled={isProcessing}
                                  title="Activate category"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing ? (
                                    <RefreshCw
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Power size={16} />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE CARDS */}

            <div className="space-y-4 md:hidden">
              {categories.map((category) => {
                const isProcessing = actionLoading === category?._id;

                return (
                  <div
                    key={category?._id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    {/* TOP */}

                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                        {category?.image ? (
                          <img
                            src={category.image}
                            alt={category?.name || "Category"}
                            className="h-full w-full object-cover"
                            onError={handleImageError}
                          />
                        ) : (
                          <ImageIcon size={24} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="truncate font-bold text-slate-900">
                            {category?.name || "Unnamed Category"}
                          </h3>

                          {category?.isActive ? (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                              Active
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
                              Inactive
                            </span>
                          )}
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                          {category?.description || "No description added"}
                        </p>
                      </div>
                    </div>

                    {/* META */}

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>
                          Created{" "}
                          {category?.createdAt
                            ? new Date(category.createdAt).toLocaleDateString()
                            : "—"}
                        </span>

                        <span>
                          {category?._id ? category._id.slice(-6) : "—"}
                        </span>
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleEdit(category?._id)}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Edit size={16} />
                        Edit
                      </button>

                      {category?.isActive ? (
                        <button
                          onClick={() => handleDeactivate(category)}
                          disabled={isProcessing}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(category)}
                          disabled={isProcessing}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Power size={16} />
                          )}
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* PAGINATION */}

        {totalCategories > 0 && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {Math.min((currentPage - 1) * limit + 1, totalCategories)}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * limit, totalCategories)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {totalCategories}
              </span>{" "}
              categories
            </p>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <button
                onClick={goToPreviousPage}
                disabled={!pagination.hasPrevPage || loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
                {currentPage} / {Math.max(pagination.totalPages, 1)}
              </span>

              <button
                onClick={goToNextPage}
                disabled={!pagination.hasNextPage || loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCategories;
