import { useEffect, useState, cloneElement, isValidElement } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  MapPin,
  Briefcase,
  FileText,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  LocateFixed,
  Upload,
  X,
  ArrowLeft,
  ShieldCheck,
  Clock3,
  Sparkles,
  MapPinned,
  Check,
  Search,
  Languages,
  Navigation,
} from "lucide-react";

import API from "../services/api";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  businessName: "",
  description: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  experience: "",
  profileImage: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

const FormSection = ({
  number,
  icon: Icon,
  title,
  subtitle,
  children,
  last = false,
}) => (
  <section
    className={`mb-8 sm:mb-10 ${
      last ? "mb-0" : "border-b border-slate-100 pb-8 sm:pb-10"
    }`}
  >
    <div className="mb-6 flex items-start gap-3 sm:gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <Icon size={21} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold tracking-wider text-blue-600">
            {number}
          </span>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            {title}
          </h2>
        </div>
        <p className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</p>
      </div>
    </div>

    {children}
  </section>
);

const Field = ({ label, icon: Icon, children }) => {
  const renderChild = () => {
    if (!Icon || !isValidElement(children)) return children;

    if (
      typeof children.type === "string" &&
      ["input", "textarea"].includes(children.type)
    ) {
      return cloneElement(children, {
        className: `${children.props.className || ""} pl-10`,
      });
    }

    return children;
  };

  return (
    <div className="min-w-0">
      <label className={labelClass}>{label}</label>
      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="pointer-events-none absolute left-3.5 top-3.5 z-10 text-slate-400"
          />
        )}
        {renderChild()}
      </div>
    </div>
  );
};

const getPreferredLanguage = () => {
  const languages = navigator.languages || [navigator.language || "en-IN"];
  return languages.find((lang) => lang && lang.trim()) || "en-IN";
};

const normalizeText = (value) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
};

const extractAddressFields = (data = {}) => {
  const details =
    data.addressDetails ||
    data.address_components ||
    data.addressData ||
    data.details ||
    data.address_details ||
    data.address ||
    {};

  const city =
    details.city ||
    details.town ||
    details.village ||
    details.municipality ||
    details.city_district ||
    details.county ||
    data.city ||
    "";

  const state = details.state || data.state || "";

  const pincode =
    details.postcode ||
    details.postal_code ||
    details.pincode ||
    data.pincode ||
    "";

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

  return {
    address: streetAddress || normalizeText(data.display_name || data.address),
    city: normalizeText(city),
    state: normalizeText(state),
    pincode: normalizeText(pincode),
  };
};

const validCoordinates = (latitude, longitude) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

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

const ProviderRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  // Coordinates are kept in state instead of visible form inputs
  const [coordinates, setCoordinates] = useState(null);

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locationMessage, setLocationMessage] = useState("");

  const busy = loading || locating || geocoding;
  const preferredLanguage = getPreferredLanguage();

  useEffect(() => {
    if (!profileImageFile) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(profileImageFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImageFile]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Invalidate saved coordinates if address text is modified
    if (["address", "city", "state", "pincode"].includes(name)) {
      setCoordinates(null);
    }

    setError("");
    setSuccess("");
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please choose a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Your profile image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setProfileImageFile(file);
    setError("");
    setSuccess("");
  };

  const handleRemoveImage = () => {
    setProfileImageFile(null);
    const fileInput = document.getElementById("profileImage");
    if (fileInput) fileInput.value = "";
  };

  const applyDetectedAddress = (data, options = {}) => {
    const { overwriteExisting = true } = options;
    const fields = extractAddressFields(data);

    setFormData((previous) => {
      const updateIfAllowed = (current, incoming) => {
        if (!incoming) return current;
        if (overwriteExisting || !current.trim()) {
          return incoming;
        }
        return current;
      };

      return {
        ...previous,
        address: updateIfAllowed(previous.address, fields.address),
        city: updateIfAllowed(previous.city, fields.city),
        state: updateIfAllowed(previous.state, fields.state),
        pincode: updateIfAllowed(previous.pincode, fields.pincode),
      };
    });

    return fields;
  };

  // 1. Detect GPS, auto-fill readable address fields, and store coordinates in internal state
  const handleUseCurrentLocation = () => {
    setError("");
    setSuccess("");
    setLocationMessage("");

    if (!navigator.geolocation) {
      setLocationMessage(
        "GPS is not supported by this browser. Please type your business address manually.",
      );
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        if (!validCoordinates(latitude, longitude)) {
          setLocationMessage("Your browser returned invalid coordinates.");
          setLocating(false);
          return;
        }

        // Store coordinates privately
        setCoordinates({ latitude, longitude });

        setLocating(false);
        setGeocoding(true);
        setLocationMessage(
          "Location detected. Auto-filling business address...",
        );

        let addressResolved = false;

        try {
          const response = await API.post("/location/reverse", {
            latitude,
            longitude,
            language: preferredLanguage,
          });

          if (response.data && response.data.success) {
            applyDetectedAddress(response.data, { overwriteExisting: true });
            addressResolved = true;
          }
        } catch (backendErr) {
          console.warn(
            "Backend reverse-geocode failed, using direct client lookup",
            backendErr,
          );
        }

        if (!addressResolved) {
          try {
            const directData = await fetchDirectReverseGeocode(
              latitude,
              longitude,
              preferredLanguage,
            );
            applyDetectedAddress(directData, { overwriteExisting: true });
            addressResolved = true;
          } catch (directErr) {
            console.error("Direct geocoding fallback failed:", directErr);
          }
        }

        setGeocoding(false);

        if (addressResolved) {
          setLocationMessage(
            "Address details auto-filled from your location. Review the fields below before submitting.",
          );
        } else {
          setLocationMessage(
            "Location coordinates saved. Please fill in your business address manually.",
          );
        }
      },
      (gpsError) => {
        console.error("GPS error:", gpsError.code, gpsError.message);

        const messages = {
          1: "Location permission denied. Please allow location access or type your address manually.",
          2: "Unable to determine your current location. Check device location services.",
          3: "GPS request timed out. Please try again or type your address manually.",
        };

        setLocationMessage(
          messages[gpsError.code] ||
            "Could not detect your location. Please enter your address manually.",
        );

        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  };

  // 2. Resolve coordinates from typed address behind the scenes
  const handleFindAddressCoordinates = async () => {
    setError("");
    setSuccess("");
    setLocationMessage("");

    if (
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.state.trim()
    ) {
      setLocationMessage(
        "Enter your business address, city, and state before verifying your location.",
      );
      return;
    }

    const query = [
      formData.address,
      formData.city,
      formData.state,
      formData.pincode,
      "India",
    ]
      .map(normalizeText)
      .filter(Boolean)
      .join(", ");

    try {
      setGeocoding(true);
      setLocationMessage("Verifying business address location...");

      let foundCoords = null;
      let fields = null;

      try {
        const response = await API.post("/location/geocode", {
          address: query,
          language: preferredLanguage,
        });

        if (
          response.data?.success &&
          Array.isArray(response.data.location?.coordinates)
        ) {
          foundCoords = response.data.location.coordinates;
          fields = extractAddressFields(response.data);
        }
      } catch (backendErr) {
        console.warn(
          "Backend geocode lookup failed, fallback to direct search",
          backendErr,
        );
      }

      if (!foundCoords) {
        const encoded = encodeURIComponent(query);
        const directRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encoded}&limit=1`,
          { headers: { Accept: "application/json" } },
        );
        const list = await directRes.json();

        if (Array.isArray(list) && list.length > 0) {
          foundCoords = [Number(list[0].lon), Number(list[0].lat)];
          fields = extractAddressFields(list[0]);
        }
      }

      if (!foundCoords || foundCoords.length !== 2) {
        throw new Error(
          "Could not find location coordinates for this address.",
        );
      }

      const longitude = Number(foundCoords[0]);
      const latitude = Number(foundCoords[1]);

      if (!validCoordinates(latitude, longitude)) {
        throw new Error("Geocoding service returned invalid coordinates.");
      }

      setCoordinates({ latitude, longitude });

      if (fields) {
        setFormData((prev) => ({
          ...prev,
          city: prev.city.trim() ? prev.city : fields.city || prev.city,
          state: prev.state.trim() ? prev.state : fields.state || prev.state,
          pincode: prev.pincode.trim()
            ? prev.pincode
            : fields.pincode || prev.pincode,
        }));
      }

      setLocationMessage("Business address location verified successfully.");
    } catch (err) {
      console.error("Address geocoding error:", err.message);
      setCoordinates(null);
      setLocationMessage(
        err.message ||
          "Address lookup failed. Check your address and try again.",
      );
    } finally {
      setGeocoding(false);
    }
  };

  const resolveCoordinatesForSubmit = async () => {
    if (
      coordinates &&
      validCoordinates(coordinates.latitude, coordinates.longitude)
    ) {
      return coordinates;
    }

    const query = [
      formData.address,
      formData.city,
      formData.state,
      formData.pincode,
      "India",
    ]
      .map(normalizeText)
      .filter(Boolean)
      .join(", ");

    try {
      const response = await API.post("/location/geocode", {
        address: query,
        language: preferredLanguage,
      });

      if (
        response.data?.success &&
        Array.isArray(response.data.location?.coordinates)
      ) {
        const [lon, lat] = response.data.location.coordinates;
        if (validCoordinates(Number(lat), Number(lon))) {
          const resolved = { latitude: Number(lat), longitude: Number(lon) };
          setCoordinates(resolved);
          return resolved;
        }
      }
    } catch {
      // Fallback to client geocoder
    }

    const encoded = encodeURIComponent(query);
    const directRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encoded}&limit=1`,
      { headers: { Accept: "application/json" } },
    );
    const list = await directRes.json();

    if (Array.isArray(list) && list.length > 0) {
      const resolved = {
        latitude: Number(list[0].lat),
        longitude: Number(list[0].lon),
      };
      setCoordinates(resolved);
      return resolved;
    }

    throw new Error(
      "Could not detect location for this business address. Please click 'Detect and fill address' or check the typed address.",
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (busy) return;

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.password
    ) {
      setError("Please complete all required personal details.");
      return;
    }

    if (
      !formData.businessName.trim() ||
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.state.trim() ||
      !formData.pincode.trim()
    ) {
      setError("Please complete all required business details.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (!/^\d{6}$/.test(formData.pincode.trim())) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    if (
      formData.experience.trim() !== "" &&
      (!Number.isFinite(Number(formData.experience)) ||
        Number(formData.experience) < 0)
    ) {
      setError("Please enter a valid number of experience years.");
      return;
    }

    try {
      setLoading(true);

      // Resolve coordinates automatically in the background
      const resolvedLocation = await resolveCoordinatesForSubmit();

      const { confirmPassword, ...providerData } = formData;

      const payload = new FormData();

      const fields = {
        ...providerData,
        name: providerData.name.trim(),
        email: providerData.email.trim().toLowerCase(),
        phone: providerData.phone.trim(),
        businessName: providerData.businessName.trim(),
        description: providerData.description.trim(),
        address: providerData.address.trim(),
        city: providerData.city.trim(),
        state: providerData.state.trim(),
        pincode: providerData.pincode.trim(),
        experience: providerData.experience
          ? Number(providerData.experience)
          : 0,
        latitude: resolvedLocation.latitude,
        longitude: resolvedLocation.longitude,
        language: preferredLanguage,
      };

      Object.entries(fields).forEach(([key, value]) => {
        payload.append(key, value ?? "");
      });

      // GeoJSON Point format for MongoDB 2dsphere indexing
      payload.append(
        "location",
        JSON.stringify({
          type: "Point",
          coordinates: [resolvedLocation.longitude, resolvedLocation.latitude],
        }),
      );

      if (profileImageFile) {
        payload.append("profileImage", profileImageFile);
      }

      const response = await API.post("/providers/register", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Provider registration failed.",
        );
      }

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("role", response.data.user.role || "provider");
      }

      if (response.data.provider) {
        localStorage.setItem(
          "provider",
          JSON.stringify(response.data.provider),
        );
      }

      setSuccess(
        "Application submitted successfully! Redirecting to your application status...",
      );

      window.setTimeout(() => {
        navigate("/provider/application-status", { replace: true });
      }, 900);
    } catch (err) {
      console.error(
        "Provider registration error:",
        err.response?.data || err.message,
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordMatches =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  return (
    <main className="min-h-screen overflow-hidden bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-950 via-blue-950 to-blue-700 px-4 pb-16 pt-7 sm:px-6 sm:pb-20 sm:pt-9">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 left-1/4 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-100 sm:text-sm">
                <Sparkles size={15} />
                YOUR BUSINESS, YOUR GROWTH
              </div>

              <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                Turn your skills into
                <span className="block text-cyan-300">new opportunities.</span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-blue-100/85 sm:text-base">
                Join FIXNEAR to connect with nearby customers, showcase your
                expertise, and grow your service business.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white">
                  <ShieldCheck size={18} className="text-cyan-300" />
                  Admin-reviewed applications
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white">
                  <MapPinned size={18} className="text-cyan-300" />
                  Reach nearby customers
                </div>
              </div>
            </div>

            <div className="hidden lg:flex lg:justify-end">
              <div className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-300 to-blue-500 text-slate-950 shadow-lg">
                  <Building2 size={28} />
                </div>

                <h2 className="mt-6 text-2xl font-bold text-white">
                  Welcome to FIXNEAR
                </h2>

                <p className="mt-2 text-sm leading-6 text-blue-100/80">
                  Create your provider profile and take the next step in
                  building your local business.
                </p>

                <div className="mt-7 space-y-4">
                  {[
                    "Complete your business profile",
                    "Submit your application",
                    "Wait for admin review",
                  ].map((step, index) => (
                    <div key={step} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-bold text-cyan-200">
                        {index + 1}
                      </span>
                      <span className="text-sm text-white/90">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration form */}
      <section className="relative px-3 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto -mt-7 max-w-5xl sm:-mt-10">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 sm:rounded-3xl">
            <div className="border-b border-slate-100 px-5 py-6 sm:px-8 sm:py-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Provider onboarding
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Create your provider account
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Fill in your details below. Fields marked with * are required.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-8">
              {error && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <X size={18} className="mt-0.5 shrink-0" />
                  <p className="leading-6">{error}</p>
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                >
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                  <p className="leading-6">{success}</p>
                </div>
              )}

              {/* Personal details */}
              <FormSection
                number="01"
                icon={User}
                title="Personal details"
                subtitle="Your account and contact information."
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Full name *" icon={User}>
                    <input
                      required
                      autoComplete="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Rahul Kumar"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Email address *" icon={Mail}>
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Phone number *" icon={Phone}>
                    <input
                      required
                      type="tel"
                      autoComplete="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Experience (years)" icon={Briefcase}>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      placeholder="e.g. 3"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Password *">
                    <div className="relative">
                      <Lock
                        className="pointer-events-none absolute left-3.5 top-3.5 z-10 text-slate-400"
                        size={17}
                      />

                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        minLength={6}
                        placeholder="At least 6 characters"
                        className={`${inputClass} pl-10 pr-12`}
                      />

                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    <p className="mt-1.5 text-xs text-slate-400">
                      Use at least 6 characters.
                    </p>
                  </Field>

                  <Field label="Confirm password *">
                    <div className="relative">
                      <Lock
                        className="pointer-events-none absolute left-3.5 top-3.5 z-10 text-slate-400"
                        size={17}
                      />

                      <input
                        required
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        minLength={6}
                        placeholder="Enter password again"
                        className={`${inputClass} pl-10 pr-12 ${
                          passwordMatches
                            ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10"
                            : ""
                        }`}
                      />

                      <button
                        type="button"
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {passwordMatches && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <Check size={13} />
                        Passwords match
                      </p>
                    )}
                  </Field>
                </div>
              </FormSection>

              {/* Business details */}
              <FormSection
                number="02"
                icon={Building2}
                title="Business details"
                subtitle="Help customers understand your business."
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Business name *" icon={Building2}>
                      <input
                        required
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        placeholder="Your business or service name"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  {/* Automatic Location Assistant */}
                  <div className="sm:col-span-2">
                    <div className="rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50 via-white to-cyan-50 p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                          <MapPinned size={21} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900">
                            Automatic address detection
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                            Click below to detect your current location and
                            automatically fill your address, city, state, and
                            pincode.
                          </p>

                          <div className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs text-blue-800">
                            <Languages size={14} />
                            Language: {preferredLanguage}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          disabled={busy}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {locating ? (
                            <Loader2 size={17} className="animate-spin" />
                          ) : (
                            <LocateFixed size={17} />
                          )}
                          {locating
                            ? "Detecting location..."
                            : "Detect and fill address"}
                        </button>

                        <button
                          type="button"
                          onClick={handleFindAddressCoordinates}
                          disabled={busy}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {geocoding ? (
                            <Loader2 size={17} className="animate-spin" />
                          ) : (
                            <Search size={17} />
                          )}
                          {geocoding
                            ? "Verifying..."
                            : "Verify entered address"}
                        </button>
                      </div>

                      {locationMessage && (
                        <div
                          role="status"
                          className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-xs leading-5 ${
                            /failed|denied|could not|not found|did not return/i.test(
                              locationMessage,
                            )
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : "border-blue-200 bg-blue-50 text-blue-800"
                          }`}
                        >
                          <Navigation size={16} className="mt-0.5 shrink-0" />
                          <p>{locationMessage}</p>
                        </div>
                      )}

                      {coordinates && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800">
                          <CheckCircle2
                            size={16}
                            className="shrink-0 text-emerald-600"
                          />
                          <span>
                            Location verified. Coordinates will be safely saved
                            with your profile.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Complete business address *" icon={MapPin}>
                      <textarea
                        required
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={3}
                        placeholder="House/building, street, area..."
                        className={`${inputClass} resize-y`}
                      />
                    </Field>
                  </div>

                  <Field label="City *" icon={MapPin}>
                    <input
                      required
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Your city"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="State *" icon={MapPin}>
                    <input
                      required
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Your state"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Pincode *" icon={MapPin}>
                    <input
                      required
                      name="pincode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="6-digit pincode"
                      className={inputClass}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Business description" icon={FileText}>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        maxLength={1000}
                        placeholder="Describe your services, skills, and what makes your business special..."
                        className={`${inputClass} resize-y`}
                      />
                      <p className="mt-1.5 text-right text-xs text-slate-400">
                        {formData.description.length}/1000
                      </p>
                    </Field>
                  </div>
                </div>
              </FormSection>

              {/* Profile image */}
              <FormSection
                number="03"
                icon={Upload}
                title="Profile image"
                subtitle="Add a photo or logo to help customers recognize your business."
                last
              >
                <div className="flex flex-col gap-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-400">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Selected profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 size={32} strokeWidth={1.5} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-800">
                      {profileImageFile
                        ? profileImageFile.name
                        : "Upload your profile photo"}
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      JPG, PNG or WEBP. Maximum file size: 5MB. This is
                      optional.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <label
                        htmlFor="profileImage"
                        className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Upload size={16} />
                        Choose image
                      </label>

                      {profileImageFile && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <X size={16} />
                          Remove
                        </button>
                      )}

                      <input
                        id="profileImage"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleProfileImageChange}
                        className="sr-only"
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* Submit */}
              <div className="mt-8 border-t border-slate-100 pt-6 sm:mt-10 sm:pt-8">
                <button
                  type="submit"
                  disabled={busy}
                  className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-blue-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 size={19} className="animate-spin" />
                      Submitting application...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={19} />
                      Submit provider application
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-start justify-center gap-2 text-center text-xs leading-5 text-slate-500">
                  <ShieldCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                  <p>
                    Your application will be reviewed by the FIXNEAR admin team
                    before you can provide services.
                  </p>
                </div>
              </div>
            </form>
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-slate-500">
              Already have a provider account?{" "}
              <button
                type="button"
                onClick={() => navigate("/provider/login")}
                className="font-bold text-blue-600 transition hover:text-blue-800"
              >
                Sign in
              </button>
            </p>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock3 size={14} />
              Applications require admin approval
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ProviderRegister;
