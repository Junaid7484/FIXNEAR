import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Clock,
  Headphones,
  LocateFixed,
  Search,
  Loader2,
  Navigation,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  password: "",
  confirmPassword: "",
};

const initialCoordinates = null;

const inputClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-700";

const iconClass =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400";

function getPreferredLanguage() {
  if (typeof navigator === "undefined") return "en";
  return navigator.languages?.join(",") || navigator.language || "en";
}

function normalizeText(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function extractAddressFields(data = {}) {
  const details =
    data.addressDetails ||
    data.addressComponents ||
    data.address_components ||
    data.details ||
    data.address ||
    data.raw?.address ||
    data.data?.addressDetails ||
    data.data?.address ||
    {};

  const city = firstNonEmpty(
    details.city,
    details.town,
    details.village,
    details.municipality,
    details.city_district,
    details.suburb,
    details.district,
    details.county,
    details.state_district,
    data.city,
    data.data?.city,
  );

  const state = firstNonEmpty(
    details.state,
    details.region,
    details.state_name,
    details.state_district,
    data.state,
    data.data?.state,
  );

  const houseNumber = details.house_number || details.building || "";
  const road = details.road || details.pedestrian || details.street || "";
  const neighbourhood =
    details.neighbourhood ||
    details.suburb ||
    details.quarter ||
    details.residential ||
    "";

  const streetAddress = [houseNumber, road, neighbourhood]
    .map(normalizeText)
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .join(", ");

  const fallbackAddress = firstNonEmpty(
    typeof data.address === "string" ? data.address : "",
    data.display_name,
    data.formattedAddress,
    data.formatted_address,
    typeof data.data?.address === "string" ? data.data.address : "",
    data.data?.display_name,
  );

  return {
    address: streetAddress || fallbackAddress,
    city,
    state,
  };
}

function getValidCoordinates(data) {
  const location = data?.location || data?.data?.location;
  const coordinates = location?.coordinates;

  if (
    data?.success === false ||
    location?.type !== "Point" ||
    !Array.isArray(coordinates) ||
    coordinates.length !== 2
  ) {
    throw new Error(
      data?.message ||
        "No coordinates were found for this location. Please try a more complete address.",
    );
  }

  // GeoJSON coordinate order is [longitude, latitude].
  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);

  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error("The location service returned invalid coordinates.");
  }

  return { latitude, longitude };
}

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [coordinates, setCoordinates] = useState(initialCoordinates);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const busy = loading || locating || geocoding;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (["address", "city", "state"].includes(name)) {
      setCoordinates(null);
    }

    setError("");
    setSuccess("");
  };

  const applyAddressDetails = (data, { overwrite = true } = {}) => {
    const parts = extractAddressFields(data);

    setFormData((previous) => ({
      ...previous,
      address: overwrite
        ? parts.address || previous.address
        : previous.address.trim()
          ? previous.address
          : parts.address || previous.address,
      city: overwrite
        ? parts.city || previous.city
        : previous.city.trim()
          ? previous.city
          : parts.city || previous.city,
      state: overwrite
        ? parts.state || previous.state
        : previous.state.trim()
          ? previous.state
          : parts.state || previous.state,
    }));

    return parts;
  };

  // Direct client reverse geocoding fallback for resilience against 502 Bad Gateway
  const fetchDirectReverseGeocode = async (lat, lon) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Fallback reverse geocode failed");
    return res.json();
  };

  // Fetch device GPS coordinates and populate address, city, and state
  const handleUseCurrentLocation = () => {
    setError("");
    setSuccess("");

    if (!navigator.geolocation) {
      setError("Your browser does not support location detection.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude);
        const longitude = Number(position.coords.longitude);

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          setLocating(false);
          setError(
            "Your browser returned an invalid location. Please try again.",
          );
          return;
        }

        setCoordinates({ latitude, longitude });

        let addressResolved = false;

        // Try backend endpoint first
        try {
          const response = await axios.post(
            `${API_BASE}/location/reverse`,
            {
              latitude,
              longitude,
              language: getPreferredLanguage(),
            },
            { timeout: 12000 },
          );

          if (response.data?.success) {
            applyAddressDetails(response.data, { overwrite: true });
            addressResolved = true;
          }
        } catch (backendError) {
          console.warn(
            "Backend reverse-geocode failed, using direct client lookup",
            backendError,
          );
        }

        // Fallback to OpenStreetMap Nominatim directly
        if (!addressResolved) {
          try {
            const directData = await fetchDirectReverseGeocode(
              latitude,
              longitude,
            );
            applyAddressDetails(directData, { overwrite: true });
            addressResolved = true;
          } catch (directErr) {
            console.error("Direct reverse geocoding failed:", directErr);
          }
        }

        setLocating(false);

        if (addressResolved) {
          setSuccess(
            "Current location fetched. Address, City, and State filled automatically.",
          );
        } else {
          setSuccess(
            "GPS coordinates detected. Please enter your street address, city, and state manually.",
          );
        }
      },
      (geoError) => {
        const messages = {
          1: "Location permission was denied. Allow location access in your browser and try again.",
          2: "Your current location is unavailable. Please try again or enter your address manually.",
          3: "Location detection timed out. Please try again.",
        };

        setError(
          messages[geoError.code] ||
            "Unable to detect your location. Please enter your address manually.",
        );
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  // Convert typed address into coordinates and complete missing city/state
  const handleFindAddressCoordinates = async () => {
    setError("");
    setSuccess("");

    if (
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.state.trim()
    ) {
      setError("Please enter your street address, city, and state first.");
      return;
    }

    const fullAddress = [
      formData.address.trim(),
      formData.city.trim(),
      formData.state.trim(),
      "India",
    ]
      .filter(Boolean)
      .join(", ");

    try {
      setGeocoding(true);

      let coordinatesFound = null;

      try {
        const response = await axios.post(
          `${API_BASE}/location/geocode`,
          {
            address: fullAddress,
            language: getPreferredLanguage(),
          },
          { timeout: 12000 },
        );

        coordinatesFound = getValidCoordinates(response.data);
        applyAddressDetails(response.data, { overwrite: false });
      } catch (backendErr) {
        console.warn(
          "Backend geocode lookup failed, attempting direct search fallback",
          backendErr,
        );
      }

      if (!coordinatesFound) {
        const encoded = encodeURIComponent(fullAddress);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encoded}&limit=1`,
          { headers: { Accept: "application/json" } },
        );
        const list = await res.json();

        if (Array.isArray(list) && list.length > 0) {
          coordinatesFound = {
            latitude: Number(list[0].lat),
            longitude: Number(list[0].lon),
          };
          applyAddressDetails(list[0], { overwrite: false });
        }
      }

      if (!coordinatesFound) {
        throw new Error(
          "Unable to locate this address. Try adding a nearby landmark or pincode.",
        );
      }

      setCoordinates(coordinatesFound);
      setSuccess("Address verified. Location will be saved automatically.");
    } catch (lookupError) {
      setCoordinates(null);
      setError(
        lookupError.response?.data?.message ||
          lookupError.message ||
          "Unable to find this address. Try adding a nearby landmark.",
      );
    } finally {
      setGeocoding(false);
    }
  };

  const resolveCoordinatesForSubmit = async () => {
    if (coordinates) return coordinates;

    const fullAddress = [
      formData.address.trim(),
      formData.city.trim(),
      formData.state.trim(),
      "India",
    ]
      .filter(Boolean)
      .join(", ");

    try {
      const response = await axios.post(
        `${API_BASE}/location/geocode`,
        {
          address: fullAddress,
          language: getPreferredLanguage(),
        },
        { timeout: 12000 },
      );

      const resolvedCoordinates = getValidCoordinates(response.data);
      setCoordinates(resolvedCoordinates);
      return resolvedCoordinates;
    } catch {
      const encoded = encodeURIComponent(fullAddress);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encoded}&limit=1`,
        { headers: { Accept: "application/json" } },
      );
      const list = await res.json();

      if (Array.isArray(list) && list.length > 0) {
        const fallbackCoords = {
          latitude: Number(list[0].lat),
          longitude: Number(list[0].lon),
        };
        setCoordinates(fallbackCoords);
        return fallbackCoords;
      }

      throw new Error(
        "Could not verify your address location. Please click 'Get current location' or refine your address.",
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.state.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const resolved = await resolveCoordinatesForSubmit();

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        password: formData.password,
        location: {
          type: "Point",
          coordinates: [resolved.longitude, resolved.latitude],
        },
      };

      const response = await axios.post(`${API_BASE}/auth/register`, payload, {
        timeout: 20000,
      });

      const data = response.data;

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.user.role) {
          localStorage.setItem("role", data.user.role);
        }
      }

      setSuccess("Account created successfully!");

      setTimeout(() => {
        navigate("/customer/dashboard", { replace: true });
      }, 800);
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          submitError.response?.data?.error ||
          submitError.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-4 sm:px-5 sm:py-6">
      <section className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:min-h-170 lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-slate-950 via-blue-950 to-blue-800 p-8 text-white lg:flex">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
              <Zap className="h-3.5 w-3.5" />
              Your neighbourhood, simplified
            </span>

            <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight">
              Reliable help,
              <br />
              right around
              <br />
              the corner.
            </h1>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-blue-100/80">
              Create your FixNear account and connect with local service
              professionals for the help you need.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  icon: CheckCircle2,
                  title: "Trusted professionals",
                  description: "Find help for everyday needs.",
                },
                {
                  icon: Clock,
                  title: "Simple booking",
                  description: "Manage your service requests easily.",
                },
                {
                  icon: Headphones,
                  title: "Support when needed",
                  description: "Keep your service details in one place.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                      <Icon className="h-4 w-4 text-cyan-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-0.5 text-xs text-blue-100/70">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative mt-8 flex items-center gap-2 border-t border-white/15 pt-5 text-xs text-blue-100/75">
            <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-300" />
            Your account details are protected.
          </div>
        </aside>

        <div className="min-w-0 p-5 sm:p-8 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Get started today
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Create your account
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter your details to join FixNear.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700"
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    Full name *
                  </label>
                  <div className="relative">
                    <User className={iconClass} />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      className={inputClass}
                      required
                      disabled={busy}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email address *
                  </label>
                  <div className="relative">
                    <Mail className={iconClass} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass}
                      required
                      disabled={busy}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className={labelClass}>
                    Phone number *
                  </label>
                  <div className="relative">
                    <Phone className={iconClass} />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClass}
                      required
                      disabled={busy}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className={labelClass}>
                    Street address *
                  </label>
                  <div className="relative">
                    <MapPin className={iconClass} />
                    <input
                      id="address"
                      name="address"
                      type="text"
                      autoComplete="street-address"
                      placeholder="House number, street, locality"
                      value={formData.address}
                      onChange={handleChange}
                      className={inputClass}
                      required
                      disabled={busy}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="city" className={labelClass}>
                    City *
                  </label>
                  <div className="relative">
                    <MapPin className={iconClass} />
                    <input
                      id="city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      placeholder="Enter your city"
                      value={formData.city}
                      onChange={handleChange}
                      className={inputClass}
                      required
                      disabled={busy}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="state" className={labelClass}>
                    State *
                  </label>
                  <div className="relative">
                    <MapPin className={iconClass} />
                    <input
                      id="state"
                      name="state"
                      type="text"
                      autoComplete="address-level1"
                      placeholder="Enter your state"
                      value={formData.state}
                      onChange={handleChange}
                      className={inputClass}
                      required
                      disabled={busy}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Set your location
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Fetch your current address, city, and state automatically
                      using GPS or verify your entered address.
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={busy}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {locating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LocateFixed className="h-4 w-4" />
                    )}
                    {locating ? "Fetching address..." : "Get current location"}
                  </button>

                  <button
                    type="button"
                    onClick={handleFindAddressCoordinates}
                    disabled={busy}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {geocoding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    {geocoding
                      ? "Verifying address..."
                      : "Verify typed address"}
                  </button>
                </div>

                {coordinates && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Location and coordinates verified successfully.
                  </div>
                )}

                <p className="mt-2 text-[11px] leading-5 text-slate-500">
                  GPS works when location permission is allowed and the site is
                  served over HTTPS or localhost.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className={labelClass}>
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className={iconClass} />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className={`${inputClass} pr-10`}
                      minLength={6}
                      required
                      disabled={busy}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className={labelClass}>
                    Confirm password *
                  </label>
                  <div className="relative">
                    <Lock className={iconClass} />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`${inputClass} pr-10`}
                      minLength={6}
                      required
                      disabled={busy}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((previous) => !previous)
                      }
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-500">
                By creating an account, you agree to provide accurate
                information and use FixNear responsibly.
              </p>

              <button
                type="submit"
                disabled={busy}
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  Sign in
                </Link>
              </p>

              <div className="flex items-center justify-center gap-2 pt-1 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4" />
                Your account details are protected.
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
