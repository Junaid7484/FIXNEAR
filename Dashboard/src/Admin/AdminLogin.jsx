import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

import API from "../services/api";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ========================================
  // INPUT CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ========================================
  // LOGIN
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const email = formData.email.trim();
    const password = formData.password;

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/login", {
        email,
        password,
      });

      const data = response.data;

      // ======================================
      // CHECK API RESPONSE
      // ======================================

      if (!data?.success || !data?.token || !data?.user) {
        setError(data?.message || "Login failed. Please try again.");
        return;
      }

      // ======================================
      // IMPORTANT:
      // ONLY ADMIN CAN ENTER ADMIN DASHBOARD
      // ======================================

      if (data.user.role !== "admin") {
        setError("This account does not have administrator access.");
        return;
      }

      // ======================================
      // SAVE REAL JWT
      // ======================================

      localStorage.setItem("token", data.token);

      localStorage.setItem("user", JSON.stringify(data.user));

      localStorage.setItem("role", "admin");

      // Keep these if your existing admin
      // pages use them.

      localStorage.setItem("adminToken", data.token);

      localStorage.setItem("admin", JSON.stringify(data.user));

      // ======================================
      // GO TO ADMIN DASHBOARD
      // ======================================

      navigate("/admin/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error("Admin Login Error:", err);

      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 401) {
        setError(message || "Invalid email or password.");
      } else if (status === 403) {
        setError(message || "Your account does not have admin access.");
      } else {
        setError(
          message ||
            "Unable to connect to the server. Please make sure the backend is running.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background decoration */}

      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />

      {/* Login Card */}

      <div className="relative w-full max-w-md">
        {/* Logo / Badge */}

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/20">
            <ShieldCheck size={32} className="text-white" />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}

          <div className="px-7 pt-8 pb-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-4">
              <CheckCircle size={14} />
              FIXNEAR ADMIN
            </div>

            <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>

            <p className="text-sm text-slate-500 mt-2">
              Sign in to manage the FIXNEAR platform
            </p>
          </div>

          {/* Form */}

          <form onSubmit={handleSubmit} className="px-7 pb-8 space-y-5">
            {/* Error */}

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                <AlertCircle size={19} className="shrink-0 mt-0.5" />

                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Email */}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
                />
              </div>
            </div>

            {/* Password */}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Login Button */}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-lg shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={19} />
                </>
              )}
            </button>

            {/* Security message */}

            <div className="pt-2">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck size={14} />

                <span>Secure administrator authentication</span>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}

        <p className="text-center text-xs text-slate-500 mt-6">
          FIXNEAR Administration Panel
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
