import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  MapPin,
  LocateFixed,
  Search,
  RefreshCw,
  BriefcaseBusiness,
  Clock3,
  SlidersHorizontal,
  Navigation,
  MapPinned,
  Wrench,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  UserRound,
  ChevronRight,
  ArrowUpRight,
  Star,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const RADIUS_OPTIONS = [5, 10, 20, 50];

// Safe coordinate verification matching backend standards
const validCoordinates = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

const getPreferredLanguage = () => {
  if (typeof navigator === "undefined") return "en";
  return (
    navigator.languages?.find((lang) => lang && lang.trim()) ||
    navigator.language ||
    "en"
  );
};

// Supports image strings and nested image formats from MongoDB/Cloudinary
const normalizeImage = (value) => {
  if (typeof value === "string") return value.trim();

  if (value && typeof value === "object") {
    return (
      value.url ||
      value.secure_url ||
      value.imageUrl ||
      value.src ||
      value.path ||
      ""
    );
  }

  return "";
};

const getProviderImage = (provider) => {
  const user = provider?.user || {};

  const candidates = [
    provider?.profileImage,
    provider?.profilePicture,
    provider?.profilePhoto,
    provider?.avatar,
    provider?.photo,
    provider?.image,
    user?.profileImage,
    user?.profilePicture,
    user?.profilePhoto,
    user?.avatar,
    user?.photo,
    user?.image,
  ];

  return candidates.map(normalizeImage).find(Boolean) || "";
};

const getServiceName = (item) => {
  const service = item?.service;

  if (typeof service === "string") return service;

  return (
    service?.name ||
    service?.title ||
    item?.name ||
    item?.title ||
    "Local service"
  );
};

const getProviderId = (provider) => provider?._id || provider?.id || "";

const getProviderAddress = (provider) =>
  [provider?.address, provider?.city, provider?.state]
    .filter(Boolean)
    .join(", ");

const getServiceId = (item) => {
  if (item?.service && typeof item.service === "object") {
    return item.service._id || item.service.id || "";
  }

  return typeof item?.service === "string" ? item.service : "";
};

const getBookingUrl = (provider, providerService) => {
  const providerId = getProviderId(provider);
  const serviceId = getServiceId(providerService);
  const providerServiceId = providerService?._id || providerService?.id || "";

  if (!providerId || !serviceId || !providerServiceId) {
    return "";
  }

  const params = new URLSearchParams({
    service: String(serviceId),
    provider: String(providerId),
    providerService: String(providerServiceId),
  });

  return `/booking?${params.toString()}`;
};

// Fallback direct reverse-geocode when the backend endpoint is unreachable
const fetchDirectReverseGeocode = async (lat, lon, language) => {
  const cleanLang = (language || "en").split("-")[0];
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=${cleanLang},en`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Direct geocoding lookup failed");
  }

  return response.json();
};

function ProviderAvatar({ provider }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getProviderImage(provider);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  if (!imageUrl || imageFailed) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-blue-100 to-indigo-100 text-blue-700 ring-1 ring-blue-100">
        <BriefcaseBusiness size={28} />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={`${provider?.businessName || provider?.user?.name || "Provider"} profile`}
      className="h-16 w-16 shrink-0 rounded-2xl border border-slate-200 bg-slate-100 object-cover shadow-sm"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setImageFailed(true)}
    />
  );
}

function NearbyServices() {
  const [radius, setRadius] = useState(10);
  const [location, setLocation] = useState(null);
  const [resolvedAddressLabel, setResolvedAddressLabel] = useState("");
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [selectedServices, setSelectedServices] = useState({});

  const preferredLanguage = getPreferredLanguage();

  const resolveLocationAddress = useCallback(
    async (lat, lng) => {
      let resolvedText = "";

      // 1. Try Backend reverse geocode
      try {
        const response = await axios.post(
          `${BASE_URL}/location/reverse`,
          {
            latitude: lat,
            longitude: lng,
            language: preferredLanguage,
          },
          { timeout: 8000 },
        );

        if (response.data?.success && response.data?.address) {
          resolvedText = response.data.address;
        }
      } catch (backendErr) {
        console.warn(
          "Backend reverse geocode failed, using direct client lookup",
          backendErr,
        );
      }

      // 2. Client-side Nominatim fallback
      if (!resolvedText) {
        try {
          const directData = await fetchDirectReverseGeocode(
            lat,
            lng,
            preferredLanguage,
          );
          resolvedText =
            directData?.display_name ||
            [
              directData?.address?.suburb,
              directData?.address?.city,
              directData?.address?.state,
            ]
              .filter(Boolean)
              .join(", ");
        } catch (directErr) {
          console.warn("Direct geocoding lookup failed:", directErr);
        }
      }

      if (resolvedText) {
        setResolvedAddressLabel(resolvedText);
        setLocationMessage(`GPS Active: ${resolvedText}`);
      } else {
        setLocationMessage("Your current location coordinates are ready.");
      }
    },
    [preferredLanguage],
  );

  const requestLocation = useCallback(() => {
    setError("");
    setLocationMessage("");
    setResolvedAddressLabel("");

    if (!navigator.geolocation) {
      setError("Your browser does not support GPS location access.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude);
        const longitude = Number(position.coords.longitude);

        if (!validCoordinates(latitude, longitude)) {
          setError(
            "Your browser returned invalid GPS coordinates. Please try again.",
          );
          setLocating(false);
          return;
        }

        const coords = { lat: latitude, lng: longitude };
        setLocation(coords);
        setLocating(false);

        // Fetch readable address asynchronously
        resolveLocationAddress(latitude, longitude);
      },
      (geoError) => {
        const messages = {
          1: "Location permission was denied. Allow location access in your browser settings and try again.",
          2: "Your location could not be determined. Check your device location settings.",
          3: "The location request timed out. Please try again.",
        };

        setError(
          messages[geoError.code] ||
            "We could not access your location. Please try again.",
        );
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  }, [resolveLocationAddress]);

  useEffect(() => {
    if (!location) return;

    let cancelled = false;

    const fetchNearbyProviders = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get(`${BASE_URL}/providers/nearby`, {
          params: {
            lat: location.lat,
            lng: location.lng,
            radius,
          },
        });

        if (cancelled) return;

        const list = Array.isArray(response?.data?.providers)
          ? response.data.providers
          : [];

        setProviders(list);
        setSelectedServices({});
      } catch (err) {
        if (cancelled) return;

        setProviders([]);
        setError(
          err?.response?.data?.message ||
            "Could not load nearby services. Check that your backend is running and try again.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchNearbyProviders();

    return () => {
      cancelled = true;
    };
  }, [location, radius, retryKey]);

  const filteredProviders = useMemo(() => {
    const term = searchText.trim().toLowerCase();

    if (!term) return providers;

    return providers.filter((provider) => {
      const services = Array.isArray(provider?.services)
        ? provider.services
        : [];

      const searchableText = [
        provider?.businessName,
        provider?.name,
        provider?.ownerName,
        provider?.description,
        provider?.address,
        provider?.city,
        provider?.state,
        ...services.map(getServiceName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(term);
    });
  }, [providers, searchText]);

  const serviceCategoryCount = useMemo(() => {
    const names = new Set();

    providers.forEach((provider) => {
      (Array.isArray(provider?.services) ? provider.services : []).forEach(
        (service) => names.add(getServiceName(service)),
      );
    });

    return names.size;
  }, [providers]);

  const handleRetry = () => {
    if (!location) {
      requestLocation();
      return;
    }

    setRetryKey((value) => value + 1);
  };

  const handleServiceChange = (providerId, serviceId) => {
    setSelectedServices((previous) => ({
      ...previous,
      [providerId]: serviceId,
    }));
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-950 via-blue-950 to-indigo-800 text-white">
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100">
                <MapPin size={16} />
                Your neighborhood, connected
              </div>

              <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Great services.
                <span className="block text-blue-300">
                  Just around the corner.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                Discover local professionals, explore their services, and book
                the help you need with FixNear.
              </p>

              <button
                type="button"
                onClick={requestLocation}
                disabled={locating}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-blue-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {locating ? (
                  <RefreshCw size={19} className="animate-spin" />
                ) : (
                  <LocateFixed size={19} />
                )}
                {locating
                  ? "Finding your location..."
                  : location
                    ? "Refresh my location"
                    : "Find services near me"}
              </button>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-100">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Verified professionals
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={16} />
                  GPS-based search
                </span>
              </div>
            </div>

            {/* Radius selector */}
            <div className="rounded-3xl border border-white/15 bg-white/8 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-blue-400/15 p-3.5 text-blue-200">
                  <SlidersHorizontal size={25} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Explore your area</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Set your preferred search distance.
                  </p>
                </div>
              </div>

              <p className="mt-7 text-sm font-semibold text-slate-200">
                Search radius
              </p>

              <div className="mt-3 grid grid-cols-4 gap-2">
                {RADIUS_OPTIONS.map((distance) => (
                  <button
                    type="button"
                    key={distance}
                    onClick={() => setRadius(distance)}
                    aria-pressed={radius === distance}
                    className={`rounded-xl border px-2 py-3 text-sm font-bold transition ${
                      radius === distance
                        ? "border-white bg-white text-blue-950 shadow-md"
                        : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {distance} km
                  </button>
                ))}
              </div>

              <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-slate-300">
                <Navigation size={17} className="mt-1 shrink-0 text-blue-300" />
                {location
                  ? `Searching within ${radius} km of your GPS location.`
                  : "Allow browser location access to find nearby providers."}
              </p>

              {location && (
                <div className="mt-5 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      GPS Coordinates:
                    </span>
                    <span>
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </span>
                  </div>
                  {resolvedAddressLabel && (
                    <p className="mt-1.5 truncate text-[11px] text-slate-400">
                      {resolvedAddressLabel}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
        {locationMessage && location && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
            <CheckCircle2 size={19} className="shrink-0 text-emerald-600" />
            <span className="truncate">{locationMessage}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-4 rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                <AlertCircle size={22} />
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  Unable to complete your search
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{error}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        )}

        {!location && !error && (
          <div className="mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="grid items-center gap-6 p-6 sm:p-10 md:grid-cols-[auto_1fr]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-700 md:mx-0">
                <MapPinned size={36} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Let's find services near you
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  FixNear uses your device coordinates to find verified,
                  available providers within your preferred radius.
                </p>
                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={locating}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {locating ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <LocateFixed size={18} />
                  )}
                  {locating ? "Getting location..." : "Use my location"}
                </button>
              </div>
            </div>
          </div>
        )}

        {location && (
          <>
            <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
                  FIXNEAR DISCOVERY
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  Nearby professionals
                </h2>
                <p className="mt-3 text-sm text-slate-500 sm:text-base">
                  {loading
                    ? "Finding professionals in your area..."
                    : `${filteredProviders.length} ${
                        filteredProviders.length === 1
                          ? "professional"
                          : "professionals"
                      } within ${radius} km`}
                  {!loading && providers.length > 0 && (
                    <span> · {serviceCategoryCount} service categories</span>
                  )}
                </p>
              </div>

              <div className="relative w-full lg:max-w-md">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search providers or services..."
                  aria-label="Search providers or services"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            {loading && (
              <div
                role="status"
                aria-live="polite"
                className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 rounded-2xl bg-slate-200" />
                      <div className="flex-1">
                        <div className="h-4 w-3/4 rounded bg-slate-200" />
                        <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
                      </div>
                    </div>
                    <div className="mt-7 h-4 w-1/2 rounded bg-slate-200" />
                    <div className="mt-3 h-3 w-full rounded bg-slate-100" />
                    <div className="mt-3 h-3 w-4/5 rounded bg-slate-100" />
                    <div className="mt-7 h-10 rounded-xl bg-slate-100" />
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="h-11 rounded-xl bg-slate-200" />
                      <div className="h-11 rounded-xl bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && filteredProviders.length > 0 && (
              <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProviders.map((provider, index) => {
                  const providerId = getProviderId(provider);
                  const services = Array.isArray(provider?.services)
                    ? provider.services
                    : [];

                  const validServices = services.filter(
                    (service) =>
                      (service?._id || service?.id) && getServiceId(service),
                  );

                  const selectedServiceId = selectedServices[providerId];
                  const selectedService =
                    validServices.find(
                      (service) =>
                        String(service._id || service.id) ===
                        String(selectedServiceId),
                    ) || validServices[0];

                  const bookingUrl = selectedService
                    ? getBookingUrl(provider, selectedService)
                    : "";

                  const businessName =
                    provider?.businessName ||
                    provider?.name ||
                    "Local service provider";

                  const ownerName =
                    provider?.user?.name ||
                    provider?.ownerName ||
                    "Local professional";

                  const address = getProviderAddress(provider);

                  const experience =
                    provider?.experience ?? provider?.experienceYears;

                  const rating =
                    provider?.rating ??
                    provider?.averageRating ??
                    provider?.averageRatingValue;

                  // Matches the canonical provider profile route
                  const profileUrl = providerId
                    ? `/providers/${providerId}`
                    : "/providers";

                  return (
                    <article
                      key={providerId || `${businessName}-${index}`}
                      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
                    >
                      <div className="h-1.5 bg-linear-to-r from-blue-600 via-indigo-500 to-sky-400" />

                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        {/* Provider identity */}
                        <div className="flex items-center gap-4">
                          <ProviderAvatar provider={provider} />

                          <div className="min-w-0 flex-1">
                            <h3 className="wrap-break-words text-lg font-extrabold leading-6 text-slate-900 group-hover:text-blue-800">
                              {businessName}
                            </h3>
                            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                              <UserRound size={14} className="shrink-0" />
                              <span className="truncate">{ownerName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                            <CheckCircle2 size={13} />
                            Verified & available
                          </span>

                          {rating !== undefined && rating !== null && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-100">
                              <Star
                                size={13}
                                className="fill-amber-400 text-amber-400"
                              />
                              {Number(rating).toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                          <div className="flex items-start gap-2.5 text-sm leading-5 text-slate-600">
                            <MapPin
                              size={17}
                              className="mt-0.5 shrink-0 text-blue-600"
                            />
                            <span>{address || "Address not provided"}</span>
                          </div>

                          {experience !== undefined && experience !== null && (
                            <div className="flex items-center gap-2.5 text-sm text-slate-600">
                              <Clock3
                                size={17}
                                className="shrink-0 text-blue-600"
                              />
                              <span>
                                {experience}{" "}
                                {Number(experience) === 1 ? "year" : "years"} of
                                experience
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-6">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-extrabold uppercase tracking-[0.13em] text-slate-500">
                              Services offered
                            </h4>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                              {services.length}
                            </span>
                          </div>

                          {services.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {services.map((service, serviceIndex) => (
                                <span
                                  key={
                                    service?._id ||
                                    `${getServiceName(service)}-${serviceIndex}`
                                  }
                                  className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800"
                                >
                                  {getServiceName(service)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-slate-500">
                              Contact this provider for service details.
                            </p>
                          )}
                        </div>

                        {provider?.description && (
                          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                            {provider.description}
                          </p>
                        )}

                        {validServices.length > 1 && (
                          <div className="mt-5">
                            <label
                              htmlFor={`service-${providerId}`}
                              className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                            >
                              Choose a service to book
                            </label>
                            <select
                              id={`service-${providerId}`}
                              value={
                                selectedService?._id ||
                                selectedService?.id ||
                                ""
                              }
                              onChange={(event) =>
                                handleServiceChange(
                                  providerId,
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                              {validServices.map((service) => (
                                <option
                                  key={service._id || service.id}
                                  value={service._id || service.id}
                                >
                                  {getServiceName(service)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="mt-auto pt-6">
                          <div className="grid grid-cols-2 gap-3">
                            <Link
                              to={profileUrl}
                              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                            >
                              <UserRound size={17} />
                              <span>View Profile</span>
                              <ArrowUpRight size={14} />
                            </Link>

                            {bookingUrl ? (
                              <Link
                                to={bookingUrl}
                                className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-blue-700 px-2.5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
                              >
                                <CalendarCheck size={17} />
                                <span>Book Now</span>
                                <ChevronRight size={15} />
                              </Link>
                            ) : (
                              <button
                                type="button"
                                disabled
                                title="This provider has no bookable service."
                                className="inline-flex min-w-0 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-slate-200 px-2.5 py-3 text-sm font-bold text-slate-400"
                              >
                                <CalendarCheck size={17} />
                                <span>Book Now</span>
                              </button>
                            )}
                          </div>

                          {!validServices.length && (
                            <p className="mt-2 text-center text-xs text-slate-400">
                              Booking is unavailable because service details are
                              missing.
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!loading && !error && filteredProviders.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center sm:px-10">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
                  {providers.length > 0 ? (
                    <Search size={32} />
                  ) : (
                    <Wrench size={32} />
                  )}
                </div>

                <h3 className="mt-5 text-2xl font-extrabold text-slate-900">
                  {providers.length > 0
                    ? "No matching services"
                    : "No nearby services found"}
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                  {providers.length > 0
                    ? "Try another search term to find the professional or service you're looking for."
                    : `No verified, available providers with active services were found within ${radius} km.`}
                </p>

                {providers.length === 0 && radius < 50 && (
                  <button
                    type="button"
                    onClick={() =>
                      setRadius(
                        RADIUS_OPTIONS.find((distance) => distance > radius) ||
                          50,
                      )
                    }
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
                  >
                    Expand search radius
                    <ChevronRight size={17} />
                  </button>
                )}

                {providers.length > 0 && searchText && (
                  <button
                    type="button"
                    onClick={() => setSearchText("")}
                    className="mt-6 rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Clear search
                  </button>
                )}

                {providers.length === 0 && radius === 50 && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw size={16} />
                    Search again
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default NearbyServices;
