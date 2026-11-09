import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Star,
  Phone,
  Mail,
  Wrench,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  CalendarDays,
  Briefcase,
  Clock,
  ShieldCheck,
  UserRound,
  Award,
  IndianRupee,
  Building2,
  BadgeCheck,
  Globe,
  LockKeyhole,
  UserPlus,
  X,
} from "lucide-react";

import API from "../services/api";

function ProviderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const locationRoute = useLocation();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Authentication and contact modal
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return Boolean(
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken"),
      );
    } catch {
      return false;
    }
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [requestedAction, setRequestedAction] = useState("contact");

  // ----------------------------------------
  // FETCH PROVIDER FROM DATABASE
  // ----------------------------------------

  const fetchProvider = useCallback(async () => {
    if (!id) {
      setError("Provider ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await API.get(`/providers/${id}`);
      const data = response?.data;

      const receivedProvider =
        data?.provider || data?.data?.provider || data?.data || data;

      if (
        !receivedProvider ||
        typeof receivedProvider !== "object" ||
        Array.isArray(receivedProvider)
      ) {
        throw new Error("Invalid provider data received from the server.");
      }

      setProvider(receivedProvider);
    } catch (err) {
      console.error("FETCH PROVIDER DETAILS ERROR:", err);

      setProvider(null);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load provider details.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  // Update auth state when another tab logs in or the app announces login.
  useEffect(() => {
    const syncAuth = () => {
      try {
        setIsLoggedIn(
          Boolean(
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("authToken"),
          ),
        );
      } catch {
        setIsLoggedIn(false);
      }
    };

    window.addEventListener("storage", syncAuth);
    window.addEventListener("authChanged", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("authChanged", syncAuth);
    };
  }, []);

  // ----------------------------------------
  // CONTACT AUTHENTICATION
  // ----------------------------------------

  const requireLogin = (action) => {
    if (!isLoggedIn) {
      setRequestedAction(action);
      setShowAuthModal(true);
      return false;
    }

    return true;
  };

  const handleContactProvider = () => {
    if (!requireLogin("call")) return;

    if (providerPhone) {
      window.location.href = `tel:${String(providerPhone).replace(
        /[^\d+]/g,
        "",
      )}`;
    }
  };

  const handleSendEmail = () => {
    if (!requireLogin("email")) return;

    if (providerEmail) {
      window.location.href = `mailto:${providerEmail}`;
    }
  };

  const handleLogin = () => {
    setShowAuthModal(false);

    navigate("/login", {
      state: { from: locationRoute.pathname },
    });
  };

  const handleRegister = () => {
    setShowAuthModal(false);

    navigate("/register", {
      state: { from: locationRoute.pathname },
    });
  };

  // ----------------------------------------
  // PROVIDER DATA HELPERS
  // ----------------------------------------

  const providerUser = useMemo(() => {
    if (!provider?.user || typeof provider.user !== "object") {
      return {};
    }

    return provider.user;
  }, [provider]);

  const providerName =
    provider?.businessName ||
    provider?.name ||
    provider?.fullName ||
    providerUser?.name ||
    providerUser?.fullName ||
    "FIXNEAR Professional";

  const providerImage =
    provider?.profileImage ||
    provider?.image ||
    provider?.avatar ||
    providerUser?.profileImage ||
    providerUser?.avatar ||
    "";

  const providerEmail =
    provider?.businessEmail || provider?.email || providerUser?.email || "";

  const providerPhone =
    provider?.businessPhone ||
    provider?.phone ||
    providerUser?.phone ||
    providerUser?.mobile ||
    "";

  const locationParts = [
    provider?.address,
    provider?.locality,
    provider?.city,
    provider?.district,
    provider?.state,
    provider?.pincode || provider?.postalCode,
  ].filter((value) => typeof value === "string" && value.trim());

  const providerLocation = locationParts.length
    ? [...new Set(locationParts)].join(", ")
    : provider?.location || "Location not specified";

  const ratingValue =
    provider?.averageRating ??
    provider?.rating ??
    provider?.ratings?.average ??
    provider?.reviewStats?.averageRating;

  const reviewCount =
    provider?.reviewCount ??
    provider?.totalReviews ??
    provider?.reviewsCount ??
    provider?.reviews?.length ??
    0;

  const experience =
    provider?.experience ??
    provider?.experienceYears ??
    provider?.yearsOfExperience;

  const availability =
    provider?.isAvailable ??
    provider?.available ??
    provider?.availability?.isAvailable;

  const verified =
    provider?.isVerified === true ||
    provider?.verified === true ||
    provider?.verificationStatus === "approved" ||
    provider?.status === "approved";

  const description =
    provider?.description ||
    provider?.about ||
    provider?.bio ||
    provider?.businessDescription ||
    "";

  const category =
    typeof provider?.category === "string"
      ? provider.category
      : provider?.category?.name || provider?.serviceCategory?.name || "";

  const services = useMemo(() => {
    const possibleServices = [
      provider?.services,
      provider?.providerServices,
      provider?.offeredServices,
    ];

    const selectedServices = possibleServices.find(
      (value) => Array.isArray(value) && value.length > 0,
    );

    if (!selectedServices) return [];

    return selectedServices.map((item, index) => {
      if (typeof item === "string") {
        return {
          id: item + index,
          name: item,
          description: "",
          price: null,
          duration: "",
        };
      }

      const service = item?.service;

      const name =
        item?.name ||
        item?.serviceName ||
        (typeof service === "string" ? service : service?.name) ||
        item?.title ||
        "Professional Service";

      return {
        id: item?._id || item?.id || `${name}-${index}`,
        name,
        description: item?.description || service?.description || "",
        price: item?.price ?? item?.startingPrice ?? service?.price ?? null,
        duration: item?.duration || service?.duration || "",
      };
    });
  }, [provider]);

  const providerPrice =
    provider?.startingPrice ??
    provider?.basePrice ??
    provider?.hourlyRate ??
    provider?.price;

  const bookingsCount =
    provider?.completedBookings ??
    provider?.totalBookings ??
    provider?.bookingCount ??
    provider?.completedJobs;

  const joinedDate =
    provider?.createdAt || provider?.created_at || providerUser?.createdAt;

  const formattedJoinedDate = joinedDate
    ? new Date(joinedDate).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : null;

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") {
      return null;
    }

    const numericPrice = Number(price);

    return Number.isFinite(numericPrice)
      ? numericPrice.toLocaleString("en-IN")
      : String(price);
  };

  // Mask all but the final four digits.
  const maskedPhone = useMemo(() => {
    const digits = String(providerPhone).replace(/\D/g, "");

    if (!digits) return "xxxxxxxxxx";

    return "x".repeat(Math.max(6, digits.length - 4)) + digits.slice(-4);
  }, [providerPhone]);

  // ----------------------------------------
  // LOADING
  // ----------------------------------------

  if (loading) {
    return (
      <div className="min-h-150 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading provider details...</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // ERROR
  // ----------------------------------------

  if (error || !provider) {
    return (
      <div className="min-h-150 flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={30} />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Provider not found
          </h2>

          <p className="text-slate-500 mt-2">
            {error || "The requested provider could not be found."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button
              type="button"
              onClick={fetchProvider}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition"
            >
              <RefreshCw size={17} />
              Try Again
            </button>

            <Link
              to="/providers"
              className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-medium transition"
            >
              <ArrowLeft size={17} />
              Back to Providers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // MAIN UI
  // ----------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="mt-6">
            <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
              <Briefcase size={16} />
              FIXNEAR Professional Profile
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mt-4">
              Provider Details
            </h1>

            <p className="text-slate-300 mt-2">
              Get to know your local service professional.
            </p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        {/* PROFILE CARD */}
        <div className="-mt-8 relative">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3">
              <div className="h-80 lg:h-107.5 bg-slate-100 overflow-hidden">
                {providerImage ? (
                  <img
                    src={providerImage}
                    alt={providerName}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
                    <div className="w-28 h-28 rounded-3xl bg-white shadow-sm flex items-center justify-center">
                      <UserRound size={56} className="text-blue-600" />
                    </div>
                    <p className="text-slate-500 text-sm mt-4">
                      Provider profile
                    </p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 p-6 sm:p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-3">
                  {verified && (
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                      <CheckCircle size={15} />
                      Verified Provider
                    </span>
                  )}

                  {availability !== false && (
                    <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      Available
                    </span>
                  )}

                  {availability === false && (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                      <Clock size={14} />
                      Currently unavailable
                    </span>
                  )}
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-5 wrap-break-words">
                  {providerName}
                </h2>

                {category && (
                  <div className="flex items-center gap-2 text-blue-600 mt-3">
                    <Wrench size={18} />
                    <span className="font-medium">{category}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-5 mt-5">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={18} className="shrink-0" />
                    <span>{providerLocation}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Star
                      size={18}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    <span className="font-bold text-slate-800">
                      {ratingValue != null
                        ? Number(ratingValue).toFixed(1)
                        : "New"}
                    </span>
                    <span className="text-slate-500">
                      ({reviewCount} reviews)
                    </span>
                  </div>
                </div>

                {/* QUICK STATS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-7">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <Briefcase size={19} className="text-blue-600 mb-2" />
                    <p className="text-xs text-slate-400">Experience</p>
                    <p className="font-bold text-slate-800 mt-1">
                      {experience != null
                        ? `${experience} years`
                        : "Not specified"}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <Star
                      size={19}
                      className="text-amber-400 fill-amber-400 mb-2"
                    />
                    <p className="text-xs text-slate-400">Rating</p>
                    <p className="font-bold text-slate-800 mt-1">
                      {ratingValue != null
                        ? Number(ratingValue).toFixed(1)
                        : "New"}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 col-span-2 sm:col-span-1">
                    <CheckCircle size={19} className="text-green-600 mb-2" />
                    <p className="text-xs text-slate-400">Completed jobs</p>
                    <p className="font-bold text-slate-800 mt-1">
                      {bookingsCount ?? "Not specified"}
                    </p>
                  </div>
                </div>

                {description && (
                  <div className="mt-7">
                    <h3 className="text-lg font-bold text-slate-900">
                      About the provider
                    </h3>
                    <p className="text-slate-600 leading-7 mt-2 whitespace-pre-line">
                      {description}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <Link
                    to={`/booking?provider=${encodeURIComponent(
                      provider?._id || provider?.id || id,
                    )}`}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"
                  >
                    <CalendarDays size={18} />
                    Book Provider
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    to="/services"
                    className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-semibold transition"
                  >
                    Browse Services
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-8">
            {/* SERVICES */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Wrench size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Services
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Services listed by this provider
                  </p>
                </div>
              </div>

              {services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-slate-50 border border-slate-100 rounded-xl p-5 hover:border-blue-200 transition"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle
                          size={19}
                          className="text-green-500 shrink-0 mt-0.5"
                        />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-800">
                            {service.name}
                          </h3>

                          {service.description && (
                            <p className="text-sm text-slate-500 leading-6 mt-2">
                              {service.description}
                            </p>
                          )}

                          {service.price != null && (
                            <p className="flex items-center gap-1 text-blue-600 font-bold mt-3">
                              <IndianRupee size={15} />
                              {formatPrice(service.price)}
                            </p>
                          )}

                          {service.duration && (
                            <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                              <Clock size={14} />
                              {service.duration}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 bg-slate-50 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <Wrench size={20} className="text-blue-600 shrink-0" />
                    <p className="text-slate-600">
                      {category ||
                        provider?.service ||
                        "Service information has not been added yet."}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* BUSINESS INFORMATION */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Building2 size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Business Information
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Additional details from the provider profile
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                {category && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      Category
                    </p>
                    <p className="font-semibold text-slate-800 mt-2">
                      {category}
                    </p>
                  </div>
                )}

                {provider?.businessName && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      Business name
                    </p>
                    <p className="font-semibold text-slate-800 mt-2">
                      {provider.businessName}
                    </p>
                  </div>
                )}

                {experience != null && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      Years of experience
                    </p>
                    <p className="font-semibold text-slate-800 mt-2">
                      {experience} {Number(experience) === 1 ? "year" : "years"}
                    </p>
                  </div>
                )}

                {providerPrice != null && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      Starting price / rate
                    </p>
                    <p className="flex items-center gap-1 font-semibold text-blue-600 mt-2">
                      <IndianRupee size={16} />
                      {formatPrice(providerPrice)}
                    </p>
                  </div>
                )}

                {formattedJoinedDate && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      Member since
                    </p>
                    <p className="font-semibold text-slate-800 mt-2">
                      {formattedJoinedDate}
                    </p>
                  </div>
                )}

                {provider?.website && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      Website
                    </p>
                    <a
                      href={
                        String(provider.website).startsWith("http")
                          ? provider.website
                          : `https://${provider.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700 mt-2 break-all"
                    >
                      <Globe size={16} />
                      Visit website
                    </a>
                  </div>
                )}

                {provider?.businessAddress && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      Business address
                    </p>
                    <p className="flex items-start gap-2 text-slate-700 mt-2">
                      <MapPin
                        size={17}
                        className="text-blue-600 shrink-0 mt-0.5"
                      />
                      {provider.businessAddress}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* CONTACT INFORMATION - AUTHENTICATION MODIFIED */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7">
              <h2 className="text-xl font-bold text-slate-900">
                Contact Information
              </h2>

              <div className="space-y-5 mt-6">
                {/* PHONE */}
                {providerPhone && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                      <Phone size={21} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm text-slate-400">Phone</p>
                      <button
                        type="button"
                        onClick={handleContactProvider}
                        className="text-base font-medium text-slate-800 hover:text-blue-600 break-all text-left"
                      >
                        {isLoggedIn ? providerPhone : maskedPhone}
                      </button>

                      {!isLoggedIn && (
                        <p className="text-xs text-slate-400 mt-1">
                          Log in to view the full number
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* EMAIL */}
                {providerEmail && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                      <Mail size={21} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm text-slate-400">Email</p>
                      <button
                        type="button"
                        onClick={handleSendEmail}
                        className="text-base font-medium text-slate-800 hover:text-blue-600 break-all text-left"
                      >
                        {isLoggedIn ? providerEmail : "Login to view email"}
                      </button>
                    </div>
                  </div>
                )}

                {/* LOCATION */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                    <MapPin size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-400">Location</p>
                    <p className="text-base font-medium text-slate-800 mt-1">
                      {providerLocation}
                    </p>
                  </div>
                </div>

                {!providerPhone && !providerEmail && (
                  <p className="text-sm text-slate-500">
                    Contact details are not available.
                  </p>
                )}
              </div>

              {providerPhone && (
                <button
                  type="button"
                  onClick={handleContactProvider}
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold transition"
                >
                  {isLoggedIn ? <Phone size={20} /> : <LockKeyhole size={20} />}
                  Contact Provider
                </button>
              )}

              {providerEmail && (
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="w-full mt-3 flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 py-4 rounded-2xl font-semibold transition"
                >
                  {isLoggedIn ? <Mail size={20} /> : <LockKeyhole size={20} />}
                  Send Email
                </button>
              )}
            </section>

            {/* RATINGS */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                  <Star size={22} className="fill-amber-400" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Customer Ratings</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Provider feedback
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-slate-900">
                    {ratingValue != null ? Number(ratingValue).toFixed(1) : "—"}
                  </span>
                  <span className="text-sm text-slate-500 mb-1">out of 5</span>
                </div>

                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((number) => (
                    <Star
                      key={number}
                      size={17}
                      className={
                        Number(ratingValue || 0) >= number
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }
                    />
                  ))}
                </div>

                <p className="text-sm text-slate-500 mt-3">
                  {reviewCount} customer{" "}
                  {reviewCount === 1 ? "review" : "reviews"}
                </p>
              </div>

              <Link
                to="/services"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold mt-5"
              >
                Explore services
                <ArrowRight size={16} />
              </Link>
            </section>

            {/* TRUST CARD */}
            <section className="bg-slate-900 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} className="text-green-400 shrink-0" />
                <h3 className="font-bold">FIXNEAR Trusted Provider</h3>
              </div>

              <p className="text-slate-300 text-sm leading-6 mt-3">
                Choose a professional based on the available profile, services,
                experience, and customer feedback.
              </p>

              {verified && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
                  <BadgeCheck size={18} className="text-green-400" />
                  <span className="text-sm text-green-300 font-medium">
                    Verification approved
                  </span>
                </div>
              )}

              {formattedJoinedDate && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
                  <Award size={18} className="text-blue-300" />
                  <span className="text-sm text-slate-300">
                    Member since {formattedJoinedDate}
                  </span>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* BOTTOM NAVIGATION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-slate-200">
          <Link
            to="/providers"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition"
          >
            <ArrowLeft size={18} />
            Back to Providers
          </Link>

          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition"
          >
            Find another service
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>

      {/* LOGIN / REGISTER MODAL */}
      {showAuthModal && !isLoggedIn && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAuthModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              aria-label="Close popup"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <LockKeyhole size={30} />
            </div>

            <h2
              id="contact-modal-title"
              className="mt-5 text-center text-2xl font-bold text-slate-900"
            >
              Login to Contact Provider
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-slate-500">
              {requestedAction === "call"
                ? "Please log in or register to view the complete phone number and contact this provider."
                : requestedAction === "email"
                  ? "Please log in or register to view the provider's email address."
                  : "Please log in or register to access the provider's contact details."}
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleLogin}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <UserRound size={18} />
                Login
              </button>

              <button
                type="button"
                onClick={handleRegister}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                <UserPlus size={18} />
                Register
              </button>
            </div>

            <p className="mt-5 text-center text-xs text-slate-400">
              Join FixNear to connect with local professionals.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderDetails;
