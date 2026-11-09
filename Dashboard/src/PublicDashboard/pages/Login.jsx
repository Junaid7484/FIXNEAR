import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Clock,
  Headphones,
} from "lucide-react";
import API from "../../services/api";

const Login = () => {
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

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Invalid login response from server.");
      }

      // Clear old login data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      // Save current user's data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role);

      // Role-based redirect
      if (user.role === "customer") {
        navigate("/customer/dashboard", { replace: true });
        return;
      }

      if (user.role === "provider") {
        navigate("/provider/dashboard", { replace: true });
        return;
      }

      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      // Unknown role
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      setError("Your account has an invalid user role.");
    } catch (error) {
      console.error("Login Error:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Login failed. Please check your email and password.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const iconClass =
    "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400";

  const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 px-3 py-3 sm:px-5 sm:py-4 lg:h-screen lg:min-h-0 lg:overflow-hidden lg:p-4">
      {/* Main login layout */}
      <section className="mx-auto grid w-full max-w-375 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg lg:h-[calc(100dvh-76px)] lg:min-h-0 lg:grid-cols-[0.82fr_1.18fr]">
        {/* Left information panel */}
        <aside className="relative hidden overflow-hidden bg-linear-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white lg:flex lg:flex-col lg:justify-between xl:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/15 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
              <Zap className="h-3.5 w-3.5" />
              Your neighbourhood, simplified
            </span>

            <h1 className="mt-6 max-w-md text-3xl font-bold leading-tight xl:text-4xl">
              Welcome back,
              <br />
              we're here
              <br />
              to help.
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-relaxed text-blue-100/80">
              Sign in to your FixNear account to manage your services, bookings,
              and account details.
            </p>

            <div className="mt-6 space-y-3">
              {[
                {
                  icon: CheckCircle2,
                  title: "Trusted professionals",
                  description: "Connect with local service experts.",
                },
                {
                  icon: Clock,
                  title: "Easy booking management",
                  description: "Keep track of your service requests.",
                },
                {
                  icon: Headphones,
                  title: "Help when you need it",
                  description: "Your service information in one place.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10">
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

          <div className="relative mt-5 flex items-center gap-2 border-t border-white/15 pt-4 text-xs text-blue-100/75">
            <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-300" />
            Sign in securely to access your account.
          </div>
        </aside>

        {/* Right login form */}
        <div className="flex min-w-0 items-center justify-center p-4 sm:p-6 lg:min-h-0 lg:overflow-y-auto lg:px-8 lg:py-5 xl:px-12">
          <div className="mx-auto w-full max-w-md">
            {/* Heading */}
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Welcome to FIXNEAR
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Login to your FIXNEAR account.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
              >
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email address
                </label>

                <div className="relative">
                  <Mail className={iconClass} />

                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>

                <div className="relative">
                  <Lock className={iconClass} />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login to your account"}

                {!loading && (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                )}
              </button>
            </form>

            {/* Register link */}
            <div className="mt-5 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Create account
              </Link>
            </div>

            {/* Security note */}
            <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              Secure access to your FIXNEAR account
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
