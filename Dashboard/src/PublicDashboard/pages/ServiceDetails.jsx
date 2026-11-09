import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  IndianRupee,
  Wrench,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  Star,
  Briefcase,
  X,
  LogIn,
  UserPlus,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Award,
  LockKeyhole,
  Eye,
} from "lucide-react";
import API from "../../services/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80";

// Authentication helper.
// Your User model uses the role values: customer, provider, admin.
function getCustomerSession() {
  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");

  const savedUser =
    localStorage.getItem("user") || localStorage.getItem("customer");

  if (!token || !savedUser) {
    return { authenticated: false, reason: "login" };
  }

  try {
    const user = JSON.parse(savedUser);

    if (!user || typeof user !== "object") {
      return { authenticated: false, reason: "login" };
    }

    const role = String(
      user.role || user.userType || user.accountType || "",
    ).toLowerCase();

    if (role && !["customer", "user"].includes(role)) {
      return { authenticated: false, reason: "customer" };
    }

    return { authenticated: true, reason: "" };
  } catch {
    return { authenticated: false, reason: "login" };
  }
}

function getProviderId(item) {
  const provider = item?.provider;

  if (typeof provider === "string") {
    return provider;
  }

  return provider?._id || provider?.id || null;
}

function getProviderServiceId(item) {
  const providerService = item?.providerService;

  return (
    item?._id ||
    item?.id ||
    providerService?._id ||
    providerService?.id ||
    (typeof providerService === "string" ? providerService : null)
  );
}

function getImageUrl(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value.url || value.secure_url || value.imageUrl || value.src || "";
  }
  return "";
}

function ProviderAvatar({ src, name, size = "h-16 w-16" }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (src && !imageFailed) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        onError={() => setImageFailed(true)}
        className={`${size} shrink-0 rounded-xl object-cover ring-1 ring-gray-100`}
      />
    );
  }

  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700`}
    >
      <User size={26} />
    </div>
  );
}

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState("");

  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [selectedProviderModal, setSelectedProviderModal] = useState(null);

  // Re-check the current session when the user attempts a protected action.
  const session = getCustomerSession();
  const isCustomerAuthenticated = session.authenticated;

  const fetchService = useCallback(async () => {
    if (!id) {
      setService(null);
      setError("Service ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await API.get(`/services/${id}`);
      const data = response?.data;

      const result = data?.service || data?.data?.service || data?.data || data;

      if (!result || typeof result !== "object") {
        throw new Error("Service details are unavailable.");
      }

      setService(result);
    } catch (err) {
      setService(null);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load service details.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchProviders = useCallback(async () => {
    if (!id) {
      setProviders([]);
      setProvidersError("Service ID is missing.");
      setProvidersLoading(false);
      return;
    }

    setProvidersLoading(true);
    setProvidersError("");

    try {
      const response = await API.get(`/providers/services/service/${id}`);

      const data = response?.data;

      const result =
        data?.providers || data?.data?.providers || data?.data || [];

      setProviders(
        Array.isArray(result)
          ? result.filter((item) => item?.provider && item?.service)
          : [],
      );
    } catch (err) {
      setProviders([]);
      setProvidersError(
        err?.response?.data?.message ||
          "Failed to load providers for this service.",
      );
    } finally {
      setProvidersLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchService();
    fetchProviders();
  }, [fetchService, fetchProviders]);

  const handleRefresh = () => {
    fetchService();
    fetchProviders();
  };

  const openAuthentication = (reason = "login") => {
    setShowLoginPopup(true);
    setSelectedProviderModal((current) => current);
  };

  const handleBookService = () => {
    document.getElementById("available-providers")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleBookProvider = (providerService) => {
    const currentSession = getCustomerSession();

    if (!currentSession.authenticated) {
      setShowLoginPopup(true);
      return;
    }

    const serviceId = service?._id || service?.id;
    const providerId = getProviderId(providerService);
    const providerServiceId = getProviderServiceId(providerService);

    if (!serviceId || !providerId || !providerServiceId) {
      window.alert(
        "Booking information is incomplete. Please refresh and try again.",
      );
      return;
    }

    const params = new URLSearchParams({
      service: String(serviceId),
      provider: String(providerId),
      providerService: String(providerServiceId),
    });

    navigate(`/booking?${params.toString()}`);
  };

  const handleAuthenticationNavigation = (path) => {
    setShowLoginPopup(false);

    navigate(path, {
      state: {
        from: `/services/${id}`,
        returnTo: `/services/${id}`,
      },
    });
  };

  const serviceName = service?.name || service?.title || "Service";

  const categoryName =
    typeof service?.category === "string"
      ? service.category
      : service?.category?.name || "";

  const serviceImage =
    getImageUrl(service?.image || service?.imageUrl) || FALLBACK_IMAGE;

  const features = [
    "Trusted professional service",
    "Transparent pricing",
    "Easy booking process",
    "Reliable customer support",
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <RefreshCw className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600">Loading service details...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">
          Service not found
        </h2>
        <p className="mt-2 text-center text-gray-600">
          {error || "Unable to find this service."}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw size={18} />
            Try Again
          </button>

          <Link
            to="/services"
            className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-100"
          >
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Authentication modal */}
      {showLoginPopup && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowLoginPopup(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setShowLoginPopup(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Close authentication popup"
            >
              <X size={20} />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <ShieldCheck size={32} />
            </div>

            <h2
              id="auth-modal-title"
              className="mt-4 text-center text-2xl font-bold text-gray-900"
            >
              {session.reason === "customer"
                ? "Customer Account Required"
                : "Login Required"}
            </h2>

            <p className="mt-3 text-center leading-6 text-gray-600">
              {session.reason === "customer"
                ? "Please sign in with a customer account to view contact details and book services."
                : "Sign in or create a customer account to view the provider's contact details and continue booking."}
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => handleAuthenticationNavigation("/login")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <LogIn size={18} />
                Login
              </button>

              <button
                type="button"
                onClick={() => handleAuthenticationNavigation("/register")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <UserPlus size={18} />
                Register as Customer
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-gray-500">
              Your account helps keep bookings secure.
            </p>
          </div>
        </div>
      )}

      {/* Provider details modal */}
      {selectedProviderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedProviderModal(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="provider-modal-title"
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                <h3
                  id="provider-modal-title"
                  className="text-lg font-bold text-gray-900"
                >
                  Provider Profile
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProviderModal(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close provider details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Public provider information */}
              <div className="flex items-center gap-4">
                <ProviderAvatar
                  src={selectedProviderModal.image}
                  name={selectedProviderModal.name}
                  size="h-20 w-20 rounded-2xl"
                />

                <div className="min-w-0">
                  <h4 className="wrap-break-words text-xl font-bold text-gray-900">
                    {selectedProviderModal.name}
                  </h4>

                  <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-green-600">
                    <CheckCircle size={15} />
                    {selectedProviderModal.isVerified
                      ? "Verified Professional"
                      : "Registered Provider"}
                  </span>

                  {selectedProviderModal.location && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                      <MapPin size={14} className="shrink-0" />
                      {selectedProviderModal.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-4 text-center">
                <div>
                  <p className="text-xs text-gray-500">Experience</p>
                  <p className="mt-1 font-bold text-gray-900">
                    {selectedProviderModal.experience != null
                      ? `${selectedProviderModal.experience} yrs`
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Rating</p>
                  <p className="mt-1 flex items-center justify-center gap-1 font-bold text-gray-900">
                    <Star size={15} className="fill-amber-400 text-amber-400" />
                    {selectedProviderModal.rating.toFixed(1)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Bookings</p>
                  <p className="mt-1 font-bold text-gray-900">
                    {selectedProviderModal.bookings}
                  </p>
                </div>
              </div>

              {/* Contact details are gated by customer authentication */}
              <div className="mt-5">
                {isCustomerAuthenticated ? (
                  selectedProviderModal.email || selectedProviderModal.phone ? (
                    <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-4">
                      <h5 className="flex items-center gap-2 font-semibold text-gray-900">
                        <CheckCircle size={18} className="text-green-600" />
                        Provider Contact Details
                      </h5>

                      {selectedProviderModal.phone && (
                        <a
                          href={`tel:${selectedProviderModal.phone}`}
                          className="flex items-center gap-3 break-all text-sm text-gray-700 hover:text-blue-700"
                        >
                          <Phone size={17} className="shrink-0 text-blue-600" />
                          {selectedProviderModal.phone}
                        </a>
                      )}

                      {selectedProviderModal.email && (
                        <a
                          href={`mailto:${selectedProviderModal.email}`}
                          className="flex items-center gap-3 break-all text-sm text-gray-700 hover:text-blue-700"
                        >
                          <Mail size={17} className="shrink-0 text-blue-600" />
                          {selectedProviderModal.email}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
                      Contact details have not been provided.
                    </div>
                  )
                ) : (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white p-2 text-blue-600">
                        <LockKeyhole size={21} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h5 className="font-semibold text-gray-900">
                          Contact Details Locked
                        </h5>

                        <p className="mt-1 text-sm leading-5 text-gray-600">
                          Log in or register as a customer to view this
                          provider's phone number and email address.
                        </p>

                        <button
                          type="button"
                          onClick={() => setShowLoginPopup(true)}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          <Eye size={16} />
                          Unlock Contact Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5">
                <h5 className="text-sm font-semibold text-gray-900">
                  About this Provider
                </h5>

                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                  {selectedProviderModal.description ||
                    "Professional service from your local provider."}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
                <div>
                  <span className="text-xs text-gray-500">Estimated Price</span>

                  <div className="mt-1 flex items-center text-2xl font-bold text-blue-600">
                    <IndianRupee size={22} />
                    {selectedProviderModal.price ?? "—"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleBookProvider(selectedProviderModal.rawItem)
                  }
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Book Now
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>

          <div>
            <p className="text-sm font-semibold text-blue-600">
              FIXNEAR Services
            </p>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {serviceName}
            </h1>
            {categoryName && (
              <p className="mt-1 text-sm text-gray-500">{categoryName}</p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        {/* Service details */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
            <img
              src={serviceImage}
              alt={serviceName}
              className="h-64 w-full object-cover sm:h-80"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {categoryName || "Professional Service"}
                </span>

                <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                  <CheckCircle size={15} />
                  Available for booking
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-bold text-gray-900">
                About this service
              </h2>

              <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">
                {service.description ||
                  "Professional service from local providers on FIXNEAR."}
              </p>

              <h3 className="mt-7 text-lg font-bold text-gray-900">
                Why choose FIXNEAR?
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="flex min-h-15 items-center gap-3 rounded-xl bg-gray-50 p-4"
                  >
                    <CheckCircle
                      size={20}
                      className="shrink-0 text-green-600"
                    />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking summary */}
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Book this service
            </h2>

            <div className="mt-5 border-b border-gray-100 pb-5">
              <p className="text-sm text-gray-500">Starting price</p>
              <p className="mt-1 flex items-center text-3xl font-bold text-blue-600">
                <IndianRupee size={25} />
                {service.price ?? service.startingPrice ?? "—"}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {service.duration && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock size={19} />
                  <span>{service.duration}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-gray-600">
                <Wrench size={19} />
                <span>{categoryName || serviceName}</span>
              </div>

              <div className="flex items-center gap-3 text-gray-600">
                <Briefcase size={19} />
                <span>
                  {providers.length} provider
                  {providers.length !== 1 ? "s" : ""} found
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBookService}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white transition hover:bg-blue-700"
            >
              Choose a Provider
              <ArrowRight size={19} />
            </button>

            <p className="mt-3 text-center text-sm text-gray-500">
              Select a provider below to continue booking.
            </p>
          </aside>
        </section>

        {/* Available providers */}
        <section id="available-providers" className="scroll-mt-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                <Briefcase size={15} />
                Service providers
              </span>

              <h2 className="mt-4 text-3xl font-bold text-gray-900">
                Available Providers
              </h2>

              <p className="mt-2 text-gray-600">
                Choose a professional who offers{" "}
                <span className="font-semibold text-gray-800">
                  {categoryName || serviceName.toLowerCase()}
                </span>
                .
              </p>
            </div>

            <p className="text-sm text-gray-500">
              {providers.length} provider
              {providers.length !== 1 ? "s" : ""} available
            </p>
          </div>

          {providersLoading ? (
            <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white py-14">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-3 text-gray-600">
                Loading available providers...
              </p>
            </div>
          ) : providersError ? (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
              <AlertCircle className="mx-auto h-9 w-9 text-red-500" />
              <p className="mt-3 text-gray-700">{providersError}</p>
              <button
                type="button"
                onClick={fetchProviders}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                <RefreshCw size={17} />
                Try Again
              </button>
            </div>
          ) : providers.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center">
              <Briefcase className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-4 text-lg font-bold text-gray-900">
                No providers available
              </h3>
              <p className="mt-2 text-gray-600">
                There are currently no providers listed for this service.
              </p>
              <button
                type="button"
                onClick={fetchProviders}
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw size={17} />
                Refresh Providers
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
              {providers.map((providerService) => {
                const provider = providerService?.provider;
                const providerUser =
                  typeof provider?.user === "object" ? provider.user : null;

                const providerName =
                  provider?.businessName ||
                  providerUser?.name ||
                  "FIXNEAR Professional";

                const providerImage =
                  getImageUrl(provider?.profileImage) ||
                  getImageUrl(providerUser?.profileImage) ||
                  getImageUrl(providerUser?.avatar);

                const providerLocation = [provider?.city, provider?.state]
                  .filter(Boolean)
                  .join(", ");

                const experience =
                  provider?.experience ?? provider?.experienceYears;

                const rating = Number(
                  provider?.rating ?? providerService?.rating ?? 0,
                );

                const totalReviews =
                  provider?.totalReviews ??
                  provider?.totalReviewsCount ??
                  provider?.reviews?.length ??
                  0;

                const price =
                  providerService?.price ??
                  providerService?.servicePrice ??
                  service.price;

                const bookings =
                  providerService?.bookingCount ??
                  provider?.completedBookings ??
                  provider?.bookingCount ??
                  0;

                const providerDetails = {
                  rawItem: providerService,
                  id: getProviderId(providerService),
                  name: providerName,
                  image: providerImage,
                  location: providerLocation,
                  isVerified: Boolean(provider?.isVerified),
                  experience,
                  rating: Number.isFinite(rating) ? rating : 0,
                  totalReviews,
                  price,
                  bookings,
                  email: provider?.email || providerUser?.email || "",
                  phone: provider?.phone || providerUser?.phone || "",
                  description:
                    providerService?.description ||
                    provider?.description ||
                    "Professional service from your local provider.",
                };

                const cardKey =
                  providerService?._id ||
                  `${providerDetails.id}-${getProviderServiceId(
                    providerService,
                  )}`;

                return (
                  <article
                    key={cardKey}
                    className="flex h-full min-h-122.5 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex min-h-22 items-start gap-4">
                      <ProviderAvatar src={providerImage} name={providerName} />

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 min-h-12 wrap-break-words text-lg font-bold leading-6 text-gray-900">
                          {providerName}
                        </h3>

                        <p className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle size={15} />
                          {provider?.isVerified
                            ? "Verified Provider"
                            : "Service Provider"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex min-h-6 items-center gap-1 text-sm text-gray-500">
                      {providerLocation ? (
                        <>
                          <MapPin size={15} className="shrink-0" />
                          <span className="line-clamp-1 break-all">
                            {providerLocation}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">
                          Location not provided
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="flex min-h-19 flex-col justify-center rounded-xl bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Experience</p>
                        <p className="mt-1 line-clamp-1 font-semibold text-gray-900">
                          {experience != null
                            ? `${experience} years`
                            : "Not specified"}
                        </p>
                      </div>

                      <div className="flex min-h-19 flex-col justify-center rounded-xl bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Rating</p>
                        <p className="mt-1 flex items-center gap-1 font-semibold text-gray-900">
                          <Star
                            size={16}
                            className="shrink-0 fill-amber-400 text-amber-400"
                          />
                          {providerDetails.rating.toFixed(1)}
                          <span className="text-xs font-normal text-gray-500">
                            ({totalReviews})
                          </span>
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 line-clamp-2 min-h-12 text-sm leading-6 text-gray-600">
                      {providerDetails.description}
                    </p>

                    <div className="mt-4 flex min-h-19 items-center justify-between border-t border-gray-100 pt-4">
                      <div>
                        <p className="text-xs text-gray-500">Provider price</p>
                        <p className="mt-1 flex items-center text-2xl font-bold text-blue-600">
                          <IndianRupee size={19} />
                          {price ?? "—"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500">Bookings</p>
                        <p className="mt-1 font-semibold text-gray-900">
                          {bookings}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center gap-2 pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedProviderModal(providerDetails)
                        }
                        className="flex min-h-12.5 items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        <User size={16} />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBookProvider(providerService)}
                        className="flex min-h-12.5 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Book Provider
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
