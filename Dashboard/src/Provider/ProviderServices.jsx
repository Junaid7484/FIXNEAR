import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Briefcase,
  IndianRupee,
  X,
} from "lucide-react";

import API from "../services/api";

const ProviderServices = () => {
  const [providerServices, setProviderServices] = useState([]);
  const [masterServices, setMasterServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [masterServicesLoading, setMasterServicesLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [form, setForm] = useState({
    service: "",
    price: "",
    description: "",
  });

  // ========================================
  // FETCH PROVIDER SERVICES
  // ========================================

  const fetchProviderServices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/providers/services/my");

      console.log("PROVIDER SERVICES API RESPONSE:", response.data);

      setProviderServices(
        Array.isArray(response.data?.services) ? response.data.services : [],
      );
    } catch (err) {
      console.error("Fetch Provider Services Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("provider");

        window.location.href = "/login";
        return;
      }

      setError(err.response?.data?.message || "Failed to load your services.");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FETCH MASTER SERVICES
  // ========================================

  const fetchMasterServices = async () => {
    try {
      setMasterServicesLoading(true);

      const response = await API.get("/services");

      console.log("MASTER SERVICES API RESPONSE:", response.data);

      let services = [];

      // Expected backend response:
      // {
      //   success: true,
      //   count: 3,
      //   services: [...]
      // }

      if (Array.isArray(response.data?.services)) {
        services = response.data.services;
      }

      // Fallback if API directly returns an array
      else if (Array.isArray(response.data)) {
        services = response.data;
      }

      // Fallback if backend returns { data: [...] }
      else if (Array.isArray(response.data?.data)) {
        services = response.data.data;
      }

      console.log("MASTER SERVICES ARRAY:", services);

      // Only active master services
      const activeServices = services.filter(
        (service) => service?.isActive !== false,
      );

      console.log("ACTIVE MASTER SERVICES:", activeServices);

      setMasterServices(activeServices);
    } catch (err) {
      console.error("FETCH MASTER SERVICES ERROR:", err);

      setMasterServices([]);
    } finally {
      setMasterServicesLoading(false);
    }
  };

  // ========================================
  // FETCH ALL DATA
  // ========================================

  const fetchAllServices = async () => {
    await Promise.all([fetchProviderServices(), fetchMasterServices()]);
  };

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    fetchAllServices();
  }, []);

  // ========================================
  // FORM HANDLER
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ========================================
  // OPEN ADD MODAL
  // ========================================

  const openAddModal = () => {
    setEditingService(null);

    setForm({
      service: "",
      price: "",
      description: "",
    });

    setShowModal(true);

    // Refresh master services whenever
    // Add Service modal is opened.
    fetchMasterServices();
  };

  // ========================================
  // OPEN EDIT MODAL
  // ========================================

  const openEditModal = (providerService) => {
    setEditingService(providerService);

    setForm({
      service: providerService.service?._id || "",
      price: providerService.price ?? "",
      description: providerService.description || "",
    });

    setShowModal(true);
  };

  // ========================================
  // CLOSE MODAL
  // ========================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingService(null);

    setForm({
      service: "",
      price: "",
      description: "",
    });
  };

  // ========================================
  // ADD / UPDATE SERVICE
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingService && !form.service) {
      alert("Please select a service.");
      return;
    }

    if (form.price === "" || Number(form.price) < 0) {
      alert("Please enter a valid price.");
      return;
    }

    try {
      setSaving(true);

      // UPDATE
      if (editingService) {
        await API.put(`/providers/services/my/${editingService._id}`, {
          price: Number(form.price),
          description: form.description,
        });

        alert("Service updated successfully.");
      }

      // ADD
      else {
        await API.post("/providers/services/my", {
          service: form.service,
          price: Number(form.price),
          description: form.description,
        });

        alert("Service added successfully.");
      }

      closeModal();

      await fetchProviderServices();
      await fetchMasterServices();
    } catch (err) {
      console.error("Save Provider Service Error:", err);

      alert(err.response?.data?.message || "Failed to save service.");
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // TOGGLE ACTIVE STATUS
  // ========================================

  const toggleServiceStatus = async (providerService) => {
    try {
      await API.put(`/providers/services/my/${providerService._id}`, {
        isActive: !providerService.isActive,
      });

      await fetchProviderServices();
    } catch (err) {
      console.error("Toggle Service Error:", err);

      alert(err.response?.data?.message || "Failed to update service status.");
    }
  };

  // ========================================
  // REMOVE SERVICE
  // ========================================

  const handleDelete = async (providerService) => {
    const serviceName = providerService.service?.name || "this service";

    const confirmed = window.confirm(
      `Are you sure you want to remove ${serviceName}?`,
    );

    if (!confirmed) return;

    try {
      await API.delete(`/providers/services/my/${providerService._id}`);

      await fetchProviderServices();

      alert("Service removed successfully.");
    } catch (err) {
      console.error("Delete Provider Service Error:", err);

      alert(err.response?.data?.message || "Failed to remove service.");
    }
  };

  // ========================================
  // SEARCH
  // ========================================

  const filteredServices = providerServices.filter((providerService) => {
    const serviceName = providerService.service?.name || "";

    const category = providerService.service?.category || "";

    const description = providerService.description || "";

    const searchText = search.toLowerCase();

    return (
      serviceName.toLowerCase().includes(searchText) ||
      category.toLowerCase().includes(searchText) ||
      description.toLowerCase().includes(searchText)
    );
  });

  // ========================================
  // AVAILABLE MASTER SERVICES
  // ========================================

  // IMPORTANT:
  // Do not remove master services here.
  // We want all master services visible
  // inside the dropdown.

  const availableMasterServices = masterServices;

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={32}
            className="animate-spin text-indigo-600 mx-auto mb-3"
          />

          <p className="text-slate-600 font-medium">Loading your services...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 max-w-md w-full text-center">
          <XCircle size={42} className="text-red-500 mx-auto mb-4" />

          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Unable to load services
          </h2>

          <p className="text-slate-500 mb-6">{error}</p>

          <button
            onClick={fetchAllServices}
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // MAIN UI
  // ========================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}

      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Briefcase size={22} className="text-indigo-600" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  My Services
                </h1>

                <p className="text-sm text-slate-500">
                  Manage the services you offer on FIXNEAR
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus size={18} />
            Add Service
          </button>
        </div>
      </div>

      {/* CONTENT */}

      <div className="max-w-7xl mx-auto">
        {/* TOP BAR */}

        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search your services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              onClick={fetchAllServices}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>
        </div>

        {/* EMPTY STATE */}

        {filteredServices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-14 text-center shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Briefcase size={28} className="text-indigo-600" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {search ? "No services found" : "No services added yet"}
            </h2>

            <p className="text-slate-500 max-w-md mx-auto mb-6">
              {search
                ? "Try another search term."
                : "Add the services you provide so customers can find and book you."}
            </p>

            {!search && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                <Plus size={18} />
                Add Your First Service
              </button>
            )}
          </div>
        ) : (
          /* SERVICE GRID */

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredServices.map((providerService) => {
              const service = providerService.service;

              return (
                <div
                  key={providerService._id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  {/* IMAGE */}

                  <div className="h-44 bg-slate-100 overflow-hidden">
                    {service?.image ? (
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Briefcase size={42} className="text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* BODY */}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {service?.name || "Service"}
                        </h3>

                        {service?.category && (
                          <span className="inline-block mt-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                            {service.category}
                          </span>
                        )}
                      </div>

                      <div>
                        {providerService.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                            <CheckCircle size={13} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            <XCircle size={13} />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 min-h-[42px] mb-5">
                      {providerService.description ||
                        service?.description ||
                        "No description available."}
                    </p>

                    {/* PRICE */}

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Your Price
                        </p>

                        <div className="flex items-center gap-1 text-xl font-bold text-slate-900">
                          <IndianRupee size={18} />

                          {Number(providerService.price || 0).toLocaleString(
                            "en-IN",
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-1">Bookings</p>

                        <p className="font-semibold text-slate-700">
                          {providerService.bookingCount || 0}
                        </p>
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div className="flex gap-2 mt-5">
                      <button
                        onClick={() => openEditModal(providerService)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition"
                      >
                        <Edit size={16} />
                        Edit
                      </button>

                      <button
                        onClick={() => toggleServiceStatus(providerService)}
                        className={`px-3 py-2.5 rounded-xl font-medium transition ${
                          providerService.isActive
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                        title={
                          providerService.isActive ? "Deactivate" : "Activate"
                        }
                      >
                        {providerService.isActive ? (
                          <XCircle size={17} />
                        ) : (
                          <CheckCircle size={17} />
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(providerService)}
                        className="px-3 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                        title="Remove service"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingService ? "Edit Service" : "Add Service"}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {editingService
                    ? "Update your service details."
                    : "Add a service you provide to customers."}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* SERVICE SELECT */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Service
                </label>

                {editingService ? (
                  <div className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700">
                    {editingService.service?.name || "Selected Service"}
                  </div>
                ) : (
                  <>
                    <select
                      name="service"
                      value={form.service}
                      onChange={handleChange}
                      required
                      disabled={masterServicesLoading}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {masterServicesLoading
                          ? "Loading services..."
                          : "Select a service"}
                      </option>

                      {availableMasterServices.map((masterService) => {
                        const alreadyAdded = providerServices.some(
                          (providerService) =>
                            providerService.service?._id === masterService._id,
                        );

                        return (
                          <option
                            key={masterService._id}
                            value={masterService._id}
                            disabled={alreadyAdded}
                          >
                            {masterService.name}

                            {masterService.category
                              ? ` — ${masterService.category}`
                              : ""}

                            {alreadyAdded ? " (Already Added)" : ""}
                          </option>
                        );
                      })}
                    </select>

                    {/* NO MASTER SERVICES MESSAGE */}

                    {!masterServicesLoading &&
                      availableMasterServices.length === 0 && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                          <p className="text-sm text-amber-700">
                            No active services are available right now.
                          </p>

                          <p className="text-xs text-amber-600 mt-1">
                            Please ask the admin to create an active service.
                          </p>
                        </div>
                      )}

                    {/* AVAILABLE SERVICES COUNT */}

                    {!masterServicesLoading &&
                      availableMasterServices.length > 0 && (
                        <p className="text-xs text-slate-400 mt-2">
                          {availableMasterServices.length} master service
                          {availableMasterServices.length !== 1 ? "s" : ""}{" "}
                          available
                        </p>
                      )}
                  </>
                )}
              </div>

              {/* PRICE */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Your Price
                </label>

                <div className="relative">
                  <IndianRupee
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    required
                    placeholder="Enter your service price"
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Describe the service you provide..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none resize-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* BUTTONS */}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || (!editingService && !form.service)}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingService
                      ? "Update Service"
                      : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderServices;
