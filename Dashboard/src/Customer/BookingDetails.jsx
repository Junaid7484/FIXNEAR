import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BookingMessagePopup from "../components/BookingMessagePopup";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  IndianRupee,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  User,
  Wrench,
  XCircle,
} from "lucide-react";
import API from "../services/api";

const STATUS_STEPS = [
  {
    key: "pending",
    label: "Booking Requested",
    description: "Your booking request has been submitted.",
  },
  {
    key: "accepted",
    label: "Accepted",
    description: "The provider has accepted your booking.",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    description: "Your service has been confirmed.",
  },
  {
    key: "in-progress",
    label: "In Progress",
    description: "The provider is currently working on your service.",
  },
  {
    key: "completed",
    label: "Completed",
    description: "Your service has been completed.",
  },
];

const getStatusClass = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "accepted":
    case "confirmed":
      return "bg-green-50 text-green-700 border-green-200";
    case "in-progress":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "completed":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "rejected":
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }
};

const formatStatus = (status) => {
  if (!status) return "Pending";

  return String(status)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getStatusIcon = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "completed":
      return CheckCircle2;
    case "cancelled":
    case "rejected":
      return XCircle;
    case "in-progress":
      return Wrench;
    default:
      return Clock;
  }
};

const formatDate = (date) => {
  if (!date) return "Not specified";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return String(date);

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return String(date);

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    let script = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (script) {
      script.addEventListener("load", () => resolve(true), { once: true });
      script.addEventListener(
        "error",
        () => reject(new Error("Unable to load Razorpay Checkout.")),
        { once: true },
      );

      // Handle an existing script that has already loaded.
      if (window.Razorpay) resolve(true);
      return;
    }

    script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () =>
      reject(new Error("Unable to load Razorpay Checkout."));
    document.body.appendChild(script);
  });

function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const currentUserId = storedUser._id || storedUser.id;

  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cancelling, setCancelling] = useState(false);
  const [showCancelBox, setShowCancelBox] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  // Payment state
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");

  // Review state
  const [reviewChecked, setReviewChecked] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showReviewBox, setShowReviewBox] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  // ---------------------------------------------------------
  // FETCH BOOKING
  // ---------------------------------------------------------

  const fetchBooking = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await API.get(`/bookings/${id}`);
      const bookingData =
        response.data?.booking || response.data?.data || response.data;

      setBooking(bookingData);
    } catch (err) {
      console.error("Fetch Booking Details Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message || "Failed to load booking details.",
      );
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // ---------------------------------------------------------
  // PAYMENT RETRY
  // ---------------------------------------------------------

  const handleRetryPayment = async () => {
    if (!booking?._id || retryingPayment) return;

    setPaymentError("");
    setPaymentSuccess("");
    setRetryingPayment(true);

    try {
      await loadRazorpayScript();

      // Create a fresh payment order from your backend.
      const orderResponse = await API.post(
        `/bookings/${booking._id}/payment/order`,
      );

      const orderData = orderResponse.data?.data || orderResponse.data;

      const razorpayOrder = orderData?.order;
      const keyId = orderData?.keyId;

      if (!razorpayOrder?.id || !keyId) {
        throw new Error(
          "The server did not return a valid Razorpay order. Please try again.",
        );
      }

      const options = {
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "FixNear",
        description: `Payment for ${serviceName}`,
        order_id: razorpayOrder.id,

        prefill: {
          name: storedUser.name || "",
          email: storedUser.email || "",
          contact: storedUser.phone || "",
        },

        notes: {
          bookingId: String(booking._id),
        },

        theme: {
          color: "#2563eb",
        },

        handler: async (paymentResponse) => {
          try {
            setPaymentError("");

            // Verify the payment signature on the backend.
            const verifyResponse = await API.post(
              `/bookings/${booking._id}/payment/verify`,
              {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              },
            );

            const verifyData = verifyResponse.data?.data || verifyResponse.data;

            if (
              verifyResponse.data?.success === false ||
              verifyData?.success === false
            ) {
              throw new Error(
                verifyResponse.data?.message || "Payment verification failed.",
              );
            }

            setPaymentSuccess(
              "Payment verification submitted successfully. Refreshing your booking status...",
            );

            await fetchBooking();
          } catch (err) {
            console.error("Payment Verification Error:", err);

            setPaymentSuccess("");
            setPaymentError(
              err.response?.data?.message ||
                err.message ||
                "We could not verify this payment. Please refresh the booking status before attempting another payment.",
            );

            await fetchBooking();
          } finally {
            setRetryingPayment(false);
          }
        },

        modal: {
          ondismiss: () => {
            setRetryingPayment(false);
            setPaymentError(
              "Payment was not completed. You can retry when you are ready.",
            );
            fetchBooking();
          },
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", (event) => {
        const reason =
          event.error?.description ||
          event.error?.reason ||
          "The payment could not be completed.";

        setPaymentSuccess("");
        setPaymentError(reason);
        setRetryingPayment(false);

        // Reload the server's payment and booking status.
        fetchBooking();
      });

      checkout.open();
    } catch (err) {
      console.error("Retry Payment Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        navigate("/login");
        return;
      }

      setPaymentError(
        err.response?.data?.message ||
          err.message ||
          "Unable to start payment. Please try again.",
      );
      setRetryingPayment(false);
    }
  };

  // ---------------------------------------------------------
  // CHECK EXISTING REVIEW
  // ---------------------------------------------------------

  const checkExistingReview = useCallback(async () => {
    if (!id) return;

    try {
      setReviewChecked(false);

      const response = await API.get("/reviews/my");
      const reviews =
        response.data?.reviews || response.data?.data || response.data || [];

      const reviewList = Array.isArray(reviews) ? reviews : [];

      const existingReview = reviewList.some((review) => {
        const reviewBookingId =
          typeof review.booking === "object"
            ? review.booking?._id
            : review.booking;

        return String(reviewBookingId) === String(id);
      });

      setHasReviewed(existingReview);
    } catch (err) {
      console.error("Check Existing Review Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        navigate("/login");
        return;
      }

      setHasReviewed(false);
    } finally {
      setReviewChecked(true);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (booking?.status === "completed") {
      checkExistingReview();
    } else {
      setReviewChecked(true);
      setHasReviewed(false);
    }
  }, [booking?.status, checkExistingReview]);

  // ---------------------------------------------------------
  // DATA HELPERS
  // ---------------------------------------------------------

  const serviceName = useMemo(() => {
    if (!booking) return "Service";

    if (typeof booking.service === "object") {
      return booking.service?.name || "Service";
    }

    return booking.serviceName || "Service";
  }, [booking]);

  const serviceDescription = useMemo(() => {
    if (typeof booking?.service === "object") {
      return booking.service?.description || "";
    }

    return "";
  }, [booking]);

  const serviceImage = useMemo(() => {
    if (typeof booking?.service !== "object") return "";

    const image = booking.service?.image;

    if (typeof image === "string") return image;
    if (typeof image === "object") return image?.url || "";

    return "";
  }, [booking]);

  const providerName = useMemo(() => {
    if (!booking) return "Provider";

    if (typeof booking.provider === "object") {
      return (
        booking.provider?.businessName ||
        booking.provider?.name ||
        booking.provider?.user?.name ||
        "Provider"
      );
    }

    return booking.providerName || "Provider";
  }, [booking]);

  const providerPhone = useMemo(() => {
    if (typeof booking?.provider === "object") {
      return booking.provider?.phone || booking.provider?.user?.phone || "";
    }

    return "";
  }, [booking]);

  const providerEmail = useMemo(() => {
    if (typeof booking?.provider === "object") {
      return booking.provider?.user?.email || booking.provider?.email || "";
    }

    return "";
  }, [booking]);

  const providerImage = useMemo(() => {
    if (typeof booking?.provider === "object") {
      return (
        booking.provider?.profileImage ||
        booking.provider?.user?.profileImage ||
        ""
      );
    }

    return "";
  }, [booking]);

  const providerRating = useMemo(() => {
    if (typeof booking?.provider === "object") {
      return booking.provider?.rating ?? 0;
    }

    return 0;
  }, [booking]);

  const price = useMemo(() => {
    if (!booking) return 0;
    return booking.price ?? booking.providerService?.price ?? 0;
  }, [booking]);

  const status = booking?.status || "pending";
  const StatusIcon = getStatusIcon(status);

  const statusIndex = useMemo(() => {
    const index = STATUS_STEPS.findIndex((step) => step.key === status);

    return index === -1 ? 0 : index;
  }, [status]);

  const bookingTime = useMemo(() => {
    if (!booking?.bookingDate) return "Not specified";

    const date = new Date(booking.bookingDate);

    if (Number.isNaN(date.getTime())) return "Not specified";

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [booking]);

  const canCancel = useMemo(() => {
    if (!booking) return false;

    const currentStatus = String(status || "")
      .toLowerCase()
      .trim();

    // Cancellation is not allowed once work has started.
    const nonCancellableStatuses = [
      "in-progress",
      "in progress",
      "completed",
      "rejected",
      "cancelled",
    ];

    return !nonCancellableStatuses.includes(currentStatus);
  }, [booking, status]);

  // ---------------------------------------------------------
  // CANCEL BOOKING
  // ---------------------------------------------------------

  const handleCancelBooking = async () => {
    if (!id || cancelling) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?",
    );

    if (!confirmed) return;

    try {
      setCancelling(true);

      const response = await API.put(`/bookings/${id}/cancel`, {
        cancellationReason:
          cancellationReason.trim() || "Cancelled by customer",
      });

      const updatedBooking =
        response.data?.booking || response.data?.data || response.data;

      setBooking(updatedBooking);
      setShowCancelBox(false);
      setCancellationReason("");

      window.alert("Booking cancelled successfully.");
    } catch (err) {
      console.error("Cancel Booking Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        navigate("/login");
        return;
      }

      window.alert(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancelling(false);
    }
  };

  // ---------------------------------------------------------
  // REVIEW HANDLERS
  // ---------------------------------------------------------

  const handleOpenReview = () => {
    setReviewError("");
    setReviewSuccess("");
    setShowReviewBox(true);
  };

  const handleCloseReview = () => {
    if (reviewLoading) return;

    setShowReviewBox(false);
    setReviewError("");
    setReviewSuccess("");
    setReviewRating(0);
    setReviewComment("");
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (reviewLoading) return;

    setReviewError("");
    setReviewSuccess("");

    if (!reviewRating) {
      setReviewError("Please select a rating from 1 to 5 stars.");
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError("Please write a short comment about your experience.");
      return;
    }

    if (reviewComment.trim().length < 5) {
      setReviewError("Your review should contain at least 5 characters.");
      return;
    }

    try {
      setReviewLoading(true);

      await API.post("/reviews", {
        booking: booking._id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setHasReviewed(true);
      setReviewSuccess("Your review has been submitted successfully.");
      setReviewRating(0);
      setReviewComment("");

      window.setTimeout(() => {
        setShowReviewBox(false);
        setReviewSuccess("");
      }, 1800);
    } catch (err) {
      console.error("Submit Review Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        navigate("/login");
        return;
      }

      setReviewError(
        err.response?.data?.message ||
          "Failed to submit review. Please try again.",
      );
    } finally {
      setReviewLoading(false);
    }
  };

  // ---------------------------------------------------------
  // LOADING / ERROR / NOT FOUND
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md w-full shadow-sm">
          <AlertCircle size={32} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Unable to load booking
          </h2>
          <p className="text-slate-500 mt-2">{error}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button
              type="button"
              onClick={fetchBooking}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium"
            >
              <RefreshCw size={17} />
              Try Again
            </button>

            <Link
              to="/my-bookings"
              className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-medium"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <ClipboardList size={50} className="text-slate-300 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 mt-5">
            Booking not found
          </h2>
          <Link
            to="/my-bookings"
            className="inline-flex items-center gap-2 mt-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl"
          >
            <ArrowLeft size={17} />
            Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // PAYMENT GATE
  // Do not reveal regular booking details until online payment
  // has been verified by the backend.
  // ---------------------------------------------------------

  const paymentMethod = String(booking.paymentMethod || "").toLowerCase();

  const paymentStatus = String(
    booking.paymentStatus || "pending",
  ).toLowerCase();

  const bookingStatus = String(booking.status || "pending").toLowerCase();

  const isOnlinePayment =
    paymentMethod === "online" || bookingStatus === "pending_payment";

  const paymentRequired = isOnlinePayment && paymentStatus !== "paid";

  const paymentFailed =
    paymentStatus === "failed" ||
    Boolean(booking.paymentFailureReason) ||
    Boolean(booking.failureReason);

  const paymentOrderId =
    booking.razorpayOrderId ||
    booking.paymentOrderId ||
    booking.orderId ||
    "Not available";

  const paymentTransactionId =
    booking.paymentId ||
    booking.razorpayPaymentId ||
    booking.transactionId ||
    "Not available";

  const paymentFailureReason =
    booking.paymentFailureReason ||
    booking.failureReason ||
    booking.paymentError ||
    "";

  if (paymentRequired) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <Link
              to="/my-bookings"
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white"
            >
              <ArrowLeft size={18} />
              Back to My Bookings
            </Link>

            <div className="mt-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                <CreditCard size={26} />
              </div>
              <div>
                <p className="text-blue-300 text-sm font-medium">
                  FIXNEAR PAYMENT
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold mt-1">
                  Payment Required
                </h1>
              </div>
            </div>
            <p className="text-slate-300 mt-3">
              Complete your payment to confirm your service booking.
            </p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div
              className={`p-6 sm:p-8 ${
                paymentFailed ? "bg-red-50" : "bg-amber-50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${
                    paymentFailed
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {paymentFailed ? <XCircle size={27} /> : <Clock size={27} />}
                </div>

                <div>
                  <h2
                    className={`text-xl font-bold ${
                      paymentFailed ? "text-red-800" : "text-amber-900"
                    }`}
                  >
                    {paymentFailed ? "Payment Failed" : "Payment Pending"}
                  </h2>

                  <p
                    className={`text-sm mt-2 leading-6 ${
                      paymentFailed ? "text-red-700" : "text-amber-800"
                    }`}
                  >
                    {paymentFailed
                      ? "Your online payment has not been confirmed. Your regular booking details are hidden until the payment is successfully verified."
                      : "We have not received confirmation of your online payment yet. Complete the payment or refresh the status before continuing."}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {paymentError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                  <AlertCircle
                    size={20}
                    className="text-red-600 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-red-800">
                      Payment message
                    </p>
                    <p className="text-sm text-red-700 mt-1 break-words">
                      {paymentError}
                    </p>
                  </div>
                </div>
              )}

              {paymentSuccess && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
                  <CheckCircle2
                    size={20}
                    className="text-green-600 shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-green-800">{paymentSuccess}</p>
                </div>
              )}

              {paymentFailureReason && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                    Recorded failure reason
                  </p>
                  <p className="text-sm text-red-800 mt-2 break-words">
                    {paymentFailureReason}
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-slate-900 text-white p-6">
                <p className="text-sm text-slate-300">Amount to Pay</p>
                <div className="flex items-center gap-2 mt-2">
                  <IndianRupee size={30} />
                  <span className="text-4xl font-bold">
                    {Number(price || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="mt-5 pt-5 border-t border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Payment Method</p>
                    <p className="text-sm font-semibold mt-1">
                      Online / Razorpay
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Payment Status</p>
                    <p
                      className={`text-sm font-semibold mt-1 ${
                        paymentFailed ? "text-red-300" : "text-amber-300"
                      }`}
                    >
                      {formatStatus(paymentStatus)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 divide-y divide-slate-100">
                <div className="p-4 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-sm text-slate-500">Booking ID</span>
                  <span className="text-sm font-semibold text-slate-800 break-all sm:text-right">
                    {booking._id}
                  </span>
                </div>

                <div className="p-4 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-sm text-slate-500">Order ID</span>
                  <span className="text-sm font-semibold text-slate-800 break-all sm:text-right">
                    {paymentOrderId}
                  </span>
                </div>

                <div className="p-4 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-sm text-slate-500">
                    Transaction / Payment ID
                  </span>
                  <span className="text-sm font-semibold text-slate-800 break-all sm:text-right">
                    {paymentTransactionId}
                  </span>
                </div>

                <div className="p-4 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-sm text-slate-500">Booking Status</span>
                  <span className="text-sm font-semibold text-slate-800 sm:text-right">
                    {formatStatus(bookingStatus)}
                  </span>
                </div>

                <div className="p-4 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-sm text-slate-500">
                    Booking Created
                  </span>
                  <span className="text-sm font-semibold text-slate-800 sm:text-right">
                    {formatDateTime(booking.createdAt)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
                <ShieldCheck
                  size={21}
                  className="text-blue-600 shrink-0 mt-0.5"
                />
                <p className="text-sm text-blue-800 leading-6">
                  Payment status is checked against the FixNear server. If your
                  bank or payment app shows a debit, but FixNear still shows
                  pending or failed, refresh the status and contact support
                  before making another payment.
                </p>
              </div>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  disabled={retryingPayment}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {retryingPayment ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Starting Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Retry Payment
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentError("");
                    setPaymentSuccess("");
                    fetchBooking();
                  }}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-3 font-semibold transition disabled:opacity-60"
                >
                  <RefreshCw
                    size={18}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh Status
                </button>
              </div>

              <Link
                to="/my-bookings"
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 font-semibold transition"
              >
                <ArrowLeft size={18} />
                Back to My Bookings
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------
  // NORMAL BOOKING DETAILS
  // This section is reached after online payment is marked paid,
  // or for a booking that does not require online payment.
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            to="/my-bookings"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition"
          >
            <ArrowLeft size={18} />
            Back to My Bookings
          </Link>

          <div className="mt-6">
            <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
              <ClipboardList size={16} />
              FIXNEAR Booking
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mt-4">
              Booking Details
            </h1>
            <p className="text-slate-300 mt-2">
              View your complete service booking information.
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* CURRENT STATUS */}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">
                Current Status
              </p>
              <div
                className={`inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-full border text-sm font-semibold ${getStatusClass(status)}`}
              >
                <StatusIcon size={16} />
                {formatStatus(status)}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-400">Booking ID</p>
              <p className="text-sm font-semibold text-slate-700 mt-1 break-all">
                {booking._id}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* SERVICE INFORMATION */}

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <Wrench size={19} className="text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">
                  Service Information
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                {serviceImage ? (
                  <img
                    src={serviceImage}
                    alt={serviceName}
                    className="w-full sm:w-32 h-32 object-cover rounded-xl"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full sm:w-32 h-32 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Wrench size={38} />
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">
                    {serviceName}
                  </h3>

                  {booking.service?.category && (
                    <p className="text-sm text-blue-600 mt-1">
                      {booking.service.category}
                    </p>
                  )}

                  {serviceDescription && (
                    <p className="text-sm text-slate-500 mt-3 leading-6">
                      {serviceDescription}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <IndianRupee size={18} className="text-blue-600" />
                    <span className="text-lg font-bold text-slate-900">
                      ₹{price}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* BOOKING INFORMATION */}

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Booking Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                <div className="flex items-start gap-3">
                  <CalendarDays size={19} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Service Date</p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">
                      {formatDate(booking.bookingDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={19} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Service Time</p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">
                      {bookingTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={19} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Service Address</p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">
                      {booking.address || "Not specified"}
                    </p>
                    {(booking.city || booking.state) && (
                      <p className="text-sm text-slate-500 mt-1">
                        {booking.city}
                        {booking.city && booking.state ? ", " : ""}
                        {booking.state}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <IndianRupee size={19} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Booking Amount</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      ₹{price}
                    </p>
                  </div>
                </div>
              </div>

              {booking.notes && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Customer Notes</p>
                  <p className="text-sm text-slate-600 mt-2 leading-6">
                    {booking.notes}
                  </p>
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs text-slate-400">Booking Created</p>
                <p className="text-sm text-slate-600 mt-1">
                  {formatDateTime(booking.createdAt)}
                </p>
              </div>

              {/* PAYMENT INFORMATION FOR PAID ONLINE BOOKINGS */}

              {paymentMethod === "online" && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <h3 className="font-semibold text-slate-900">
                    Payment Information
                  </h3>
                  <div className="mt-3 space-y-3">
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-slate-500">Payment Method</span>
                      <span className="font-medium text-slate-800">Online</span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-slate-500">Payment Status</span>
                      <span className="font-semibold text-green-700">
                        {formatStatus(paymentStatus)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                      <span className="text-slate-500">Payment ID</span>
                      <span className="font-medium text-slate-800 break-all sm:text-right">
                        {paymentTransactionId}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* BOOKING PROGRESS */}

            {!["cancelled", "rejected"].includes(status) && (
              <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Booking Progress
                </h2>

                <div className="mt-7 space-y-6">
                  {STATUS_STEPS.map((step, index) => {
                    const active = index <= statusIndex;
                    const current = index === statusIndex;

                    return (
                      <div key={step.key} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center ${
                              active
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {active ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <span className="text-sm font-bold">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          {index !== STATUS_STEPS.length - 1 && (
                            <div
                              className={`w-0.5 h-8 mt-1 ${
                                index < statusIndex
                                  ? "bg-blue-600"
                                  : "bg-slate-200"
                              }`}
                            />
                          )}
                        </div>

                        <div>
                          <p
                            className={`font-semibold ${
                              active ? "text-slate-900" : "text-slate-400"
                            }`}
                          >
                            {step.label}
                            {current && (
                              <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                Current
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* CANCELLED / REJECTED */}

            {["cancelled", "rejected"].includes(status) && (
              <section className="bg-red-50 border border-red-200 rounded-2xl p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-800">
                      {status === "cancelled"
                        ? "Booking Cancelled"
                        : "Booking Rejected"}
                    </h3>
                    <p className="text-sm text-red-700 mt-2">
                      {booking.cancellationReason ||
                        (status === "cancelled"
                          ? "This booking was cancelled."
                          : "The provider rejected this booking.")}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN */}

          <aside className="space-y-6">
            {/* PROVIDER */}

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Service Provider
              </h2>

              <div className="flex items-center gap-4 mt-5">
                {providerImage ? (
                  <img
                    src={providerImage}
                    alt={providerName}
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <User size={28} />
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 break-words">
                    {providerName}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {providerRating > 0
                      ? `⭐ ${providerRating}/5`
                      : "Rating not available"}
                  </p>
                </div>
              </div>

              {providerPhone && (
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100">
                  <Phone size={17} className="text-blue-600" />
                  <a
                    href={`tel:${providerPhone}`}
                    className="text-sm text-slate-700 hover:text-blue-600"
                  >
                    {providerPhone}
                  </a>
                </div>
              )}

              {providerEmail && (
                <div className="flex items-center gap-3 mt-4">
                  <Mail size={17} className="text-blue-600" />
                  <a
                    href={`mailto:${providerEmail}`}
                    className="text-sm text-slate-700 hover:text-blue-600 break-all"
                  >
                    {providerEmail}
                  </a>
                </div>
              )}
            </section>

            {/* MESSAGE PROVIDER */}

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MessageCircle size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Contact Provider
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Have questions about your booking? Send a message.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMessageOpen(true)}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 font-semibold transition"
              >
                <MessageCircle size={18} />
                Message Provider
              </button>
            </section>

            {/* TOTAL */}

            <section className="bg-slate-900 text-white rounded-2xl shadow-sm p-5 sm:p-6">
              <p className="text-slate-400 text-sm">Total Booking Amount</p>
              <div className="flex items-center gap-1 mt-2">
                <IndianRupee size={23} />
                <span className="text-3xl font-bold">{price}</span>
              </div>
              <p className="text-slate-400 text-xs mt-3">
                Final amount is based on the provider service price.
              </p>
            </section>

            {/* ACTIONS */}

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
              <h2 className="font-bold text-slate-900">Actions</h2>

              <div className="space-y-3 mt-5">
                <Link
                  to="/my-bookings"
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-semibold transition"
                >
                  <ArrowLeft size={17} />
                  My Bookings
                </Link>

                <button
                  type="button"
                  onClick={fetchBooking}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                >
                  <RefreshCw
                    size={17}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh Details
                </button>

                {/* REVIEW ACTION */}

                {status === "completed" && reviewChecked && (
                  <>
                    {!hasReviewed && !showReviewBox ? (
                      <button
                        type="button"
                        onClick={handleOpenReview}
                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold transition"
                      >
                        <Star size={17} fill="currentColor" />
                        Rate & Review
                      </button>
                    ) : hasReviewed && !showReviewBox ? (
                      <div className="w-full inline-flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-semibold">
                        <CheckCircle2 size={17} />
                        Review Submitted
                      </div>
                    ) : null}
                  </>
                )}

                {/* CANCEL ACTION */}

                {canCancel && (
                  <>
                    {!showCancelBox ? (
                      <button
                        type="button"
                        onClick={() => setShowCancelBox(true)}
                        className="w-full inline-flex items-center justify-center gap-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 rounded-xl font-semibold transition"
                      >
                        <Ban size={17} />
                        Cancel Booking
                      </button>
                    ) : (
                      <div className="border border-red-200 bg-red-50 rounded-xl p-4">
                        <p className="text-sm font-semibold text-red-800">
                          Cancel this booking?
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          This action cannot be undone.
                        </p>

                        <textarea
                          value={cancellationReason}
                          onChange={(event) =>
                            setCancellationReason(event.target.value)
                          }
                          placeholder="Reason for cancellation (optional)"
                          rows={3}
                          disabled={cancelling}
                          className="w-full mt-3 border border-red-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200 bg-white resize-none"
                        />

                        <div className="flex flex-col sm:flex-row gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowCancelBox(false);
                              setCancellationReason("");
                            }}
                            disabled={cancelling}
                            className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                          >
                            Keep Booking
                          </button>

                          <button
                            type="button"
                            onClick={handleCancelBooking}
                            disabled={cancelling}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                          >
                            {cancelling ? "Cancelling..." : "Confirm Cancel"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </aside>
        </div>

        {/* REVIEW FORM */}

        {showReviewBox && status === "completed" && !hasReviewed && (
          <section className="mt-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Star
                      size={21}
                      className="text-blue-600"
                      fill="currentColor"
                    />
                    <h2 className="text-xl font-bold text-slate-900">
                      Rate Your Experience
                    </h2>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    How was your experience with{" "}
                    <span className="font-semibold text-slate-700">
                      {providerName}
                    </span>
                    ?
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseReview}
                  disabled={reviewLoading}
                  className="text-sm text-slate-500 hover:text-slate-800 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              {reviewSuccess && (
                <div className="mt-5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-medium">{reviewSuccess}</span>
                </div>
              )}

              {reviewError && (
                <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-center gap-2">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">{reviewError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="mt-6">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Your Rating
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    {[1, 2, 3, 4, 5].map((starNumber) => (
                      <button
                        key={starNumber}
                        type="button"
                        onClick={() => setReviewRating(starNumber)}
                        disabled={reviewLoading}
                        aria-label={`Rate ${starNumber} star${
                          starNumber > 1 ? "s" : ""
                        }`}
                        className={`p-1 transition ${
                          reviewLoading
                            ? "cursor-not-allowed opacity-50"
                            : "hover:scale-110"
                        }`}
                      >
                        <Star
                          size={32}
                          className={
                            starNumber <= reviewRating
                              ? "text-yellow-400"
                              : "text-slate-300"
                          }
                          fill={
                            starNumber <= reviewRating ? "currentColor" : "none"
                          }
                        />
                      </button>
                    ))}

                    {reviewRating > 0 && (
                      <span className="ml-2 text-sm font-semibold text-slate-600">
                        {reviewRating}/5
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label
                    htmlFor="review-comment"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Your Review
                  </label>

                  <textarea
                    id="review-comment"
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    disabled={reviewLoading}
                    rows={5}
                    maxLength={1000}
                    placeholder="Tell us about your experience with this service provider..."
                    className="w-full mt-2 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none resize-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 disabled:bg-slate-50"
                  />

                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-slate-400">
                      {reviewComment.length}/1000
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                  <button
                    type="button"
                    onClick={handleCloseReview}
                    disabled={reviewLoading}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                  >
                    {reviewLoading ? (
                      <>
                        <RefreshCw size={17} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Star size={17} fill="currentColor" />
                        Submit Review
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
      </main>

      <BookingMessagePopup
        open={isMessageOpen}
        onClose={() => setIsMessageOpen(false)}
        bookingId={booking._id}
        currentUserId={currentUserId}
        otherPersonName={providerName}
      />
    </div>
  );
}

export default BookingDetails;
