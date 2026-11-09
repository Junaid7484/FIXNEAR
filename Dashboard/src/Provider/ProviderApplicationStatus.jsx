import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import API from "../services/api";

const ProviderApplicationStatus = () => {
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOGOUT / CLEAR AUTH
  // ==========================================
  const clearAuthentication = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("providerToken");
    localStorage.removeItem("provider");
  };

  // ==========================================
  // FETCH PROVIDER PROFILE
  // ==========================================
  const fetchProviderProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        clearAuthentication();
        navigate("/login", { replace: true });
        return;
      }

      const response = await API.get("/providers/my/profile");

      console.log("Provider Profile Response:", response.data);

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to load provider profile.");
      }

      const providerData = data.provider || data.data || null;

      if (!providerData) {
        setError("Provider profile was not returned by the server.");
        return;
      }

      setProvider(providerData);

      // Keep provider data synchronized
      localStorage.setItem("provider", JSON.stringify(providerData));

      // Make sure role remains available to frontend
      localStorage.setItem("role", "provider");

      // Update user object if available
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...user,
              role: "provider",
            }),
          );
        } catch (storageError) {
          console.error("User storage parse error:", storageError);
        }
      }
    } catch (error) {
      console.error("Provider Profile Error:", error);

      const status = error.response?.status;
      const backendMessage = error.response?.data?.message;

      // ==========================================
      // TOKEN INVALID / EXPIRED
      // ==========================================
      if (status === 401) {
        clearAuthentication();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      // ==========================================
      // ROLE / PERMISSION ERROR
      // ==========================================
      if (status === 403) {
        setError(
          backendMessage ||
            "Your account is not recognized as a provider. Please login again after provider registration.",
        );

        return;
      }

      // ==========================================
      // PROVIDER PROFILE NOT FOUND
      // ==========================================
      if (status === 404) {
        setError(
          backendMessage ||
            "Provider profile not found. Please contact support.",
        );

        return;
      }

      // ==========================================
      // OTHER ERROR
      // ==========================================
      setError(
        backendMessage ||
          error.message ||
          "Failed to load your provider application.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH ON PAGE LOAD
  // ==========================================
  useEffect(() => {
    fetchProviderProfile();
  }, []);

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 flex items-center justify-center">
            <RefreshCw size={28} className="text-blue-600 animate-spin" />
          </div>

          <h2 className="mt-5 text-lg font-bold text-slate-900">
            Loading Application
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Please wait while we fetch your provider profile.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 flex items-center justify-center">
            <XCircle size={30} className="text-red-600" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Unable to Load Application
          </h1>

          <p className="mt-2 text-sm text-slate-500">{error}</p>

          <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
            <button
              onClick={fetchProviderProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              <RefreshCw size={17} />
              Try Again
            </button>

            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft size={17} />
              Home
            </button>

            <button
              onClick={() => {
                clearAuthentication();
                navigate("/login", {
                  replace: true,
                });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
            >
              Login Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // NO PROVIDER
  // ==========================================
  if (!provider) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
            <Building2 size={28} className="text-slate-500" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Provider Profile Not Found
          </h1>

          <p className="mt-2 text-slate-500">
            We could not find your provider application.
          </p>

          <button
            onClick={fetchProviderProfile}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 transition"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // APPLICATION STATUS
  // ==========================================
  const isVerified = provider.isVerified === true;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* ======================================
            HEADER
        ====================================== */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
              <ShieldCheck size={25} className="text-white" />
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-600">FIXNEAR</p>

              <h1 className="text-3xl font-bold text-slate-900">
                Provider Application
              </h1>
            </div>
          </div>

          <p className="mt-3 text-slate-500">
            Track the verification status of your provider application.
          </p>
        </div>

        {/* ======================================
            STATUS CARD
        ====================================== */}
        <div
          className={`rounded-3xl border shadow-sm p-7 mb-6 ${
            isVerified
              ? "bg-green-50 border-green-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  isVerified ? "bg-green-100" : "bg-amber-100"
                }`}
              >
                {isVerified ? (
                  <CheckCircle2 size={30} className="text-green-600" />
                ) : (
                  <Clock3 size={30} className="text-amber-600" />
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Application Status
                </p>

                <h2
                  className={`text-2xl font-bold ${
                    isVerified ? "text-green-700" : "text-amber-700"
                  }`}
                >
                  {isVerified ? "Application Approved" : "Pending Verification"}
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  {isVerified
                    ? "Your provider account has been verified. You can now provide services on FIXNEAR."
                    : "Your application has been submitted and is waiting for admin verification."}
                </p>
              </div>
            </div>

            <div
              className={`self-start md:self-center rounded-full px-4 py-2 text-sm font-bold ${
                isVerified
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isVerified ? "VERIFIED" : "PENDING"}
            </div>
          </div>
        </div>

        {/* ======================================
            PROVIDER DETAILS
        ====================================== */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-7 py-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              Provider Details
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Information submitted with your provider application.
            </p>
          </div>

          <div className="p-7">
            {/* BUSINESS */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Building2 size={21} className="text-blue-600" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Business Name
                </p>

                <p className="mt-1 text-base font-semibold text-slate-900">
                  {provider.businessName || "Not available"}
                </p>
              </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PHONE */}
              <div className="flex items-start gap-3">
                <Phone size={19} className="text-slate-400 mt-1" />

                <div>
                  <p className="text-xs text-slate-400">Phone</p>

                  <p className="mt-1 font-medium text-slate-800">
                    {provider.phone || "Not available"}
                  </p>
                </div>
              </div>

              {/* EMAIL */}
              <div className="flex items-start gap-3">
                <Mail size={19} className="text-slate-400 mt-1" />

                <div>
                  <p className="text-xs text-slate-400">Email</p>

                  <p className="mt-1 font-medium text-slate-800">
                    {provider.user?.email || "Not available"}
                  </p>
                </div>
              </div>

              {/* ADDRESS */}
              <div className="flex items-start gap-3">
                <MapPin size={19} className="text-slate-400 mt-1" />

                <div>
                  <p className="text-xs text-slate-400">Address</p>

                  <p className="mt-1 font-medium text-slate-800">
                    {provider.address || "Not available"}
                  </p>
                </div>
              </div>

              {/* CITY */}
              <div className="flex items-start gap-3">
                <MapPin size={19} className="text-slate-400 mt-1" />

                <div>
                  <p className="text-xs text-slate-400">City</p>

                  <p className="mt-1 font-medium text-slate-800">
                    {provider.city || "Not available"}
                  </p>
                </div>
              </div>

              {/* STATE */}
              <div className="flex items-start gap-3">
                <MapPin size={19} className="text-slate-400 mt-1" />

                <div>
                  <p className="text-xs text-slate-400">State</p>

                  <p className="mt-1 font-medium text-slate-800">
                    {provider.state || "Not available"}
                  </p>
                </div>
              </div>

              {/* PINCODE */}
              <div className="flex items-start gap-3">
                <MapPin size={19} className="text-slate-400 mt-1" />

                <div>
                  <p className="text-xs text-slate-400">Pincode</p>

                  <p className="mt-1 font-medium text-slate-800">
                    {provider.pincode || "Not available"}
                  </p>
                </div>
              </div>

              {/* EXPERIENCE */}
              <div className="flex items-start gap-3">
                <Briefcase size={19} className="text-slate-400 mt-1" />

                <div>
                  <p className="text-xs text-slate-400">Experience</p>

                  <p className="mt-1 font-medium text-slate-800">
                    {provider.experience ?? 0} years
                  </p>
                </div>
              </div>

              {/* AVAILABILITY */}
              <div className="flex items-start gap-3">
                <CheckCircle2 size={19} className="text-slate-400 mt-1" />

                <div>
                  <p className="text-xs text-slate-400">Availability</p>

                  <p className="mt-1 font-medium text-slate-800">
                    {provider.isAvailable
                      ? "Available"
                      : "Currently unavailable"}
                  </p>
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            {provider.description && (
              <div className="mt-7 pt-6 border-t border-slate-200">
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  Description
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {provider.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ======================================
            ACTIONS
        ====================================== */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={fetchProviderProfile}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw size={18} />
            Refresh Status
          </button>

          {isVerified && (
            <button
              onClick={() => navigate("/provider/dashboard")}
              className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 transition"
            >
              Go to Provider Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderApplicationStatus;
