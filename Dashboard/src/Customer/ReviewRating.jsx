import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Star,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
  User,
  Briefcase,
  RefreshCw,
  CalendarDays,
  IndianRupee,
  MapPin,
} from "lucide-react";

import API from "../services/api";

const RATING_OPTIONS = [1, 2, 3, 4, 5];

/* =========================================================
   RESPONSE HELPERS
========================================================= */

const getApiData = (response) => {
  return response?.data?.data || response?.data || null;
};

const getBookingFromResponse = (response) => {
  return (
    response?.data?.booking ||
    response?.data?.data?.booking ||
    response?.data?.data ||
    response?.data ||
    null
  );
};

const getReviewsFromResponse = (response) => {
  return (
    response?.data?.reviews ||
    response?.data?.data?.reviews ||
    response?.data?.data ||
    []
  );
};

/* =========================================================
   ID HELPER
========================================================= */

const getId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return value?._id || value?.id || "";
  }

  return "";
};

/* =========================================================
   COMPONENT
========================================================= */

function Reviews() {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();

  /* =========================================================
     STATE
  ========================================================= */

  const [reviews, setReviews] = useState([]);
  const [booking, setBooking] = useState(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");

  const redirectTimerRef = useRef(null);

  /* =========================================================
     CLEANUP TIMER
  ========================================================= */

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  /* =========================================================
     LOGOUT / 401 HANDLER
  ========================================================= */

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    navigate("/login", {
      replace: true,
    });
  }, [navigate]);

  /* =========================================================
     FETCH MY REVIEWS
  ========================================================= */

  const fetchReviews = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) {
          setLoading(true);
        }

        setError("");

        const response = await API.get("/reviews/my");

        const reviewData = getReviewsFromResponse(response);

        setReviews(Array.isArray(reviewData) ? reviewData : []);
      } catch (error) {
        console.error("Reviews Error:", error);

        if (error?.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load your reviews.",
        );
      } finally {
        if (!isRefresh) {
          setLoading(false);
        }
      }
    },
    [handleUnauthorized],
  );

  /* =========================================================
     FETCH BOOKING
  ========================================================= */

  const fetchBooking = useCallback(
    async (isRefresh = false) => {
      if (!bookingId) {
        setBooking(null);
        return;
      }

      try {
        setBookingLoading(true);
        setBookingError("");

        const response = await API.get(`/bookings/${bookingId}`);

        const bookingData = getBookingFromResponse(response);

        if (!bookingData || typeof bookingData !== "object") {
          setBooking(null);
          setBookingError("Booking details could not be found.");
          return;
        }

        setBooking(bookingData);
      } catch (error) {
        console.error("Booking Error:", error);

        if (error?.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        setBookingError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load booking details.",
        );
      } finally {
        setBookingLoading(false);
      }
    },
    [bookingId, handleUnauthorized],
  );

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);

      try {
        const reviewRequest = API.get("/reviews/my");

        const bookingRequest = bookingId
          ? API.get(`/bookings/${bookingId}`)
          : null;

        const [reviewResponse, bookingResponse] = await Promise.all([
          reviewRequest,
          bookingRequest,
        ]);

        const reviewData = getReviewsFromResponse(reviewResponse);

        setReviews(Array.isArray(reviewData) ? reviewData : []);

        if (bookingResponse) {
          const bookingData = getBookingFromResponse(bookingResponse);

          if (bookingData && typeof bookingData === "object") {
            setBooking(bookingData);
            setBookingError("");
          } else {
            setBooking(null);
            setBookingError("Booking details could not be found.");
          }
        }
      } catch (error) {
        console.error("Review Page Initial Load Error:", error);

        if (error?.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        if (bookingId) {
          setBookingError(
            error?.response?.data?.message || "Failed to load booking details.",
          );
        }

        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load reviews.",
        );
      } finally {
        setLoading(false);
        setBookingLoading(false);
      }
    };

    loadPage();
  }, [bookingId, handleUnauthorized]);

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = async () => {
    if (refreshing || loading || bookingLoading) {
      return;
    }

    try {
      setRefreshing(true);

      await Promise.all([
        fetchReviews(true),
        bookingId ? fetchBooking(true) : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  /* =========================================================
     FIND EXISTING REVIEW
  ========================================================= */

  const existingReview = useMemo(() => {
    if (!bookingId || !Array.isArray(reviews)) {
      return null;
    }

    return (
      reviews.find((review) => {
        const reviewBookingId = getId(review?.booking);

        return String(reviewBookingId) === String(bookingId);
      }) || null
    );
  }, [reviews, bookingId]);

  const hasReviewed = Boolean(existingReview);

  /* =========================================================
     SUBMIT REVIEW
  ========================================================= */

  const submitReview = async (e) => {
    e.preventDefault();

    setSubmitError("");
    setSuccess("");

    /* -----------------------------------------
       VALIDATION
    ----------------------------------------- */

    if (!bookingId) {
      setSubmitError("Booking ID is missing.");
      return;
    }

    if (!booking) {
      setSubmitError("Booking information is unavailable.");
      return;
    }

    if (booking.status !== "completed") {
      setSubmitError(
        "You can submit a review only after the booking is completed.",
      );
      return;
    }

    if (hasReviewed) {
      setSubmitError("You have already reviewed this booking.");
      return;
    }

    if (!rating) {
      setSubmitError("Please select a rating.");
      return;
    }

    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      setSubmitError("Please write a review.");
      return;
    }

    if (trimmedComment.length < 3) {
      setSubmitError("Review must contain at least 3 characters.");
      return;
    }

    if (trimmedComment.length > 1000) {
      setSubmitError("Review cannot contain more than 1000 characters.");
      return;
    }

    /* -----------------------------------------
       SUBMIT
    ----------------------------------------- */

    try {
      setSubmitting(true);

      const response = await API.post("/reviews", {
        booking: bookingId,
        rating: Number(rating),
        comment: trimmedComment,
      });

      const responseData = getApiData(response);

      if (
        response?.data?.success === false ||
        responseData?.success === false
      ) {
        throw new Error(
          response?.data?.message ||
            responseData?.message ||
            "Failed to submit review.",
        );
      }

      const successMessage =
        response?.data?.message ||
        responseData?.message ||
        "Review submitted successfully.";

      setSuccess(successMessage);

      /* -----------------------------------------
         CLEAR FORM
      ----------------------------------------- */

      setRating(0);
      setHoverRating(0);
      setComment("");

      /* -----------------------------------------
         REFRESH REVIEW LIST
      ----------------------------------------- */

      await fetchReviews(true);

      /* -----------------------------------------
         REDIRECT
      ----------------------------------------- */

      redirectTimerRef.current = setTimeout(() => {
        navigate("/my-bookings", {
          replace: true,
        });
      }, 1500);
    } catch (error) {
      console.error("Submit Review Error:", error);

      if (error?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setSubmitError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to submit review.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     STAR DISPLAY
  ========================================================= */

  const renderStars = (reviewRating) => {
    const numericRating = Number(reviewRating) || 0;

    return (
      <div
        className="flex items-center gap-1"
        aria-label={`${numericRating} out of 5 stars`}
      >
        {RATING_OPTIONS.map((star) => (
          <Star
            key={star}
            size={17}
            className={
              star <= numericRating
                ? "text-yellow-500 fill-yellow-500"
                : "text-slate-300"
            }
          />
        ))}
      </div>
    );
  };

  /* =========================================================
     DATE FORMAT
  ========================================================= */

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* =========================================================
     BOOKING HELPERS
  ========================================================= */

  const serviceName = useMemo(() => {
    return (
      booking?.service?.name ||
      booking?.serviceName ||
      booking?.providerService?.service?.name ||
      "Service"
    );
  }, [booking]);

  const serviceCategory = useMemo(() => {
    return (
      booking?.service?.category ||
      booking?.service?.categoryName ||
      booking?.serviceCategory ||
      ""
    );
  }, [booking]);

  const providerName = useMemo(() => {
    return (
      booking?.provider?.businessName ||
      booking?.provider?.name ||
      booking?.provider?.user?.name ||
      booking?.providerName ||
      "Provider"
    );
  }, [booking]);

  const providerImage = useMemo(() => {
    const image =
      booking?.provider?.profileImage?.url ||
      booking?.provider?.profileImage ||
      booking?.provider?.user?.profileImage ||
      "";

    return typeof image === "string" ? image : "";
  }, [booking]);

  const bookingPrice = useMemo(() => {
    const price = booking?.price ?? booking?.providerService?.price ?? 0;

    return Number(price) || 0;
  }, [booking]);

  const formattedPrice = useMemo(() => {
    return bookingPrice.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }, [bookingPrice]);

  /* =========================================================
     STATUS
  ========================================================= */

  const isCompleted = booking?.status === "completed";

  /* =========================================================
     RATING LABEL
  ========================================================= */

  const ratingLabel = useMemo(() => {
    const selectedRating = hoverRating || rating;

    switch (selectedRating) {
      case 1:
        return "Poor";

      case 2:
        return "Fair";

      case 3:
        return "Good";

      case 4:
        return "Very Good";

      case 5:
        return "Excellent";

      default:
        return "Select a rating";
    }
  }, [rating, hoverRating]);

  /* =========================================================
     EXISTING REVIEW DATA
  ========================================================= */

  const existingReviewRating = Number(existingReview?.rating || 0);

  const existingReviewComment =
    existingReview?.comment ||
    existingReview?.message ||
    "No comment provided.";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500 text-white flex items-center justify-center shadow-lg">
                <Star size={24} className="fill-white" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {bookingId ? "Rate & Review" : "My Reviews & Ratings"}
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  {bookingId
                    ? "Share your experience with FIXNEAR"
                    : "Reviews you have submitted for FIXNEAR services"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading || bookingLoading}
              className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60 text-sm font-semibold flex items-center gap-2"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* =====================================================
            REVIEW FORM / BOOKING REVIEW
        ====================================================== */}

        {bookingId && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 mb-8 shadow-sm">
            {/* FORM HEADER */}

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Share Your Experience
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Tell us about your service experience.
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
                <MessageSquare size={22} />
              </div>
            </div>

            {/* =================================================
                BOOKING LOADING
            ================================================== */}

            {bookingLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            )}

            {/* =================================================
                BOOKING ERROR
            ================================================== */}

            {!bookingLoading && bookingError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <div className="flex gap-3">
                  <AlertCircle size={21} className="text-red-600 shrink-0" />

                  <div>
                    <h3 className="font-semibold text-red-800">
                      Unable to load booking
                    </h3>

                    <p className="text-sm text-red-700 mt-1">{bookingError}</p>

                    <button
                      type="button"
                      onClick={() => fetchBooking(true)}
                      className="mt-4 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                BOOKING CONTENT
            ================================================== */}

            {!bookingLoading && !bookingError && booking && (
              <>
                {/* BOOKING SUMMARY */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* SERVICE */}

                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Briefcase size={20} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">Service</p>

                        <p className="font-semibold text-slate-900 truncate">
                          {serviceName}
                        </p>

                        {serviceCategory && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {serviceCategory}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PROVIDER */}

                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      {providerImage ? (
                        <img
                          src={providerImage}
                          alt={providerName}
                          className="w-10 h-10 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                          <User size={20} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">Provider</p>

                        <p className="font-semibold text-slate-900 truncate">
                          {providerName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EXTRA BOOKING INFORMATION */}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {/* DATE */}

                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <CalendarDays size={19} className="text-blue-600" />

                      <div>
                        <p className="text-xs text-slate-400">Booking Date</p>

                        <p className="text-sm font-semibold text-slate-800">
                          {formatDate(booking.bookingDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AMOUNT */}

                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <IndianRupee size={19} className="text-green-600" />

                      <div>
                        <p className="text-xs text-slate-400">Amount</p>

                        <p className="text-sm font-semibold text-slate-800">
                          ₹{formattedPrice}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* LOCATION */}

                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <MapPin size={19} className="text-red-500" />

                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">Location</p>

                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {booking.city || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SUCCESS */}

                {success && (
                  <div className="mb-5 bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2
                        size={20}
                        className="text-green-600 shrink-0"
                      />

                      <p className="text-sm font-medium text-green-700">
                        {success}
                      </p>
                    </div>
                  </div>
                )}

                {/* SUBMIT ERROR */}

                {submitError && (
                  <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex gap-3">
                      <AlertCircle
                        size={20}
                        className="text-red-600 shrink-0"
                      />

                      <p className="text-sm text-red-700">{submitError}</p>
                    </div>
                  </div>
                )}

                {/* =================================================
                      ALREADY REVIEWED
                  ================================================== */}

                {hasReviewed ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={24} />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-green-800">
                          You already reviewed this booking
                        </h3>

                        <p className="text-sm text-green-700 mt-1">
                          Thank you for sharing your experience.
                        </p>

                        <div className="mt-4 bg-white border border-green-200 rounded-xl p-4">
                          <div className="flex items-center gap-2">
                            {renderStars(existingReviewRating)}

                            <span className="text-sm font-semibold text-slate-600">
                              {existingReviewRating}/5
                            </span>
                          </div>

                          <p className="mt-3 text-sm text-slate-600 leading-6">
                            {existingReviewComment}
                          </p>

                          {existingReview?.createdAt && (
                            <p className="text-xs text-slate-400 mt-3">
                              Submitted on{" "}
                              {formatDateTime(existingReview.createdAt)}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate("/my-bookings")}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                        >
                          <ArrowLeft size={17} />
                          Back to My Bookings
                        </button>
                      </div>
                    </div>
                  </div>
                ) : !isCompleted ? (
                  /* =================================================
                       NOT COMPLETED
                    ================================================== */

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <div className="flex gap-3">
                      <AlertCircle
                        size={21}
                        className="text-amber-600 shrink-0"
                      />

                      <div>
                        <h3 className="font-semibold text-amber-800">
                          Review unavailable
                        </h3>

                        <p className="text-sm text-amber-700 mt-1">
                          You can submit a review after this booking has been
                          completed.
                        </p>

                        <p className="text-xs text-amber-600 mt-2">
                          Current booking status:{" "}
                          <span className="font-semibold">
                            {booking.status || "Unknown"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* =================================================
                       REVIEW FORM
                    ================================================== */

                  <form onSubmit={submitReview}>
                    {/* RATING */}

                    <div className="mb-7">
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Your Rating
                      </label>

                      <div className="flex flex-wrap items-center gap-2">
                        <div
                          className="flex items-center gap-1"
                          onMouseLeave={() => setHoverRating(0)}
                        >
                          {RATING_OPTIONS.map((star) => {
                            const active = star <= (hoverRating || rating);

                            return (
                              <button
                                type="button"
                                key={star}
                                aria-label={`Give ${star} out of 5 stars`}
                                onMouseEnter={() => setHoverRating(star)}
                                onFocus={() => setHoverRating(star)}
                                onBlur={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                disabled={submitting}
                                className="p-1.5 rounded-lg hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition disabled:opacity-60"
                              >
                                <Star
                                  size={34}
                                  className={
                                    active
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-slate-300"
                                  }
                                />
                              </button>
                            );
                          })}
                        </div>

                        <span className="ml-2 text-sm font-medium text-slate-600">
                          {ratingLabel}
                        </span>
                      </div>
                    </div>

                    {/* COMMENT */}

                    <div className="mb-6">
                      <label
                        htmlFor="review-comment"
                        className="block text-sm font-semibold text-slate-800 mb-2"
                      >
                        Your Review
                      </label>

                      <textarea
                        id="review-comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={5}
                        maxLength={1000}
                        disabled={submitting}
                        placeholder="Tell us about your experience..."
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />

                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-slate-400">
                          Minimum 3 characters
                        </span>

                        <span
                          className={`text-xs ${
                            comment.length >= 1000
                              ? "text-red-500"
                              : "text-slate-400"
                          }`}
                        >
                          {comment.length}/1000
                        </span>
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(-1)}
                        disabled={submitting}
                        className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <ArrowLeft size={18} />
                        Go Back
                      </button>

                      <button
                        type="submit"
                        disabled={
                          submitting || !rating || comment.trim().length < 3
                        }
                        className="flex-1 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            Submit Review
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        )}

        {/* =====================================================
            MY REVIEWS LOADING
        ====================================================== */}

        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center">
            <Loader2 size={32} className="animate-spin text-blue-600" />

            <p className="mt-4 text-sm text-slate-500">
              Loading your reviews...
            </p>
          </div>
        )}

        {/* =====================================================
            MY REVIEWS ERROR
        ====================================================== */}

        {!loading && error && (
          <div className="bg-white rounded-2xl border border-red-200 p-10 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>

            <h2 className="mt-4 font-semibold text-slate-900">
              Unable to load reviews
            </h2>

            <p className="mt-2 text-sm text-slate-500">{error}</p>

            <button
              type="button"
              onClick={() => fetchReviews(false)}
              className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
            >
              Try Again
            </button>
          </div>
        )}

        {/* =====================================================
            EMPTY REVIEWS
        ====================================================== */}

        {!loading && !error && reviews.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <MessageSquare size={30} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              No reviews yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your submitted reviews will appear here.
            </p>

            <button
              type="button"
              onClick={() => navigate("/my-bookings")}
              className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
            >
              View My Bookings
            </button>
          </div>
        )}

        {/* =====================================================
            REVIEWS LIST
        ====================================================== */}

        {!loading && !error && reviews.length > 0 && (
          <div className="space-y-5">
            {reviews.map((review) => {
              const reviewId =
                review?._id ||
                review?.id ||
                `${getId(review?.booking)}-${review?.createdAt}`;

              const reviewService =
                review?.service?.name ||
                review?.serviceName ||
                review?.service?.title ||
                "Service";

              const reviewProvider =
                review?.provider?.businessName ||
                review?.provider?.name ||
                review?.providerName ||
                "Provider";

              const reviewComment =
                review?.comment || review?.message || "No comment provided.";

              const reviewRating = Number(review?.rating) || 0;

              return (
                <div
                  key={reviewId}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* LEFT */}

                    <div className="flex gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <MessageSquare size={22} />
                      </div>

                      <div className="min-w-0">
                        <h2 className="font-bold text-slate-900">
                          {reviewService}
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                          Provider:{" "}
                          <span className="font-medium text-slate-700">
                            {reviewProvider}
                          </span>
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                          {renderStars(reviewRating)}

                          <span className="text-sm font-semibold text-slate-600">
                            {reviewRating}/5
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* DATE */}

                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(review?.createdAt || review?.date)}
                    </span>
                  </div>

                  {/* COMMENT */}

                  <div className="mt-5 bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-600 leading-6 break-words">
                      {reviewComment}
                    </p>
                  </div>

                  {/* CREATED INFO */}

                  {review?.createdAt && (
                    <p className="text-xs text-slate-400 mt-3">
                      Submitted on {formatDateTime(review.createdAt)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reviews;
