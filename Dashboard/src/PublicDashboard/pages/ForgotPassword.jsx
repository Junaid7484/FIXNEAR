import { useState } from "react";

import {
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import API from "../../services/api";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim();

    // Validation

    if (!cleanEmail) {
      setError("Email address is required.");

      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");

      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/forgot-password", {
        email: cleanEmail,
      });

      setSuccess(
        response.data?.message ||
          "If an account exists with this email, password reset instructions will be sent.",
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to process your request right now. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* =================================================
                        LEFT INFORMATION
                    ================================================= */}

          <div className="hidden lg:flex bg-slate-950 p-12 flex-col justify-between">
            <div>
              {/* LOGO */}

              <Link to="/" className="inline-flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                  F
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white">FIXNEAR</h2>

                  <p className="text-xs text-slate-500">Local Services</p>
                </div>
              </Link>

              <div className="mt-16">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center">
                  <KeyRound size={32} />
                </div>

                <h1 className="text-4xl font-black text-white leading-tight mt-7">
                  Forgot your
                  <span className="text-blue-500"> password?</span>
                </h1>

                <p className="text-slate-400 leading-7 mt-5">
                  Don't worry. Enter the email address associated with your
                  account and we'll help you get back into your account.
                </p>
              </div>
            </div>

            {/* SECURITY */}

            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="text-blue-500 mt-0.5" />

              <p className="text-sm text-slate-500 leading-6">
                We take your account security seriously. Your password reset
                process is protected.
              </p>
            </div>
          </div>

          {/* =================================================
                        FORM
                    ================================================= */}

          <div className="p-6 sm:p-10 lg:p-12">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition"
            >
              <ArrowLeft size={17} />
              Back to Login
            </Link>

            {/* HEADER */}

            <div className="mt-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <KeyRound size={27} />
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mt-6">
                Reset your password
              </h2>

              <p className="text-slate-500 leading-7 mt-3">
                Enter your registered email address and we'll send you
                instructions to reset your password.
              </p>
            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-7 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="mt-7 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle size={19} className="shrink-0 mt-0.5" />

                  <div>
                    <p className="font-semibold">Check your email</p>

                    <p className="mt-1 leading-6">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* FORM */}

            <form onSubmit={handleSubmit} className="mt-8">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);

                    setError("");
                  }}
                  placeholder="you@example.com"
                  className={`
                                        w-full
                                        pl-11
                                        pr-4
                                        py-3.5
                                        rounded-xl
                                        border
                                        ${
                                          error
                                            ? "border-red-400"
                                            : "border-slate-200"
                                        }
                                        outline-none
                                        focus:border-blue-500
                                        focus:ring-4
                                        focus:ring-blue-500/10
                                        transition
                                    `}
                />
              </div>

              {/* BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-semibold transition"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Instructions
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* REGISTER */}

            <div className="text-center mt-8">
              <p className="text-sm text-slate-500">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 font-semibold hover:text-blue-700"
                >
                  Create Account
                </Link>
              </p>
            </div>

            {/* LOGIN LINK */}

            <div className="text-center mt-5">
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition"
              >
                <ArrowLeft size={16} />
                Return to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
