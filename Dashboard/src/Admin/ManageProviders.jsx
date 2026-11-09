import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Users,
  UserCheck,
  Clock,
  MapPin,
  Phone,
  Mail,
  Filter,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  SlidersHorizontal,
  MoreHorizontal,
} from "lucide-react";

import API from "../services/api";

const PAGE_SIZE = 8;

const normalizeProvider = (provider) => {
  const user = provider?.user || {};

  const rawServices =
    provider?.services ||
    provider?.providerServices ||
    provider?.serviceCategories ||
    [];

  const services = Array.isArray(rawServices)
    ? rawServices
        .map((item) => {
          if (typeof item === "string") return item;

          return (
            item?.service?.name ||
            item?.service?.title ||
            item?.name ||
            item?.title ||
            item?.category?.name ||
            ""
          );
        })
        .filter(Boolean)
    : [];

  const rawStatus = String(
    provider?.status ||
      provider?.verificationStatus ||
      provider?.applicationStatus ||
      "",
  ).toLowerCase();

  let status = "Pending";

  if (
    provider?.isSuspended === true ||
    provider?.isActive === false ||
    ["suspended", "inactive"].includes(rawStatus)
  ) {
    status = "Suspended";
  } else if (
    provider?.isVerified === true ||
    provider?.verified === true ||
    ["verified", "approved", "active"].includes(rawStatus)
  ) {
    status = "Verified";
  } else if (["rejected", "declined"].includes(rawStatus)) {
    status = "Rejected";
  }

  // Extract profile image from either provider doc or populated user doc
  const image =
    provider?.profileImage ||
    provider?.image ||
    provider?.avatar ||
    user?.profileImage ||
    user?.avatar ||
    "";

  return {
    ...provider,
    id: provider?._id || provider?.id,
    image,
    name:
      user?.name ||
      provider?.name ||
      provider?.fullName ||
      provider?.businessName ||
      "Unknown Provider",
    businessName:
      provider?.businessName ||
      provider?.business?.name ||
      provider?.name ||
      user?.name ||
      "Service Provider",
    email:
      user?.email ||
      provider?.email ||
      provider?.userEmail ||
      provider?.contactEmail ||
      "Email not available",
    phone:
      provider?.phone ||
      user?.phone ||
      provider?.mobile ||
      provider?.contactNumber ||
      "Phone not available",
    location:
      provider?.address?.city ||
      provider?.city ||
      provider?.location ||
      (typeof provider?.address === "string"
        ? provider.address
        : "Location not available"),
    services,
    status,
    createdAt:
      provider?.createdAt ||
      provider?.created_at ||
      provider?.applicationDate ||
      null,
  };
};

const statusConfig = {
  Verified: {
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
    icon: CheckCircle,
  },
  Pending: {
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
    icon: Clock,
  },
  Suspended: {
    className: "bg-rose-50 text-rose-700 ring-rose-600/20",
    dot: "bg-rose-500",
    icon: ShieldAlert,
  },
  Rejected: {
    className: "bg-slate-100 text-slate-600 ring-slate-500/20",
    dot: "bg-slate-400",
    icon: XCircle,
  },
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "SP";

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-cyan-100 text-cyan-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
];

const getAvatarColor = (name = "") => {
  const index = [...name].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );

  return avatarColors[index % avatarColors.length];
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.Pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}

function StatCard({ title, value, description, icon: Icon, theme, loading }) {
  const themes = {
    blue: {
      icon: "bg-blue-100 text-blue-700",
      glow: "from-blue-50/80",
      border: "hover:border-blue-200",
    },
    green: {
      icon: "bg-emerald-100 text-emerald-700",
      glow: "from-emerald-50/80",
      border: "hover:border-emerald-200",
    },
    amber: {
      icon: "bg-amber-100 text-amber-700",
      glow: "from-amber-50/80",
      border: "hover:border-amber-200",
    },
    rose: {
      icon: "bg-rose-100 text-rose-700",
      glow: "from-rose-50/80",
      border: "hover:border-rose-200",
    },
  };

  const style = themes[theme];

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br ${style.glow} to-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${style.border}`}
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {loading ? "—" : value}
          </p>

          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>

        <div
          className={`rounded-2xl p-3 transition duration-300 group-hover:scale-110 ${style.icon}`}
        >
          <Icon size={23} strokeWidth={1.8} />
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/70 blur-2xl" />
    </article>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Page <span className="font-bold text-slate-900">{page}</span> of{" "}
        <span className="font-bold text-slate-900">{totalPages}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange((previous) => Math.max(1, previous - 1))}
          disabled={page <= 1}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <button
          type="button"
          onClick={() =>
            onPageChange((previous) => Math.min(totalPages, previous + 1))
          }
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function ManageProviders() {
  const navigate = useNavigate();

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [page, setPage] = useState(1);

  const fetchProviders = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await API.get("/providers");
      const data = response?.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.providers)
          ? data.providers
          : Array.isArray(data?.data?.providers)
            ? data.data.providers
            : Array.isArray(data?.data)
              ? data.data
              : null;

      if (!list) {
        throw new Error(
          data?.message || "The server did not return a provider list.",
        );
      }

      setProviders(list.map(normalizeProvider));
    } catch (err) {
      console.error("Load providers error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load providers.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const serviceOptions = useMemo(() => {
    const services = providers.flatMap((provider) => provider.services);
    return [...new Set(services)].sort((a, b) => a.localeCompare(b));
  }, [providers]);

  const stats = useMemo(
    () => ({
      total: providers.length,
      verified: providers.filter((p) => p.status === "Verified").length,
      pending: providers.filter((p) => p.status === "Pending").length,
      suspended: providers.filter((p) => p.status === "Suspended").length,
    }),
    [providers],
  );

  const filteredProviders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return providers.filter((provider) => {
      const searchableText = [
        provider.name,
        provider.businessName,
        provider.email,
        provider.phone,
        provider.location,
        ...provider.services,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchableText.includes(query)) &&
        (statusFilter === "All" || provider.status === statusFilter) &&
        (serviceFilter === "All" || provider.services.includes(serviceFilter))
      );
    });
  }, [providers, search, statusFilter, serviceFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProviders.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);

  const paginatedProviders = filteredProviders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, serviceFilter]);

  const handleStatusAction = async (provider, action) => {
    if (!provider.id) {
      setError("This provider has no valid ID.");
      return;
    }

    const labels = {
      verify: "verify",
      suspend: "suspend",
      activate: "activate",
    };

    if (
      !window.confirm(
        `Are you sure you want to ${labels[action]} ${provider.name}?`,
      )
    ) {
      return;
    }

    setActionLoading(`${provider.id}-${action}`);
    setError("");
    setSuccessMessage("");

    try {
      const endpoints = {
        verify: `/providers/${provider.id}/verify`,
        suspend: `/providers/${provider.id}/suspend`,
        activate: `/providers/${provider.id}/activate`,
      };

      await API.patch(endpoints[action]);

      setSuccessMessage(
        `${provider.name} has been ${labels[action]}d successfully.`,
      );

      await fetchProviders(true);
    } catch (err) {
      console.error("Provider status action error:", err);
      setError(
        err?.response?.data?.message ||
          `Unable to ${labels[action]} this provider. Check your backend route.`,
      );
    } finally {
      setActionLoading("");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setServiceFilter("All");
    setPage(1);
  };

  const viewProvider = (provider) => {
    if (!provider.id) {
      setError("This provider has no valid ID.");
      return;
    }

    navigate(`/admin/providers/${provider.id}`);
  };

  const ProviderActions = ({ provider }) => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => viewProvider(provider)}
        title="View provider"
        className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        <Eye size={16} />
      </button>

      {provider.status === "Pending" && (
        <button
          type="button"
          onClick={() => handleStatusAction(provider, "verify")}
          disabled={Boolean(actionLoading)}
          title="Verify provider"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          {actionLoading === `${provider.id}-verify` ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <ShieldCheck size={16} />
          )}
        </button>
      )}

      {provider.status === "Verified" && (
        <button
          type="button"
          onClick={() => handleStatusAction(provider, "suspend")}
          disabled={Boolean(actionLoading)}
          title="Suspend provider"
          className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
        >
          <ShieldAlert size={16} />
        </button>
      )}

      {provider.status === "Suspended" && (
        <button
          type="button"
          onClick={() => handleStatusAction(provider, "activate")}
          disabled={Boolean(actionLoading)}
          title="Activate provider"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          <CheckCircle size={16} />
        </button>
      )}
    </div>
  );

  const ProviderCard = ({ provider }) => (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
      <div className="flex items-start gap-3">
        {provider.image ? (
          <img
            src={provider.image}
            alt={provider.name}
            className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ring-1 ring-black/5 ${getAvatarColor(
              provider.name,
            )}`}
          >
            {getInitials(provider.name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="wrap-break-words font-bold text-slate-900">
            {provider.name}
          </h3>
          <p className="mt-1 wrap-break-words text-sm text-slate-500">
            {provider.businessName}
          </p>
        </div>

        <button
          type="button"
          onClick={() => viewProvider(provider)}
          title="View details"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <MoreHorizontal size={19} />
        </button>
      </div>

      <div className="mt-4">
        <StatusBadge status={provider.status} />
      </div>

      <div className="my-5 space-y-3 border-y border-slate-100 py-4">
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <Mail size={16} className="mt-0.5 shrink-0 text-slate-400" />
          <span className="min-w-0 break-all">{provider.email}</span>
        </div>

        <div className="flex items-start gap-3 text-sm text-slate-600">
          <Phone size={16} className="mt-0.5 shrink-0 text-slate-400" />
          <span className="wrap-break-words">{provider.phone}</span>
        </div>

        <div className="flex items-start gap-3 text-sm text-slate-600">
          <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
          <span className="wrap-break-words">{provider.location}</span>
        </div>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Services
        </p>

        <div className="flex flex-wrap gap-1.5">
          {provider.services.length ? (
            provider.services.slice(0, 3).map((service) => (
              <span
                key={service}
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600"
              >
                {service}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400">Not specified</span>
          )}

          {provider.services.length > 3 && (
            <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700">
              +{provider.services.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs text-slate-400">Registered</p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {formatDate(provider.createdAt)}
          </p>
        </div>

        <ProviderActions provider={provider} />
      </div>
    </article>
  );

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Premium page header */}
        <section className="relative mb-7 overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-blue-950 to-blue-800 px-6 py-7 text-white shadow-xl shadow-blue-950/10 sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10 bg-white/5" />
          <div className="pointer-events-none absolute -bottom-32 right-36 h-64 w-64 rounded-full border border-white/10 bg-blue-300/10" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100 backdrop-blur">
                <Sparkles size={14} />
                FixNear Administration
              </div>

              <div className="mb-2 flex items-center gap-2 text-xs text-blue-200">
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-white">Providers</span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Manage Providers
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/80 sm:text-base">
                Your central workspace to review professionals, manage
                verification, and keep the FixNear network running smoothly.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchProviders(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/20 disabled:opacity-60 md:self-center"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh data
            </button>
          </div>

          <div className="relative z-10 mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs text-blue-100/80">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Provider management
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={14} />
              Verification workspace
            </span>
          </div>
        </section>

        {/* Feedback messages */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-white p-4 text-sm text-rose-700 shadow-sm"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p className="flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="rounded-lg p-1 hover:bg-rose-50"
            >
              <XCircle size={17} />
            </button>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-sm text-emerald-700 shadow-sm"
          >
            <CheckCircle size={19} className="shrink-0" />
            <p className="flex-1">{successMessage}</p>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              aria-label="Dismiss success message"
              className="rounded-lg p-1 hover:bg-emerald-50"
            >
              <XCircle size={17} />
            </button>
          </div>
        )}

        {/* Statistics */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Providers"
            value={stats.total}
            description="All registered professionals"
            icon={Users}
            theme="blue"
            loading={loading}
          />
          <StatCard
            title="Verified Providers"
            value={stats.verified}
            description="Approved and verified"
            icon={UserCheck}
            theme="green"
            loading={loading}
          />
          <StatCard
            title="Pending Review"
            value={stats.pending}
            description="Awaiting admin review"
            icon={Clock}
            theme="amber"
            loading={loading}
          />
          <StatCard
            title="Suspended Providers"
            value={stats.suspended}
            description="Currently suspended"
            icon={ShieldAlert}
            theme="rose"
            loading={loading}
          />
        </section>

        {/* Search and filters */}
        <section className="mb-7 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                <SlidersHorizontal size={19} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Find a provider</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Search, filter, and manage your provider directory.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="self-start rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 sm:self-auto"
            >
              Reset filters
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_210px_220px]">
            <div>
              <label
                htmlFor="provider-search"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Search
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="provider-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, email, phone or location..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="provider-status"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Status
              </label>

              <select
                id="provider-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="All">All statuses</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="provider-service"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Service category
              </label>

              <select
                id="provider-service"
                value={serviceFilter}
                onChange={(event) => setServiceFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="All">All services</option>
                {serviceOptions.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-900">
                {filteredProviders.length === 0
                  ? 0
                  : (currentPage - 1) * PAGE_SIZE + 1}
                {"–"}
                {Math.min(currentPage * PAGE_SIZE, filteredProviders.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-900">
                {filteredProviders.length}
              </span>{" "}
              providers
            </p>

            <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
              <Filter size={14} />
              {statusFilter === "All" ? "All statuses" : statusFilter}
              <span className="text-slate-300">|</span>
              {serviceFilter === "All" ? "All services" : serviceFilter}
            </div>
          </div>
        </section>

        {/* Provider directory */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Provider directory</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Review contact information and account status.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 sm:self-auto">
              <Users size={14} />
              {filteredProviders.length} records
            </div>
          </div>

          {loading ? (
            <div className="px-5 py-20 text-center">
              <RefreshCw
                size={28}
                className="mx-auto mb-4 animate-spin text-blue-600"
              />
              <p className="font-semibold text-slate-800">Loading providers</p>
              <p className="mt-1 text-sm text-slate-500">
                Please wait while we retrieve the directory.
              </p>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="px-5 py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search size={25} />
              </div>
              <h3 className="font-bold text-slate-900">No providers found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a different search term or clear your filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-275 text-left">
                  <thead className="bg-slate-50/90">
                    <tr>
                      {[
                        "Provider",
                        "Contact information",
                        "Services",
                        "Location",
                        "Status",
                        "Joined",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className={`px-5 py-4 text-[11px] font-bold uppercase tracking-[0.09em] text-slate-500 ${
                            heading === "Actions" ? "text-right" : ""
                          }`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedProviders.map((provider) => (
                      <tr
                        key={provider.id}
                        className="group transition hover:bg-blue-50/30"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {provider.image ? (
                              <img
                                src={provider.image}
                                alt={provider.name}
                                className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ring-1 ring-black/5 ${getAvatarColor(
                                  provider.name,
                                )}`}
                              >
                                {getInitials(provider.name)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="max-w-50 truncate text-sm font-bold text-slate-900">
                                {provider.name}
                              </p>
                              <p className="mt-1 max-w-50 truncate text-xs text-slate-500">
                                {provider.businessName}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex min-w-57.5 flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <Mail
                                size={14}
                                className="shrink-0 text-slate-400"
                              />
                              <span
                                title={provider.email}
                                className="max-w-55 truncate"
                              >
                                {provider.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Phone
                                size={13}
                                className="shrink-0 text-slate-400"
                              />
                              <span>{provider.phone}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex max-w-47.5 flex-wrap gap-1.5">
                            {provider.services.length ? (
                              <>
                                {provider.services
                                  .slice(0, 2)
                                  .map((service) => (
                                    <span
                                      key={service}
                                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600"
                                    >
                                      {service}
                                    </span>
                                  ))}
                                {provider.services.length > 2 && (
                                  <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                                    +{provider.services.length - 2}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Not specified
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex max-w-40 items-start gap-2 text-sm text-slate-600">
                            <MapPin
                              size={15}
                              className="mt-0.5 shrink-0 text-slate-400"
                            />
                            <span className="line-clamp-2">
                              {provider.location}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={provider.status} />
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                          {formatDate(provider.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <ProviderActions provider={provider} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile and tablet cards */}
              <div className="grid grid-cols-1 gap-4 bg-slate-50/60 p-4 sm:p-5 lg:hidden">
                {paginatedProviders.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>

              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </section>

        <footer className="mt-6 flex flex-col gap-2 px-1 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© FixNear · Provider Administration</p>
          <p>Manage your service network with confidence.</p>
        </footer>
      </div>
    </main>
  );
}
