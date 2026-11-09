import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BriefcaseBusiness,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Ban,
  RefreshCw,
  FileText,
  Wrench,
  Timer,
  IndianRupee,
  Activity,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleX,
  AlertCircle,
  Power,
  ExternalLink,
} from "lucide-react";
import API from "../services/api";

const ProviderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [expandedSections, setExpandedSections] = useState({
    services: true,
    workingHours: false,
    documents: false,
  });

  const fetchProvider = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      // After: Add "/admin" to match your admin route
      const response = await API.get(`/admin/providers/${id}`);

      if (response?.data?.success) {
        setProvider(response.data.provider);
      } else {
        setProvider(response?.data?.provider || response?.data);
      }
    } catch (err) {
      console.error("Provider details error:", err);

      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/admin/login");
        return;
      }

      if (err?.response?.status === 403) {
        setError("You are not authorized to view this provider.");
      } else if (err?.response?.status === 404) {
        setError("Provider not found.");
      } else {
        setError(
          err?.response?.data?.message || "Failed to load provider details.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProvider();
  }, [id]);

  const handleAction = async (action) => {
    if (!provider?._id || actionLoading) return;

    const actionMessages = {
      verify: "Are you sure you want to verify this provider?",
      reject: "Are you sure you want to reject this provider's verification?",
      suspend:
        "Are you sure you want to suspend this provider? The provider will not be able to operate normally.",
      activate: "Are you sure you want to activate this provider?",
    };

    const message = actionMessages[action];

    if (message && !window.confirm(message)) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await API.put(`/providers/${provider._id}/${action}`);

      await fetchProvider(true);
    } catch (err) {
      console.error("Provider action error:", err);

      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/admin/login");
        return;
      }

      setError(err?.response?.data?.message || `Failed to ${action} provider.`);
    } finally {
      setActionLoading(false);
    }
  };

  const getUser = () => {
    if (!provider?.user) return {};

    if (typeof provider.user === "object") {
      return provider.user;
    }

    return {};
  };

  const user = getUser();

  const providerServices = useMemo(() => {
    if (!provider) return [];

    if (Array.isArray(provider.providerServices)) {
      return provider.providerServices;
    }

    if (Array.isArray(provider.services)) {
      return provider.services;
    }

    return [];
  }, [provider]);

  const serviceCategories = useMemo(() => {
    const categories = providerServices
      .map((item) => {
        if (item?.service?.category) {
          return item.service.category;
        }

        if (item?.category) {
          return item.category;
        }

        return null;
      })
      .filter(Boolean);

    return [...new Set(categories)];
  }, [providerServices]);

  const isVerified = Boolean(provider?.isVerified);

  /*
   * IMPORTANT:
   * Provider schema does not have isActive.
   * Suspension/activation is controlled through User.isActive.
   */
  const isAccountActive = user?.isActive !== false;

  const isAvailable = provider?.isAvailable !== false;

  const formatDate = (date) => {
    if (!date) return "Not available";

    try {
      return new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "Not available";
    }
  };

  const formatTime = (time) => {
    if (!time) return "--";

    const [hours, minutes] = time.split(":");
    const date = new Date();

    date.setHours(Number(hours));
    date.setMinutes(Number(minutes));

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleSection = (section) => {
    setExpandedSections((previous) => ({
      ...previous,
      [section]: !previous[section],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto text-blue-600" />

          <p className="mt-4 text-gray-700 font-medium">
            Loading provider details...
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Please wait while we fetch the provider information.
          </p>
        </div>
      </div>
    );
  }

  if (error && !provider) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate("/admin/providers")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Providers
          </button>

          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 md:p-12 text-center">
            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />

            <h2 className="text-xl font-bold text-gray-900">
              Unable to Load Provider
            </h2>

            <p className="text-gray-600 mt-2 max-w-md mx-auto">{error}</p>

            <button
              onClick={() => fetchProvider()}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ========================================================= */}
        {/* HEADER */}
        {/* ========================================================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <button
              onClick={() => navigate("/admin/providers")}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Providers
            </button>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Provider Details
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              View and manage provider account information.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fetchProvider(true)}
              disabled={refreshing || actionLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            {!isVerified && (
              <button
                disabled={actionLoading}
                onClick={() => handleAction("verify")}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                <ShieldCheck className="w-4 h-4" />

                {actionLoading ? "Processing..." : "Verify"}
              </button>
            )}

            {isVerified && (
              <button
                disabled={actionLoading}
                onClick={() => handleAction("reject")}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
              >
                <XCircle className="w-4 h-4" />

                {actionLoading ? "Processing..." : "Reject"}
              </button>
            )}

            {isAccountActive ? (
              <button
                disabled={actionLoading}
                onClick={() => handleAction("suspend")}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                <Ban className="w-4 h-4" />

                {actionLoading ? "Processing..." : "Suspend"}
              </button>
            ) : (
              <button
                disabled={actionLoading}
                onClick={() => handleAction("activate")}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <Power className="w-4 h-4" />

                {actionLoading ? "Processing..." : "Activate"}
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* ERROR */}
        {/* ========================================================= */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />

            <div className="flex-1">
              <p className="font-medium text-red-800">Action failed</p>

              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>

            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* PROVIDER PROFILE HEADER */}
        {/* ========================================================= */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="p-5 md:p-7">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile image */}
              <div className="shrink-0">
                <div className="w-28 h-28 rounded-2xl bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200">
                  {provider?.profileImage ? (
                    <img
                      src={provider.profileImage}
                      alt={provider?.businessName || "Provider"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-blue-600" />
                  )}
                </div>
              </div>

              {/* Main information */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {provider?.businessName || "Unnamed Provider"}
                  </h2>

                  {isVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                      <Clock className="w-4 h-4" />
                      Pending Verification
                    </span>
                  )}

                  {isAccountActive ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      <Activity className="w-4 h-4" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                      <Ban className="w-4 h-4" />
                      Suspended
                    </span>
                  )}
                </div>

                <p className="text-gray-600 mt-3 leading-relaxed max-w-3xl">
                  {provider?.description ||
                    "No description provided by the provider."}
                </p>

                {/* Categories */}
                {serviceCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {serviceCategories.map((category) => (
                      <span
                        key={category}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  <QuickStat
                    icon={<Star className="w-4 h-4" />}
                    label="Rating"
                    value={`${provider?.rating || 0}/5`}
                  />

                  <QuickStat
                    icon={<User className="w-4 h-4" />}
                    label="Reviews"
                    value={provider?.totalReviews || 0}
                  />

                  <QuickStat
                    icon={<BriefcaseBusiness className="w-4 h-4" />}
                    label="Experience"
                    value={`${provider?.experience || 0} yrs`}
                  />

                  <QuickStat
                    icon={<CheckCircle className="w-4 h-4" />}
                    label="Completed"
                    value={provider?.completedBookings || 0}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* STATUS OVERVIEW */}
        {/* ========================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <OverviewCard
            icon={<ShieldCheck className="w-6 h-6" />}
            title="Verification"
            value={isVerified ? "Verified" : "Not Verified"}
            active={isVerified}
          />

          <OverviewCard
            icon={<Power className="w-6 h-6" />}
            title="Account"
            value={isAccountActive ? "Active" : "Suspended"}
            active={isAccountActive}
          />

          <OverviewCard
            icon={<Wrench className="w-6 h-6" />}
            title="Services"
            value={`${providerServices.length} Services`}
            active={providerServices.length > 0}
          />

          <OverviewCard
            icon={<Activity className="w-6 h-6" />}
            title="Availability"
            value={isAvailable ? "Available" : "Unavailable"}
            active={isAvailable}
          />
        </div>

        {/* ========================================================= */}
        {/* OWNER + BUSINESS */}
        {/* ========================================================= */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Owner */}
          <SectionCard
            icon={<User className="w-5 h-5 text-blue-600" />}
            title="Owner Information"
          >
            <div className="space-y-5">
              <InfoRow
                icon={<User />}
                label="Name"
                value={user?.name || "Not available"}
              />

              <InfoRow
                icon={<Mail />}
                label="Email"
                value={user?.email || "Not available"}
              />

              <InfoRow
                icon={<Phone />}
                label="Phone"
                value={user?.phone || provider?.phone || "Not available"}
              />

              <InfoRow
                icon={<ShieldCheck />}
                label="Account Status"
                value={isAccountActive ? "Active" : "Suspended"}
                valueClass={isAccountActive ? "text-green-700" : "text-red-600"}
              />

              <InfoRow
                icon={<Calendar />}
                label="User Created"
                value={formatDate(user?.createdAt)}
              />
            </div>
          </SectionCard>

          {/* Business */}
          <SectionCard
            icon={<Building2 className="w-5 h-5 text-blue-600" />}
            title="Business Information"
          >
            <div className="space-y-5">
              <InfoRow
                icon={<Building2 />}
                label="Business Name"
                value={provider?.businessName || "Not available"}
              />

              <InfoRow
                icon={<Phone />}
                label="Business Phone"
                value={provider?.phone || "Not available"}
              />

              <InfoRow
                icon={<BriefcaseBusiness />}
                label="Experience"
                value={`${provider?.experience || 0} years`}
              />

              <InfoRow
                icon={<Star />}
                label="Rating"
                value={`${provider?.rating || 0} / 5 (${provider?.totalReviews || 0} reviews)`}
              />

              <InfoRow
                icon={<CheckCircle />}
                label="Completed Bookings"
                value={provider?.completedBookings || 0}
              />
            </div>
          </SectionCard>
        </div>

        {/* ========================================================= */}
        {/* LOCATION */}
        {/* ========================================================= */}

        <SectionCard
          icon={<MapPin className="w-5 h-5 text-blue-600" />}
          title="Business Location"
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoRow
              icon={<MapPin />}
              label="Address"
              value={provider?.address || "Not available"}
            />

            <InfoRow
              icon={<MapPin />}
              label="City"
              value={provider?.city || "Not available"}
            />

            <InfoRow
              icon={<MapPin />}
              label="State"
              value={provider?.state || "Not available"}
            />

            <InfoRow
              icon={<MapPin />}
              label="Pincode"
              value={provider?.pincode || "Not available"}
            />
          </div>
        </SectionCard>

        {/* ========================================================= */}
        {/* SERVICES */}
        {/* ========================================================= */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection("services")}
            className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>

              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900">
                  Provider Services
                </h2>

                <p className="text-sm text-gray-500">
                  {providerServices.length} service
                  {providerServices.length !== 1 ? "s" : ""} assigned
                </p>
              </div>
            </div>

            {expandedSections.services ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections.services && (
            <div className="border-t border-gray-100 p-5 md:p-6">
              {providerServices.length === 0 ? (
                <EmptyState
                  icon={<Wrench className="w-7 h-7" />}
                  title="No services assigned"
                  description="This provider currently has no services assigned."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {providerServices.map((providerService, index) => {
                    const service = providerService?.service || {};

                    const serviceName =
                      service?.name ||
                      providerService?.name ||
                      "Unnamed Service";

                    const category =
                      service?.category ||
                      providerService?.category ||
                      "General";

                    const price = providerService?.price ?? service?.price ?? 0;

                    const duration =
                      providerService?.duration ?? service?.duration ?? null;

                    const active = providerService?.isActive !== false;

                    return (
                      <div
                        key={providerService?._id || service?._id || index}
                        className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {serviceName}
                            </h3>

                            <span className="inline-block mt-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {category}
                            </span>
                          </div>

                          {active ? (
                            <span className="shrink-0 inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                              <CircleCheck className="w-4 h-4" />
                              Active
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                              <CircleX className="w-4 h-4" />
                              Inactive
                            </span>
                          )}
                        </div>

                        {providerService?.description && (
                          <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                            {providerService.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                              <IndianRupee className="w-3.5 h-3.5" />
                              Price
                            </div>

                            <p className="font-semibold text-gray-900 mt-1">
                              ₹{Number(price).toLocaleString("en-IN")}
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                              <Timer className="w-3.5 h-3.5" />
                              Duration
                            </div>

                            <p className="font-semibold text-gray-900 mt-1">
                              {duration
                                ? `${duration}${
                                    typeof duration === "number" ? " min" : ""
                                  }`
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-500">
                            Bookings
                          </span>

                          <span className="text-sm font-semibold text-gray-900">
                            {providerService?.bookingCount || 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* WORKING HOURS */}
        {/* ========================================================= */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection("workingHours")}
            className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>

              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900">
                  Working Hours
                </h2>

                <p className="text-sm text-gray-500">
                  Provider availability schedule
                </p>
              </div>
            </div>

            {expandedSections.workingHours ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections.workingHours && (
            <div className="border-t border-gray-100 p-5 md:p-6">
              <WorkingHours
                workingHours={provider?.workingHours}
                formatTime={formatTime}
              />
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* DOCUMENTS */}
        {/* ========================================================= */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => toggleSection("documents")}
            className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>

              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900">
                  Provider Documents
                </h2>

                <p className="text-sm text-gray-500">
                  {Array.isArray(provider?.documents)
                    ? provider.documents.length
                    : 0}{" "}
                  document
                  {Array.isArray(provider?.documents) &&
                  provider.documents.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>
            </div>

            {expandedSections.documents ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections.documents && (
            <div className="border-t border-gray-100 p-5 md:p-6">
              {Array.isArray(provider?.documents) &&
              provider.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {provider.documents.map((document, index) => (
                    <div
                      key={`${document}-${index}`}
                      className="flex items-center justify-between gap-3 border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Document {index + 1}
                          </p>

                          <p className="text-xs text-gray-500 truncate">
                            {document}
                          </p>
                        </div>
                      </div>

                      {typeof document === "string" &&
                        /^https?:\/\//i.test(document) && (
                          <a
                            href={document}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition shrink-0"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View
                          </a>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<FileText className="w-7 h-7" />}
                  title="No documents"
                  description="No provider documents have been uploaded."
                />
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* ACCOUNT INFORMATION */}
        {/* ========================================================= */}

        <SectionCard
          icon={<Calendar className="w-5 h-5 text-blue-600" />}
          title="Account Information"
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <InfoRow
              icon={<Calendar />}
              label="Provider Created"
              value={formatDate(provider?.createdAt)}
            />

            <InfoRow
              icon={<Calendar />}
              label="Last Updated"
              value={formatDate(provider?.updatedAt)}
            />

            <InfoRow
              icon={<ShieldCheck />}
              label="Verification"
              value={isVerified ? "Verified" : "Not Verified"}
              valueClass={isVerified ? "text-green-700" : "text-yellow-700"}
            />

            <InfoRow
              icon={<Power />}
              label="Account"
              value={isAccountActive ? "Active" : "Suspended"}
              valueClass={isAccountActive ? "text-green-700" : "text-red-600"}
            />
          </div>
        </SectionCard>

        {/* ========================================================= */}
        {/* BOTTOM ACTIONS */}
        {/* ========================================================= */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Provider Actions</h3>

              <p className="text-sm text-gray-500 mt-1">
                Manage verification and account status from here.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!isVerified && (
                <ActionButton
                  icon={<ShieldCheck className="w-4 h-4" />}
                  label="Verify Provider"
                  color="green"
                  disabled={actionLoading}
                  onClick={() => handleAction("verify")}
                />
              )}

              {isVerified && (
                <ActionButton
                  icon={<XCircle className="w-4 h-4" />}
                  label="Reject Verification"
                  color="orange"
                  disabled={actionLoading}
                  onClick={() => handleAction("reject")}
                />
              )}

              {isAccountActive ? (
                <ActionButton
                  icon={<Ban className="w-4 h-4" />}
                  label="Suspend Provider"
                  color="red"
                  disabled={actionLoading}
                  onClick={() => handleAction("suspend")}
                />
              ) : (
                <ActionButton
                  icon={<Power className="w-4 h-4" />}
                  label="Activate Provider"
                  color="blue"
                  disabled={actionLoading}
                  onClick={() => handleAction("activate")}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================= */
/* QUICK STAT */
/* ============================================================= */

const QuickStat = ({ icon, label, value }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <div className="flex items-center gap-1.5 text-gray-500">
        {icon}

        <span className="text-xs">{label}</span>
      </div>

      <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
};

/* ============================================================= */
/* OVERVIEW CARD */
/* ============================================================= */

const OverviewCard = ({ icon, title, value, active }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            active ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}
        >
          {icon}
        </div>

        {active ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
      </div>

      <p className="text-sm text-gray-500 mt-4">{title}</p>

      <p
        className={`text-lg font-bold mt-1 ${
          active ? "text-green-700" : "text-red-600"
        }`}
      >
        {value}
      </p>
    </div>
  );
};

/* ============================================================= */
/* SECTION CARD */
/* ============================================================= */

const SectionCard = ({ icon, title, children, className = "" }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      <div className="p-5 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            {icon}
          </span>

          {title}
        </h2>

        {children}
      </div>
    </div>
  );
};

/* ============================================================= */
/* INFO ROW */
/* ============================================================= */

const InfoRow = ({ icon, label, value, valueClass = "text-gray-900" }) => {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>

        <p className={`text-sm font-semibold wrap-break-words mt-1 ${valueClass}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

/* ============================================================= */
/* WORKING HOURS */
/* ============================================================= */

const WorkingHours = ({ workingHours, formatTime }) => {
  const days = [
    ["monday", "Monday"],
    ["tuesday", "Tuesday"],
    ["wednesday", "Wednesday"],
    ["thursday", "Thursday"],
    ["friday", "Friday"],
    ["saturday", "Saturday"],
    ["sunday", "Sunday"],
  ];

  if (!workingHours) {
    return (
      <EmptyState
        icon={<Clock className="w-7 h-7" />}
        title="Working hours not available"
        description="The provider has not configured working hours."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {days.map(([key, label]) => {
        const day = workingHours?.[key];

        const enabled = day?.enabled !== false;

        return (
          <div
            key={key}
            className={`rounded-xl border p-4 ${
              enabled
                ? "border-gray-200 bg-white"
                : "border-gray-100 bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-gray-900">{label}</span>

              {enabled ? (
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  Open
                </span>
              ) : (
                <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                  Closed
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
              <Clock className="w-4 h-4" />

              {enabled ? (
                <span>
                  {formatTime(day?.start || "09:00")} -{" "}
                  {formatTime(day?.end || "19:00")}
                </span>
              ) : (
                <span>Not working</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ============================================================= */
/* EMPTY STATE */
/* ============================================================= */

const EmptyState = ({ icon, title, description }) => {
  return (
    <div className="py-10 text-center">
      <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        {icon}
      </div>

      <h3 className="font-semibold text-gray-900 mt-4">{title}</h3>

      <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
        {description}
      </p>
    </div>
  );
};

/* ============================================================= */
/* ACTION BUTTON */
/* ============================================================= */

const ActionButton = ({ icon, label, color, disabled, onClick }) => {
  const colorClasses = {
    green: "bg-green-600 hover:bg-green-700 text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    orange: "bg-orange-600 hover:bg-orange-700 text-white",
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
        colorClasses[color] || "bg-gray-600 hover:bg-gray-700 text-white"
      }`}
    >
      {disabled ? <RefreshCw className="w-4 h-4 animate-spin" /> : icon}

      {disabled ? "Processing..." : label}
    </button>
  );
};

export default ProviderDetails;
