import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Wrench,
  IndianRupee,
  Clock,
  X,
  Save,
  AlertCircle,
  Image as ImageIcon,
  Tag,
  FileText,
  Eye,
  Power,
  Layers3,
  ChevronDown,
} from "lucide-react";
import API from "../services/api";

const emptyForm = {
  name: "",
  description: "",
  category: "",
  image: "",
  price: "",
  duration: "",
  isActive: true,
};

const ManageServices = () => {
  // =====================================================
  // STATE
  // =====================================================

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [actionId, setActionId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  // =====================================================
  // AUTH ERROR HANDLER
  // =====================================================

  const handleUnauthorized = (err) => {
    if (err?.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/admin/login";
      return true;
    }

    return false;
  };

  // =====================================================
  // FETCH SERVICES
  // =====================================================

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/services/admin/all");

      if (response?.data?.success) {
        setServices(
          Array.isArray(response?.data?.services) ? response.data.services : [],
        );
      } else {
        setServices([]);
        setError(response?.data?.message || "Unable to load services");
      }
    } catch (err) {
      console.error("Fetch Services Error:", err);

      if (handleUnauthorized(err)) {
        return;
      }

      setError(
        err?.response?.data?.message ||
          "Failed to load services. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // =====================================================
  // CLEAR MESSAGES
  // =====================================================

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // =====================================================
  // CATEGORIES
  // =====================================================

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        services.map((service) => service?.category?.trim()).filter(Boolean),
      ),
    ];

    return uniqueCategories.sort((a, b) => a.localeCompare(b));
  }, [services]);

  // =====================================================
  // FILTER SERVICES
  // =====================================================

  const filteredServices = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return services.filter((service) => {
      const name = service?.name?.toLowerCase() || "";
      const description = service?.description?.toLowerCase() || "";
      const category = service?.category?.toLowerCase() || "";

      const matchesSearch =
        !searchText ||
        name.includes(searchText) ||
        description.includes(searchText) ||
        category.includes(searchText);

      const matchesCategory =
        categoryFilter === "All" || service?.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && service?.isActive === true) ||
        (statusFilter === "Inactive" && service?.isActive === false);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [services, search, categoryFilter, statusFilter]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const totalServices = services.length;

  const activeServices = services.filter(
    (service) => service?.isActive === true,
  ).length;

  const inactiveServices = services.filter(
    (service) => service?.isActive !== true,
  ).length;

  // =====================================================
  // OPEN CREATE MODAL
  // =====================================================

  const openCreateModal = () => {
    clearMessages();

    setEditingService(null);

    setImageFile(null);
    setFormData({
      ...emptyForm,
    });

    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (service) => {
    clearMessages();

    setEditingService(service);
    setImageFile(null);

    setFormData({
      name: service?.name || "",
      description: service?.description || "",
      category: service?.category || "",
      image: service?.image || "",
      price:
        service?.price !== undefined && service?.price !== null
          ? service.price
          : "",
      duration: service?.duration || "",
      isActive: service?.isActive !== undefined ? service.isActive : true,
    });

    setShowModal(true);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingService(null);

    setFormData({
      ...emptyForm,
    });

    clearMessages();
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =====================================================
  // FORM VALIDATION
  // =====================================================

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Service name is required");
      return false;
    }

    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }

    if (!formData.category.trim()) {
      setError("Category is required");
      return false;
    }

    if (
      formData.price === "" ||
      !Number.isFinite(Number(formData.price)) ||
      Number(formData.price) <= 0
    ) {
      setError("Price must be a valid number greater than 0");
      return false;
    }

    if (!formData.duration.trim()) {
      setError("Duration is required");
      return false;
    }

    return true;
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a valid image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be 5MB or smaller."); return; }
    setImageFile(file);
    setError("");
  };

  // =====================================================
  // CREATE / UPDATE SERVICE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("description", formData.description.trim());
      payload.append("category", formData.category.trim());
      payload.append("price", String(Number(formData.price)));
      payload.append("duration", formData.duration.trim());
      payload.append("isActive", String(Boolean(formData.isActive)));
      if (imageFile) payload.append("image", imageFile);

      let response;

      if (editingService?._id) {
        response = await API.put(`/services/${editingService._id}`, payload);
      } else {
        response = await API.post("/services", payload);
      }

      if (response?.data?.success) {
        setSuccess(
          editingService
            ? "Service updated successfully"
            : "Service created successfully",
        );

        setShowModal(false);
        setEditingService(null);

        setFormData({
          ...emptyForm,
        });

        await fetchServices();
      } else {
        setError(response?.data?.message || "Failed to save service");
      }
    } catch (err) {
      console.error("Save Service Error:", err);

      if (handleUnauthorized(err)) {
        return;
      }

      setError(err?.response?.data?.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // TOGGLE SERVICE STATUS
  // =====================================================

  const toggleServiceStatus = async (service) => {
    if (!service?._id) {
      return;
    }

    clearMessages();

    const action = service.isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${service.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(service._id);

      await API.put(`/services/${service._id}`, {
        isActive: !service.isActive,
      });

      setSuccess(
        service.isActive
          ? "Service deactivated successfully"
          : "Service activated successfully",
      );

      await fetchServices();
    } catch (err) {
      console.error("Toggle Service Status Error:", err);

      if (handleUnauthorized(err)) {
        return;
      }

      setError(
        err?.response?.data?.message || "Failed to update service status",
      );
    } finally {
      setActionId(null);
    }
  };

  // =====================================================
  // DELETE / DEACTIVATE SERVICE
  // =====================================================

  const handleDelete = async (service) => {
    if (!service?._id) {
      return;
    }

    clearMessages();

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${service.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(service._id);

      const response = await API.delete(`/services/${service._id}`);

      if (response?.data?.success) {
        setSuccess("Service deactivated successfully");

        await fetchServices();
      } else {
        setError(response?.data?.message || "Failed to deactivate service");
      }
    } catch (err) {
      console.error("Delete Service Error:", err);

      if (handleUnauthorized(err)) {
        return;
      }

      setError(err?.response?.data?.message || "Failed to deactivate service");
    } finally {
      setActionId(null);
    }
  };

  // =====================================================
  // IMAGE ERROR HANDLER
  // =====================================================

  const handleImageError = (e) => {
    e.currentTarget.style.display = "none";
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto">
            <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading services...
          </p>

          <p className="text-xs text-slate-400 mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-7">
        <div>
          <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-2">
            <Layers3 className="w-4 h-4" />
            Admin / Services
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Manage Services
          </h1>

          <p className="text-slate-500 mt-2 max-w-xl">
            Create, update and manage the services available on FIXNEAR.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchServices}
            disabled={saving || actionId !== null}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Add Service
          </button>
        </div>
      </div>

      {/* =====================================================
          ERROR MESSAGE
      ===================================================== */}

      {error && !showModal && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <p className="font-medium">{error}</p>

            <button
              type="button"
              onClick={fetchServices}
              className="mt-1.5 text-sm font-semibold underline"
            >
              Retry
            </button>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="p-1 hover:bg-red-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* =====================================================
          SUCCESS MESSAGE
      ===================================================== */}

      {success && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>

          <div className="flex-1 font-medium">{success}</div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="p-1 hover:bg-emerald-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        {/* TOTAL */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Services
              </p>

              <p className="text-3xl font-bold text-slate-900 mt-1">
                {totalServices}
              </p>

              <p className="text-xs text-slate-400 mt-1">All services</p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* ACTIVE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Active Services
              </p>

              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {activeServices}
              </p>

              <p className="text-xs text-slate-400 mt-1">Currently available</p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* INACTIVE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Inactive Services
              </p>

              <p className="text-3xl font-bold text-red-600 mt-1">
                {inactiveServices}
              </p>

              <p className="text-xs text-slate-400 mt-1">Currently disabled</p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTER PANEL
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-7 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-blue-600" />

          <div>
            <h2 className="font-semibold text-slate-900">Find Services</h2>

            <p className="text-xs text-slate-400">
              Search and filter your service catalog
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* CATEGORY */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none w-full px-4 py-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              <option value="All">All Categories</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* STATUS */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none w-full px-4 py-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              <option value="All">All Status</option>

              <option value="Active">Active</option>

              <option value="Inactive">Inactive</option>
            </select>

            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredServices.length}
            </span>{" "}
            service
            {filteredServices.length !== 1 ? "s" : ""}
          </p>

          {(search || categoryFilter !== "All" || statusFilter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategoryFilter("All");
                setStatusFilter("All");
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          DESKTOP TABLE
      ===================================================== */}

      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">
                  Service
                </th>

                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">
                  Category
                </th>

                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">
                  Price
                </th>

                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">
                  Duration
                </th>

                <th className="text-left px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">
                  Status
                </th>

                <th className="text-right px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredServices.map((service) => {
                const isActionLoading = actionId === service._id;

                return (
                  <tr
                    key={service._id}
                    className="hover:bg-slate-50 transition"
                  >
                    {/* SERVICE */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {service?.image ? (
                          <img
                            src={service.image}
                            alt={service.name}
                            onError={handleImageError}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Wrench className="w-6 h-6 text-blue-600" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {service.name}
                          </p>

                          <p className="text-sm text-slate-500 max-w-xs truncate">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* CATEGORY */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-medium text-slate-700">
                        <Tag className="w-3.5 h-3.5" />
                        {service.category}
                      </span>
                    </td>

                    {/* PRICE */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <IndianRupee className="w-4 h-4" />

                        {Number(service.price || 0).toLocaleString("en-IN")}
                      </div>
                    </td>

                    {/* DURATION */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-4 h-4" />

                        {service.duration}
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4">
                      {service.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-semibold">
                          <XCircle className="w-4 h-4" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(service)}
                          disabled={isActionLoading}
                          className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition disabled:opacity-50"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleServiceStatus(service)}
                          disabled={isActionLoading}
                          className={`p-2.5 rounded-xl transition disabled:opacity-50 ${
                            service.isActive
                              ? "text-red-600 bg-red-50 hover:bg-red-100"
                              : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                          }`}
                          title={service.isActive ? "Deactivate" : "Activate"}
                        >
                          {isActionLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : service.isActive ? (
                            <Trash2 className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
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

        {filteredServices.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <Wrench className="w-7 h-7 text-slate-400" />
            </div>

            <p className="mt-4 font-semibold text-slate-700">
              No services found
            </p>

            <p className="text-sm text-slate-400 mt-1">
              Try changing your search or filters.
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
          MOBILE CARDS
      ===================================================== */}

      <div className="lg:hidden space-y-4">
        {filteredServices.map((service) => {
          const isActionLoading = actionId === service._id;

          return (
            <div
              key={service._id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {service?.image ? (
                    <img
                      src={service.image}
                      alt={service.name}
                      onError={handleImageError}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-6 h-6 text-blue-600" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">
                      {service.name}
                    </h3>

                    <p className="text-sm text-slate-500">{service.category}</p>
                  </div>
                </div>

                {service.isActive ? (
                  <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-semibold whitespace-nowrap">
                    Active
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 bg-red-50 text-red-700 rounded-lg font-semibold whitespace-nowrap">
                    Inactive
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-600 mt-4 leading-6">
                {service.description}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-slate-400">Price</p>

                  <div className="flex items-center gap-1 font-bold text-slate-800 mt-1">
                    <IndianRupee className="w-4 h-4" />

                    {Number(service.price || 0).toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-slate-400">Duration</p>

                  <div className="flex items-center gap-1 font-bold text-slate-800 mt-1">
                    <Clock className="w-4 h-4" />

                    {service.duration}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => openEditModal(service)}
                  disabled={isActionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-blue-200 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 disabled:opacity-50"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => toggleServiceStatus(service)}
                  disabled={isActionLoading}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold disabled:opacity-50 ${
                    service.isActive
                      ? "border border-red-200 text-red-600 hover:bg-red-50"
                      : "border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {isActionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : service.isActive ? (
                    <>
                      <Power className="w-4 h-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Activate
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {filteredServices.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <Wrench className="w-7 h-7 text-slate-400" />
            </div>

            <p className="mt-4 font-semibold text-slate-700">
              No services found
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
          CREATE / EDIT SERVICE MODAL
          REDESIGNED FORM
      ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl max-h-[94vh] overflow-hidden flex flex-col">
            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="relative overflow-hidden bg-slate-950 text-white flex-shrink-0">
              <div className="absolute -top-24 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl" />

              <div className="absolute -bottom-28 left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

              <div className="relative px-5 sm:px-7 py-5 sm:py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                      {editingService ? (
                        <Edit className="w-6 h-6 text-white" />
                      ) : (
                        <Wrench className="w-6 h-6 text-white" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
                          {editingService ? "Service Editor" : "New Service"}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-bold">
                        {editingService ? "Edit Service" : "Create Service"}
                      </h2>

                      <p className="text-sm text-slate-400 mt-1">
                        {editingService
                          ? "Update the information of this FIXNEAR service."
                          : "Add a new service to your FIXNEAR catalog."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* =================================================
                MODAL CONTENT
            ================================================= */}

            <div className="overflow-y-auto flex-1">
              {/* MODAL ERROR */}

              {error && (
                <div className="mx-5 sm:mx-7 mt-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      Unable to save service
                    </p>

                    <p className="text-sm mt-0.5">{error}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="p-1 hover:bg-red-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form
                id="service-form"
                onSubmit={handleSubmit}
                className="p-5 sm:p-7 space-y-6"
              >
                {/* =================================================
                    SECTION 1 - BASIC INFORMATION
                ================================================= */}

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Basic Information
                      </h3>

                      <p className="text-xs text-slate-400">
                        Give your service a clear identity.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-5">
                    {/* SERVICE NAME */}

                    <div>
                      <label className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-2">
                        <span>
                          Service Name
                          <span className="text-red-500 ml-1">*</span>
                        </span>

                        <span className="text-xs font-normal text-slate-400">
                          {formData.name.length}/100
                        </span>
                      </label>

                      <div className="relative">
                        <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          maxLength={100}
                          placeholder="e.g. Fan Installation & Repair"
                          disabled={saving}
                          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:bg-slate-100"
                        />
                      </div>
                    </div>

                    {/* DESCRIPTION */}

                    <div>
                      <label className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-2">
                        <span>
                          Description
                          <span className="text-red-500 ml-1">*</span>
                        </span>

                        <span className="text-xs font-normal text-slate-400">
                          {formData.description.length}/500
                        </span>
                      </label>

                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={5}
                        maxLength={500}
                        placeholder="Describe what customers can expect from this service..."
                        disabled={saving}
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </section>

                {/* =================================================
                    SECTION 2 - SERVICE DETAILS
                ================================================= */}

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Tag className="w-4 h-4" />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Service Details
                      </h3>

                      <p className="text-xs text-slate-400">
                        Define category, pricing and duration.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CATEGORY */}

                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Category
                        <span className="text-red-500 ml-1">*</span>
                      </label>

                      <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                        <input
                          type="text"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          placeholder="e.g. Electrical"
                          disabled={saving}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:bg-slate-100"
                        />
                      </div>
                    </div>

                    {/* PRICE */}

                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Service Price
                        <span className="text-red-500 ml-1">*</span>
                      </label>

                      <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          min="1"
                          step="0.01"
                          placeholder="500"
                          disabled={saving}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:bg-slate-100"
                        />
                      </div>
                    </div>

                    {/* DURATION */}

                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Service Duration
                        <span className="text-red-500 ml-1">*</span>
                      </label>

                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                        <input
                          type="text"
                          name="duration"
                          value={formData.duration}
                          onChange={handleChange}
                          placeholder="e.g. 1-2 hours"
                          disabled={saving}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:bg-slate-100"
                        />
                      </div>
                    </div>

                    {/* STATUS */}

                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Service Status
                      </label>

                      <label className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              formData.isActive
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            <Power className="w-5 h-5" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {formData.isActive
                                ? "Service is active"
                                : "Service is inactive"}
                            </p>

                            <p className="text-xs text-slate-400">
                              {formData.isActive
                                ? "Customers can access this service."
                                : "This service is hidden from customers."}
                            </p>
                          </div>
                        </div>

                        <div className="relative">
                          <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            disabled={saving}
                            className="sr-only peer"
                          />

                          <div className="w-12 h-7 bg-slate-300 rounded-full peer-checked:bg-emerald-500 transition" />

                          <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm transition peer-checked:translate-x-5" />
                        </div>
                      </label>
                    </div>
                  </div>
                </section>

                {/* =================================================
                    SECTION 3 - IMAGE
                ================================================= */}

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Service Image
                      </h3>

                      <p className="text-xs text-slate-400">
                        Upload an image to visually represent the service.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* URL INPUT */}

                    <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl p-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Upload Image
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageFileChange}
                        disabled={saving}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
                      />
                      <p className="text-xs text-slate-400 mt-2">
                        JPG, JPEG, PNG or WEBP. Maximum 5MB. Leave empty while editing to keep the current image.
                      </p>
                    </div>

                    {/* PREVIEW */}

                    <div className="md:col-span-2">
                      <div className="h-full min-h-[150px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                        {imageFile || formData.image ? (
                          <>
                            <img
                              src={imageFile ? URL.createObjectURL(imageFile) : formData.image}
                              alt="Service preview"
                              className="w-full h-full min-h-[150px] object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />

                            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950/70 backdrop-blur text-white text-xs rounded-lg">
                              <Eye className="w-3.5 h-3.5" />
                              Preview
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                              <ImageIcon className="w-6 h-6 text-slate-400" />
                            </div>

                            <p className="text-sm font-semibold text-slate-500 mt-3">
                              Image Preview
                            </p>

                            <p className="text-xs text-slate-400 mt-1">
                              Upload an image
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* =================================================
                    SERVICE SUMMARY
                ================================================= */}

                <section className="bg-slate-950 rounded-2xl p-5 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-blue-300 font-bold">
                        Service Summary
                      </p>

                      <h3 className="text-lg font-bold mt-1">
                        {formData.name || "Untitled Service"}
                      </h3>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        formData.isActive
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {formData.isActive ? "ACTIVE" : "INACTIVE"}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-5">
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-slate-400">Category</p>

                      <p className="text-sm font-semibold mt-1 truncate">
                        {formData.category || "Not set"}
                      </p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-slate-400">Price</p>

                      <p className="text-sm font-semibold mt-1">
                        ₹
                        {formData.price
                          ? Number(formData.price).toLocaleString("en-IN")
                          : "0"}
                      </p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-slate-400">Duration</p>

                      <p className="text-sm font-semibold mt-1 truncate">
                        {formData.duration || "Not set"}
                      </p>
                    </div>
                  </div>
                </section>
              </form>
            </div>

            {/* =================================================
                STICKY FOOTER
            ================================================= */}

            <div className="flex-shrink-0 border-t border-slate-200 bg-white px-5 sm:px-7 py-4">
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Fields marked with <span className="text-red-500">*</span> are
                  required.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="px-5 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    form="service-form"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />

                        {editingService ? "Update Service" : "Create Service"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageServices;
