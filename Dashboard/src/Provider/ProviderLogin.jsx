import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Building2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import API from "../services/api";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const ProviderLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/providers/login", {
        email,
        password,
      });

      const token = response.data?.token;
      const user = response.data?.user;
      const provider = response.data?.provider;

      if (!token || !user) {
        throw new Error("Login response is missing account information.");
      }

      const providerUser = { ...user, role: "provider" };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(providerUser));
      localStorage.setItem("role", "provider");

      if (provider) {
        localStorage.setItem("provider", JSON.stringify(provider));
      } else {
        localStorage.removeItem("provider");
      }

      if (provider?.isVerified === true) {
        navigate("/provider/dashboard", { replace: true });
      } else {
        navigate("/provider/application-status", { replace: true });
      }
    } catch (err) {
      console.error("Provider Login Error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Provider login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-screen lg:grid-cols-[1fr_1fr]">
        {/* LEFT: WELCOME PANEL */}
        <section className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 px-5 py-6 text-white sm:px-8 lg:px-10 xl:px-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative mx-auto w-full max-w-lg">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20 sm:mb-8 sm:text-sm"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="mb-5 flex items-center gap-3 sm:mb-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-cyan-200">
                <Building2 size={26} />
              </div>
              <div>
                <p className="text-lg font-extrabold tracking-wide">FIXNEAR</p>
                <p className="text-xs text-blue-200">
                  Local services. Trusted professionals.
                </p>
              </div>
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
              <Sparkles size={14} />
              PROVIDER PORTAL
            </div>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl xl:text-5xl">
              Your business.
              <span className="block text-cyan-300">
                Your next opportunity.
              </span>
            </h1>

            <p className="mt-4 max-w-md text-sm leading-6 text-blue-100/85 sm:text-base sm:leading-7">
              Sign in to manage your services, handle bookings, and grow your
              business with FIXNEAR.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-3">
                <CheckCircle2 size={19} className="shrink-0 text-cyan-300" />
                <span className="text-xs font-medium text-blue-50 sm:text-sm">
                  Manage your bookings
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-3">
                <ShieldCheck size={19} className="shrink-0 text-cyan-300" />
                <span className="text-xs font-medium text-blue-50 sm:text-sm">
                  Verified provider access
                </span>
              </div>
            </div>

            <p className="mt-6 hidden text-xs text-blue-200/70 lg:block">
              © {new Date().getFullYear()} FIXNEAR. All rights reserved.
            </p>
          </div>
        </section>

        {/* RIGHT: LOGIN FORM */}
        <section className="flex items-center justify-center px-4 py-6 sm:px-8 sm:py-8 lg:min-h-0 lg:overflow-y-auto lg:px-10 lg:py-5 xl:px-16">
          <div className="w-full max-w-md">
            <div className="mb-5 text-center lg:mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <Lock size={23} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Welcome back
              </p>
              <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Sign in to FIXNEAR
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Access your provider account.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/5 sm:rounded-3xl sm:p-7">
              {error && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="leading-5">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 sm:text-sm"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      disabled={loading}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Signing you in...
                    </>
                  ) : (
                    <>
                      Sign in to your account
                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
                <p className="text-xs leading-5 text-slate-600">
                  Keep your password private. Admin approval is required before
                  providers can accept bookings.
                </p>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5 text-center">
                <p className="text-sm text-slate-500">New to FIXNEAR?</p>
                <Link
                  to="/provider/register"
                  className="mt-2.5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                >
                  <Building2 size={17} />
                  Create a provider account
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <p className="mt-4 text-center text-xs leading-5 text-slate-400 lg:hidden">
              © {new Date().getFullYear()} FIXNEAR. All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProviderLogin;
