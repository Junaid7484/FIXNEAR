import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  IndianRupee,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Wrench,
  ShieldCheck,
  Star,
  CreditCard,
  Banknote,
  Wallet,
} from "lucide-react";
import API from "../services/api";

// =====================================================
// RAZORPAY SCRIPT
// =====================================================

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const src = "https://checkout.razorpay.com/v1/checkout.js";
    const existing = document.querySelector(`script[src="${src}"]`);

    if (existing) {
      existing.addEventListener("load", () => resolve(true), {
        once: true,
      });
      existing.addEventListener("error", () => resolve(false), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

// =====================================================
// RESPONSE HELPERS
// =====================================================

const getResponseItem = (response, key) =>
  response?.data?.[key] ||
  response?.data?.data?.[key] ||
  response?.data?.data ||
  response?.data;

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getId = (value) =>
  value && typeof value === "object" ? value._id : value;

// Convert backend booking date to local input date/time.
const getLocalDateTime = (value) => {
  if (!value) return { date: "", time: "" };

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return { date: "", time: "" };
  }

  const date = [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0"),
  ].join("-");

  const time = [
    String(parsed.getHours()).padStart(2, "0"),
    String(parsed.getMinutes()).padStart(2, "0"),
  ].join(":");

  return { date, time };
};

// =====================================================
// BOOKING COMPONENT
// =====================================================

function Booking() {
  const {
    providerId: routeProviderId,
    serviceId: routeServiceId,
    providerServiceId: routeProviderServiceId,
  } = useParams();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const serviceId = routeServiceId || searchParams.get("service");
  const providerId = routeProviderId || searchParams.get("provider");

  const providerServiceId =
    routeProviderServiceId || searchParams.get("providerService");

  // -----------------------------------------------------
  // MAIN DATA
  // -----------------------------------------------------

  const [service, setService] = useState(null);
  const [provider, setProvider] = useState(null);
  const [providerService, setProviderService] = useState(null);

  // -----------------------------------------------------
  // BOOKING FORM
  // -----------------------------------------------------

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [notes, setNotes] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Stores the unpaid booking ID and the exact form data.
  // This allows payment retry without creating another booking.
  const [pendingOnlinePayment, setPendingOnlinePayment] = useState(null);

  // -----------------------------------------------------
  // LOADING AND MESSAGES
  // -----------------------------------------------------

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // -----------------------------------------------------
  // DATE HELPERS
  // -----------------------------------------------------

  const today = useMemo(() => {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const currentLocalTime = () => {
    const now = new Date();

    return `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;
  };

  // -----------------------------------------------------
  // LOAD SERVICE, PROVIDER AND PROVIDER SERVICE
  // -----------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        if (!serviceId || !providerId) {
          throw new Error("Service or provider information is missing.");
        }

        const [serviceRes, providerRes, providerServicesRes] =
          await Promise.all([
            API.get(`/services/${serviceId}`),
            API.get(`/providers/${providerId}`),
            API.get(`/providers/services/provider/${providerId}`),
          ]);

        const receivedService = getResponseItem(serviceRes, "service");

        const receivedProvider = getResponseItem(providerRes, "provider");

        const providerServices =
          providerServicesRes?.data?.services ||
          providerServicesRes?.data?.data?.services ||
          providerServicesRes?.data?.data ||
          [];

        if (!receivedService) {
          throw new Error("Selected service could not be found.");
        }

        if (!receivedProvider) {
          throw new Error("Selected provider could not be found.");
        }

        const selectedProviderService =
          (providerServiceId &&
            providerServices.find(
              (item) => String(item?._id) === String(providerServiceId),
            )) ||
          providerServices.find((item) => {
            const id = item?.service?._id || item?.service;
            return String(id) === String(serviceId);
          });

        if (!selectedProviderService) {
          throw new Error(
            "Provider service not found. Please select the service again.",
          );
        }

        if (!mounted) return;

        setService(receivedService);
        setProvider(receivedProvider);
        setProviderService(selectedProviderService);

        // Prefill customer address from stored profile.
        const user = getStoredUser();

        let profileAddress = user?.address || "";
        let profileCity = user?.city || "";
        let profileState = user?.state || "";

        if (!profileAddress && !profileCity && !profileState) {
          try {
            const profileRes = await API.get("/users/profile");

            const profile = getResponseItem(profileRes, "user");

            profileAddress = profile?.address || "";
            profileCity = profile?.city || "";
            profileState = profile?.state || "";
          } catch {
            // Profile prefill is optional.
          }
        }

        if (mounted) {
          setAddress(profileAddress);
          setCity(profileCity);
          setState(profileState);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load booking information.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [serviceId, providerId, providerServiceId]);

  // -----------------------------------------------------
  // RECOVER PENDING ONLINE PAYMENT AFTER REFRESH
  // -----------------------------------------------------

  useEffect(() => {
    if (loading || !serviceId || !providerId || !providerService?._id) {
      return;
    }

    let cancelled = false;

    const recoverPendingPayment = async () => {
      try {
        const response = await API.get("/bookings/pending-payment", {
          params: {
            providerId,
            serviceId,
            providerServiceId: providerService._id,
          },
        });

        const booking =
          response?.data?.pendingBooking ||
          response?.data?.data?.pendingBooking ||
          null;

        if (!booking || cancelled) return;

        const { date: recoveredDate, time: recoveredTime } = getLocalDateTime(
          booking.bookingDate,
        );

        if (!recoveredDate || !recoveredTime) {
          console.error("Recovered booking has an invalid date.");
          return;
        }

        const recoveredBookingData = {
          provider: String(getId(booking.provider)),
          service: String(getId(booking.service)),
          providerService: String(getId(booking.providerService)),
          bookingDate: `${recoveredDate}T${recoveredTime}:00`,
          address: booking.address || "",
          city: booking.city || "",
          state: booking.state || "",
          notes: booking.notes || "",
          paymentMethod: "online",
        };

        // Restore the customer's form.
        setDate(recoveredDate);
        setTime(recoveredTime);
        setAddress(booking.address || "");
        setCity(booking.city || "");
        setState(booking.state || "");
        setNotes(booking.notes || "");
        setPaymentMethod("online");

        // Keep the same structure used by handleSubmit.
        setPendingOnlinePayment({
          bookingId: booking._id,
          bookingData: recoveredBookingData,
        });

        setSuccess(
          "Your previous unpaid booking was recovered. You can retry online payment.",
        );

        setError("");
      } catch (err) {
        if (!cancelled) {
          console.error(
            "Pending payment recovery error:",
            err?.response?.data || err.message,
          );
        }
      }
    };

    recoverPendingPayment();

    return () => {
      cancelled = true;
    };
  }, [loading, serviceId, providerId, providerService?._id]);

  // -----------------------------------------------------
  // SELECTED DAY AND PROVIDER SCHEDULE
  // -----------------------------------------------------

  const selectedDayName = useMemo(() => {
    if (!date) return "";

    const [year, month, day] = date.split("-").map(Number);

    const selectedDate = new Date(year, month - 1, day);

    return [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][selectedDate.getDay()];
  }, [date]);

  const schedule = useMemo(() => {
    const hours = provider?.workingHours;

    if (!hours || !selectedDayName) return null;

    return (
      hours[selectedDayName] || hours[selectedDayName.toLowerCase()] || null
    );
  }, [provider, selectedDayName]);

  // -----------------------------------------------------
  // DISPLAY DATA
  // -----------------------------------------------------

  const serviceName =
    service?.name ||
    service?.title ||
    providerService?.service?.name ||
    providerService?.service?.title ||
    "Selected service";

  const providerName =
    provider?.businessName ||
    provider?.name ||
    provider?.user?.name ||
    "Selected provider";

  const servicePrice = Number(providerService?.price ?? 0);

  const providerLocation = [provider?.city, provider?.state]
    .filter(Boolean)
    .join(", ");

  // -----------------------------------------------------
  // RAZORPAY CHECKOUT AND SERVER-SIDE VERIFICATION
  // -----------------------------------------------------

  const payOnline = async (booking) => {
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded || !window.Razorpay) {
      throw new Error(
        "Razorpay could not load. Check your internet connection and try again.",
      );
    }

    // Backend creates or returns the Razorpay order.
    const orderRes = await API.post(`/bookings/${booking._id}/payment/order`);

    const orderData = orderRes?.data?.data || orderRes?.data;

    const order = orderData?.order;

    const keyId = orderData?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!order?.id || !order?.amount || !keyId) {
      throw new Error(
        "Razorpay order details are missing. Check your backend Razorpay configuration.",
      );
    }

    const user = getStoredUser();

    return new Promise((resolve, reject) => {
      let finished = false;

      const settle = (callback, value) => {
        if (finished) return;

        finished = true;
        callback(value);
      };

      try {
        const checkout = new window.Razorpay({
          key: keyId,
          amount: order.amount,
          currency: order.currency || "INR",
          name: "FIXNEAR",
          description: `Payment for ${serviceName}`,
          order_id: order.id,

          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: user?.phone || user?.mobile || "",
          },

          notes: {
            bookingId: booking._id,
          },

          theme: {
            color: "#2563eb",
          },

          handler: async (result) => {
            try {
              // Server verifies the Razorpay signature and payment.
              const verifyRes = await API.post(
                `/bookings/${booking._id}/payment/verify`,
                {
                  razorpay_order_id: result.razorpay_order_id,
                  razorpay_payment_id: result.razorpay_payment_id,
                  razorpay_signature: result.razorpay_signature,
                },
              );

              const verifyData = verifyRes?.data?.data || verifyRes?.data;

              if (verifyData?.success !== true) {
                throw new Error(
                  verifyData?.message || "Payment verification failed.",
                );
              }

              settle(resolve, {
                paid: true,
                bookingId: booking._id,
              });
            } catch (err) {
              settle(
                reject,
                new Error(
                  err?.response?.data?.message ||
                    err?.message ||
                    "Payment could not be verified. Please check your booking before retrying.",
                ),
              );
            }
          },

          modal: {
            ondismiss: () => {
              settle(resolve, {
                paid: false,
                cancelled: true,
                bookingId: booking._id,
              });
            },
          },
        });

        checkout.on("payment.failed", (response) => {
          settle(
            reject,
            new Error(
              response?.error?.description ||
                "Payment failed. Your service has not been confirmed.",
            ),
          );
        });

        checkout.open();
      } catch (err) {
        settle(reject, err);
      }
    });
  };

  // -----------------------------------------------------
  // SUBMIT BOOKING
  // -----------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (bookingLoading) return;

    try {
      setBookingLoading(true);
      setError("");
      setSuccess("");

      if (!serviceId || !providerId || !providerService?._id) {
        throw new Error("Please select a valid service and provider.");
      }

      if (!date || !time || !address.trim() || !city.trim() || !state.trim()) {
        throw new Error("Complete all required booking fields.");
      }

      const bookingDate = new Date(`${date}T${time}:00`);

      // Require the appointment to be at least one minute ahead.
      if (
        Number.isNaN(bookingDate.getTime()) ||
        bookingDate.getTime() <= Date.now() + 60000
      ) {
        throw new Error(
          "Please select a valid future date and time at least one minute ahead.",
        );
      }

      if (!Number.isFinite(servicePrice) || servicePrice <= 0) {
        throw new Error("The service price is invalid.");
      }

      const bookingData = {
        provider: providerId,
        service: serviceId,
        providerService: providerService._id,
        bookingDate: `${date}T${time}:00`,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        notes: notes.trim(),
        paymentMethod,
      };

      // Reuse the existing booking only when all details match.
      const canReuse =
        paymentMethod === "online" &&
        pendingOnlinePayment?.bookingId &&
        JSON.stringify(pendingOnlinePayment.bookingData) ===
          JSON.stringify(bookingData);

      let booking;

      if (canReuse) {
        booking = {
          _id: pendingOnlinePayment.bookingId,
        };
      } else {
        // Create a new booking only if there is no matching
        // pending online booking to reuse.
        const bookingRes = await API.post("/bookings", bookingData);

        booking =
          bookingRes?.data?.booking ||
          bookingRes?.data?.data?.booking ||
          bookingRes?.data?.data;

        if (!booking?._id) {
          throw new Error("The server did not return a valid booking ID.");
        }
      }

      // CASH PAYMENT
      if (paymentMethod === "cash") {
        setPendingOnlinePayment(null);

        navigate(`/booking-details/${booking._id}`, {
          state: {
            paymentMethod: "cash",
          },
        });

        return;
      }

      // ONLINE PAYMENT
      // Save the booking ID and exact form data for retry.
      setPendingOnlinePayment({
        bookingId: booking._id,
        bookingData,
      });

      setSuccess("Opening secure payment checkout...");

      const result = await payOnline(booking);

      if (result?.cancelled) {
        setSuccess("");

        setError(
          "Payment was cancelled. Your service is NOT confirmed. You can retry payment using the same booking details.",
        );

        return;
      }

      if (!result?.paid) {
        throw new Error(
          "Payment was not verified. Your service is not confirmed.",
        );
      }

      // Clear pending state after verified payment.
      setPendingOnlinePayment(null);

      navigate(`/booking-details/${booking._id}`, {
        replace: true,
        state: {
          paymentMethod: "online",
          paymentStatus: "paid",
        },
      });
    } catch (err) {
      console.error("BOOKING/PAYMENT ERROR:", err);

      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to complete booking. Please try again.",
      );

      setSuccess("");
    } finally {
      setBookingLoading(false);
    }
  };

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-blue-600" size={42} />

          <p className="mt-3 text-sm text-slate-500">
            Loading booking details...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR SCREEN
  // =====================================================

  if (!service || !provider || !providerService) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <div className="max-w-md rounded-2xl border bg-white p-7 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={36} />

          <h2 className="mt-4 text-xl font-bold">Unable to load booking</h2>

          <p className="mt-2 text-sm text-slate-500">
            {error || "Please select a service and provider again."}
          </p>

          <Link
            to="/services"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-white"
          >
            <ArrowLeft size={17} />
            Back to services
          </Link>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}

      <header className="bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-sm text-blue-100 hover:text-white"
          >
            <ArrowLeft size={18} />
            Back to services
          </Link>

          <p className="mt-5 text-sm font-semibold text-blue-200">
            FIXNEAR BOOKING
          </p>

          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            Book your service
          </h1>

          <p className="mt-2 text-sm text-blue-100 sm:text-base">
            Schedule a professional and choose your payment method.
          </p>
        </div>
      </header>

      {/* MAIN CONTENT */}

      <main className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 px-4 py-7 sm:px-6 lg:grid-cols-3 lg:px-8">
        {/* BOOKING FORM */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:col-span-2"
        >
          <h2 className="text-2xl font-bold text-slate-900">
            Booking information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter your appointment and service location.
          </p>

          {/* ERROR MESSAGE */}

          {error && (
            <div
              role="alert"
              className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle className="shrink-0" size={20} />

              <p>{error}</p>
            </div>
          )}

          {/* SUCCESS MESSAGE */}

          {success && (
            <div
              role="status"
              className="mt-5 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
            >
              <CheckCircle className="shrink-0" size={20} />

              <p>{success}</p>
            </div>
          )}

          {/* DATE AND TIME */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="booking-date"
                className="mb-2 block text-sm font-semibold"
              >
                Service date
              </label>

              <div className="relative">
                <CalendarDays
                  className="absolute left-3 top-3.5 text-slate-400"
                  size={18}
                />

                <input
                  id="booking-date"
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setError("");
                  }}
                  required
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {schedule?.enabled !== false && schedule && (
                <p className="mt-2 text-xs text-emerald-600">
                  {selectedDayName}: {schedule.start || "09:00"} -{" "}
                  {schedule.end || "19:00"}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="booking-time"
                className="mb-2 block text-sm font-semibold"
              >
                Preferred time
              </label>

              <div className="relative">
                <Clock
                  className="absolute left-3 top-3.5 text-slate-400"
                  size={18}
                />

                <input
                  id="booking-time"
                  type="time"
                  min={date === today ? currentLocalTime() : undefined}
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    setError("");
                  }}
                  required
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Final availability is checked by FIXNEAR.
              </p>
            </div>
          </div>

          {/* ADDRESS */}

          <div className="mt-5">
            <label
              htmlFor="address"
              className="mb-2 block text-sm font-semibold"
            >
              Service address
            </label>

            <div className="relative">
              <MapPin
                className="absolute left-3 top-3.5 text-slate-400"
                size={18}
              />

              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                required
                placeholder="Enter your complete service address"
                className="w-full resize-none rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          {/* CITY AND STATE */}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="city"
                className="mb-2 block text-sm font-semibold"
              >
                City
              </label>

              <input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                placeholder="Enter your city"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="state"
                className="mb-2 block text-sm font-semibold"
              >
                State
              </label>

              <input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                placeholder="Enter your state"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          {/* NOTES */}

          <div className="mt-4">
            <label htmlFor="notes" className="mb-2 block text-sm font-semibold">
              Additional notes{" "}
              <span className="font-normal text-slate-400">(Optional)</span>
            </label>

            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything the provider should know?"
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          {/* PAYMENT METHOD */}

          <section className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                <Wallet size={22} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">Payment method</h3>

                <p className="text-sm text-slate-500">
                  Choose online or cash payment.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {/* ONLINE */}

              <button
                type="button"
                disabled={bookingLoading}
                aria-pressed={paymentMethod === "online"}
                onClick={() => {
                  setPaymentMethod("online");
                  setError("");
                  setSuccess("");
                }}
                className={`rounded-2xl border-2 p-4 text-left transition ${
                  paymentMethod === "online"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="text-blue-700" size={23} />

                  <div>
                    <p className="font-bold">Online payment</p>

                    <p className="text-xs text-slate-500">
                      UPI, cards and options shown in Razorpay
                    </p>
                  </div>
                </div>

                {paymentMethod === "online" && (
                  <p className="mt-3 text-xs font-semibold text-blue-700">
                    <CheckCircle className="mr-1 inline" size={14} />
                    Selected
                  </p>
                )}
              </button>

              {/* CASH */}

              <button
                type="button"
                disabled={bookingLoading}
                aria-pressed={paymentMethod === "cash"}
                onClick={() => {
                  setPaymentMethod("cash");
                  setError("");
                  setSuccess("");
                }}
                className={`rounded-2xl border-2 p-4 text-left transition ${
                  paymentMethod === "cash"
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-200 hover:border-emerald-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Banknote className="text-emerald-700" size={23} />

                  <div>
                    <p className="font-bold">Cash payment</p>

                    <p className="text-xs text-slate-500">
                      Pay the provider in person
                    </p>
                  </div>
                </div>

                {paymentMethod === "cash" && (
                  <p className="mt-3 text-xs font-semibold text-emerald-700">
                    <CheckCircle className="mr-1 inline" size={14} />
                    Selected
                  </p>
                )}
              </button>
            </div>

            {/* PAYMENT INFORMATION */}

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              <ShieldCheck
                className="mt-0.5 shrink-0 text-emerald-600"
                size={18}
              />

              <p>
                {paymentMethod === "online"
                  ? "Your service will not be confirmed if payment is cancelled or fails. Confirmation proceeds only after the server verifies payment."
                  : "Your cash booking will be submitted for provider confirmation. Payment is collected in person."}
              </p>
            </div>
          </section>

          {/* SUBMIT BUTTON */}

          <button
            type="submit"
            disabled={bookingLoading || !providerService?._id}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bookingLoading ? (
              <>
                <Loader2 className="animate-spin" size={19} />

                {paymentMethod === "online"
                  ? "Processing payment..."
                  : "Creating booking..."}
              </>
            ) : (
              <>
                {paymentMethod === "online"
                  ? `Pay ₹${servicePrice.toLocaleString("en-IN")}`
                  : "Submit cash booking"}

                <ArrowRight size={19} />
              </>
            )}
          </button>

          {paymentMethod === "online" && (
            <p className="mt-3 text-center text-xs text-slate-400">
              Your booking is not confirmed until payment verification succeeds.
            </p>
          )}
        </form>

        {/* =================================================
            BOOKING SUMMARY
        ================================================= */}

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
          <h2 className="text-xl font-bold">Booking summary</h2>

          {/* SERVICE */}

          <div className="mt-5 border-b border-slate-100 pb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Service
            </p>

            <h3 className="mt-1 text-lg font-bold">{serviceName}</h3>

            {(providerService?.service?.category || service?.category) && (
              <span className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {providerService?.service?.category || service?.category}
              </span>
            )}

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {providerService?.service?.description ||
                service?.description ||
                "Professional service provided by this FIXNEAR provider."}
            </p>
          </div>

          {/* PROVIDER */}

          <div className="flex items-start gap-3 border-b border-slate-100 py-5">
            <Wrench className="mt-0.5 text-blue-600" size={20} />

            <div>
              <p className="text-xs text-slate-400">Provider</p>

              <p className="mt-1 font-semibold">{providerName}</p>

              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={13}
                    className={
                      n <= Math.round(Number(provider?.rating || 0))
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-300"
                    }
                  />
                ))}

                <span className="ml-1 text-xs text-slate-500">
                  {Number(provider?.rating || 0).toFixed(1)} (
                  {provider?.totalReviews || 0})
                </span>
              </div>

              {provider?.isVerified && (
                <p className="mt-2 text-xs text-emerald-600">
                  <ShieldCheck className="mr-1 inline" size={14} />
                  Verified provider
                </p>
              )}
            </div>
          </div>

          {/* DATE, TIME AND LOCATION */}

          <div className="space-y-4 border-b border-slate-100 py-5">
            {date && (
              <div className="flex items-start gap-3">
                <CalendarDays className="text-blue-600" size={18} />

                <div>
                  <p className="text-xs text-slate-400">Service date</p>

                  <p className="mt-1 text-sm font-semibold">
                    {new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}

            {time && (
              <div className="flex items-start gap-3">
                <Clock className="text-blue-600" size={18} />

                <div>
                  <p className="text-xs text-slate-400">Preferred time</p>

                  <p className="mt-1 text-sm font-semibold">{time}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <MapPin className="text-blue-600" size={18} />

              <div>
                <p className="text-xs text-slate-400">Provider location</p>

                <p className="mt-1 text-sm font-semibold">
                  {providerLocation || "Location not specified"}
                </p>
              </div>
            </div>

            {city && state && (
              <div className="flex items-start gap-3">
                <MapPin className="text-blue-600" size={18} />

                <div>
                  <p className="text-xs text-slate-400">Service location</p>

                  <p className="mt-1 text-sm font-semibold">
                    {city}, {state}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* PRICE */}

          <div className="pt-5">
            <p className="text-xs text-slate-400">Service price</p>

            <div className="mt-1 flex items-center gap-1 text-blue-700">
              <IndianRupee size={21} />

              <span className="text-2xl font-extrabold">
                {servicePrice.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* SELECTED PAYMENT METHOD */}

          <div
            className={`mt-4 rounded-xl border p-4 ${
              paymentMethod === "online"
                ? "border-blue-200 bg-blue-50"
                : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Selected payment method
            </p>

            <div className="mt-2 flex items-center gap-2">
              {paymentMethod === "online" ? (
                <CreditCard className="text-blue-700" size={19} />
              ) : (
                <Banknote className="text-emerald-700" size={19} />
              )}

              <p className="text-sm font-bold">
                {paymentMethod === "online" ? "Online payment" : "Cash payment"}
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-600">
              {paymentMethod === "online"
                ? "Payment must be verified before the booking can proceed."
                : "The provider collects payment in person."}
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default Booking;
