import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Star,
  Loader2,
  RefreshCw,
  MessageSquare,
  User,
  CalendarDays,
  Award,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

const ProviderReviews = () => {
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [error, setError] = useState("");

  // =========================================================
  // HANDLE UNAUTHORIZED USER
  // =========================================================

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("provider");
    localStorage.removeItem("role");

    navigate("/login");
  };

  // =========================================================
  // FETCH PROVIDER PROFILE + REVIEWS
  // =========================================================

  const fetchProviderReviews = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setReviewsLoading(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      // -------------------------------------------------
      // GET LOGGED-IN PROVIDER PROFILE
      // GET /api/providers/my/profile
      // -------------------------------------------------

      const providerResponse = await API.get("/providers/my/profile");

      if (!providerResponse?.data?.success) {
        setError("Unable to load provider profile.");
        return;
      }

      const providerData = providerResponse?.data?.provider;

      if (!providerData) {
        setError("Provider profile was not found.");
        return;
      }

      setProvider(providerData);

      // -------------------------------------------------
      // PROVIDER ID
      // -------------------------------------------------

      const providerId = providerData?._id;

      if (!providerId) {
        setError("Provider ID was not found.");
        return;
      }

      // -------------------------------------------------
      // GET PROVIDER REVIEWS
      // GET /api/reviews/provider/:providerId
      // -------------------------------------------------

      setReviewsLoading(true);

      const reviewsResponse = await API.get(`/reviews/provider/${providerId}`);

      if (reviewsResponse?.data?.success) {
        setReviews(
          Array.isArray(reviewsResponse.data.reviews)
            ? reviewsResponse.data.reviews
            : [],
        );
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error("Provider Reviews Error:", err);

      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(
        err?.response?.data?.message || "Failed to load provider reviews.",
      );
    } finally {
      setLoading(false);
      setReviewsLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchProviderReviews(false);
  }, []);

  // =========================================================
  // REVIEW STATISTICS
  // =========================================================

  const reviewStats = useMemo(() => {
    const validReviews = reviews.filter((review) => {
      const rating = Number(review?.rating);
      return rating >= 1 && rating <= 5;
    });

    const totalReviews = validReviews.length;

    const totalRating = validReviews.reduce(
      (total, review) => total + Number(review.rating),
      0,
    );

    const calculatedAverage =
      totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : "0.0";

    const fiveStarReviews = validReviews.filter(
      (review) => Number(review.rating) === 5,
    ).length;

    const fourStarReviews = validReviews.filter(
      (review) => Number(review.rating) === 4,
    ).length;

    const threeStarReviews = validReviews.filter(
      (review) => Number(review.rating) === 3,
    ).length;

    const twoStarReviews = validReviews.filter(
      (review) => Number(review.rating) === 2,
    ).length;

    const oneStarReviews = validReviews.filter(
      (review) => Number(review.rating) === 1,
    ).length;

    return {
      totalReviews,
      calculatedAverage,
      fiveStarReviews,
      fourStarReviews,
      threeStarReviews,
      twoStarReviews,
      oneStarReviews,
    };
  }, [reviews]);

  const {
    totalReviews,
    calculatedAverage,
    fiveStarReviews,
    fourStarReviews,
    threeStarReviews,
    twoStarReviews,
    oneStarReviews,
  } = reviewStats;

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // STAR COMPONENT
  // =========================================================

  const RatingStars = ({ rating, size = "w-4 h-4" }) => {
    const numericRating = Number(rating || 0);

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= Math.round(numericRating)
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300"
            }`}
          />
        ))}
      </div>
    );
  };

  // =========================================================
  // RATING BAR
  // =========================================================

  const RatingBar = ({ stars, count }) => {
    const percentage =
      totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

    return (
      <div className="flex items-center gap-3">
        <span className="w-10 text-sm text-slate-600">{stars} star</span>

        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>

        <span className="w-8 text-right text-sm text-slate-500">{count}</span>
      </div>
    );
  };

  // =========================================================
  // PROVIDER RATING
  // =========================================================

  const providerRating = Number(provider?.rating);

  const displayedRating =
    providerRating >= 0 && provider?.rating !== undefined
      ? providerRating.toFixed(1)
      : calculatedAverage;

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />

          <h2 className="text-lg font-semibold text-slate-800">
            Loading reviews...
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Fetching your customer reviews
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
                HEADER
            ====================================================== */}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/provider/dashboard"
                title="Back to Provider Dashboard"
                aria-label="Back to Provider Dashboard"
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </Link>

              <div>
                <h1 className="text-xl font-bold text-slate-900">Reviews</h1>

                <p className="text-xs text-slate-500">
                  See what your customers are saying
                </p>
              </div>
            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={() => fetchProviderReviews(true)}
              disabled={reviewsLoading}
              aria-label="Refresh reviews"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${reviewsLoading ? "animate-spin" : ""}`}
              />

              {reviewsLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
                MAIN
            ====================================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* =================================================
                    ERROR
                ================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />

              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">{error}</p>

                <button
                  type="button"
                  onClick={() => fetchProviderReviews(true)}
                  disabled={reviewsLoading}
                  className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-800 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      reviewsLoading ? "animate-spin" : ""
                    }`}
                  />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
                    PAGE HEADING
                ================================================== */}

        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            Customer Feedback
          </p>

          <h2 className="text-3xl font-bold text-slate-900 mt-1">
            Your Reviews
          </h2>

          <p className="text-slate-500 mt-2">
            Customer feedback and ratings from your completed services.
          </p>
        </div>

        {/* =================================================
                    OVERVIEW
                ================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* OVERALL RATING */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">Overall Rating</h3>

                <p className="text-xs text-slate-500">
                  Based on customer reviews
                </p>
              </div>
            </div>

            <div className="flex items-end gap-3">
              <span className="text-5xl font-bold text-slate-900">
                {displayedRating}
              </span>

              <span className="text-slate-500 mb-2">/ 5</span>
            </div>

            <div className="mt-3">
              <RatingStars
                rating={
                  providerRating >= 0 && provider?.rating !== undefined
                    ? providerRating
                    : calculatedAverage
                }
                size="w-5 h-5"
              />
            </div>

            <p className="text-sm text-slate-500 mt-4">
              {totalReviews} customer{" "}
              {totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>

          {/* TOTAL REVIEWS */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">Total Reviews</h3>

                <p className="text-xs text-slate-500">
                  Customer feedback received
                </p>
              </div>
            </div>

            <p className="text-5xl font-bold text-slate-900">{totalReviews}</p>

            <div className="flex items-center gap-2 mt-4 text-sm text-emerald-600">
              <TrendingUp className="w-4 h-4" />

              <span>Keep delivering great service</span>
            </div>
          </div>

          {/* FIVE STAR REVIEWS */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Star className="w-5 h-5 text-emerald-600 fill-emerald-600" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">5-Star Reviews</h3>

                <p className="text-xs text-slate-500">
                  Excellent customer ratings
                </p>
              </div>
            </div>

            <p className="text-5xl font-bold text-slate-900">
              {fiveStarReviews}
            </p>

            <p className="text-sm text-slate-500 mt-4">
              {totalReviews > 0
                ? Math.round((fiveStarReviews / totalReviews) * 100)
                : 0}
              % of all reviews
            </p>
          </div>
        </div>

        {/* =================================================
                    RATING DISTRIBUTION
                ================================================== */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">Rating Distribution</h3>

              <p className="text-xs text-slate-500">
                Breakdown of your customer ratings
              </p>
            </div>
          </div>

          <div className="max-w-2xl space-y-4">
            <RatingBar stars={5} count={fiveStarReviews} />

            <RatingBar stars={4} count={fourStarReviews} />

            <RatingBar stars={3} count={threeStarReviews} />

            <RatingBar stars={2} count={twoStarReviews} />

            <RatingBar stars={1} count={oneStarReviews} />
          </div>
        </div>

        {/* =================================================
                    CUSTOMER REVIEWS
                ================================================== */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* SECTION HEADER */}

          <div className="px-6 py-5 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              Customer Reviews
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Recent feedback from your customers
            </p>
          </div>

          {/* REVIEW LOADING */}

          {reviewsLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />

              <p className="text-sm text-slate-500">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            /* =================================================
                           NO REVIEWS
                        ================================================== */

            <div className="py-16 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-slate-400" />
              </div>

              <h4 className="text-lg font-semibold text-slate-800">
                No reviews yet
              </h4>

              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Once your customers complete services and leave reviews, their
                feedback will appear here.
              </p>

              <button
                type="button"
                onClick={() => fetchProviderReviews(true)}
                disabled={reviewsLoading}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${reviewsLoading ? "animate-spin" : ""}`}
                />
                Refresh Reviews
              </button>
            </div>
          ) : (
            /* =================================================
                           REVIEWS LIST
                        ================================================== */

            <div className="divide-y divide-slate-100">
              {reviews.map((review) => {
                const customerName =
                  review?.customer?.name ||
                  review?.customer?.fullName ||
                  review?.customer?.username ||
                  "Customer";

                const bookingDate = review?.booking?.bookingDate;

                const rating = Number(review?.rating || 0);

                return (
                  <div
                    key={review?._id}
                    className="p-6 hover:bg-slate-50 transition"
                  >
                    {/* =================================================
                                            TOP SECTION
                                        ================================================== */}

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                      {/* CUSTOMER */}

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                          {review?.customer?.profileImage ? (
                            <img
                              src={review.customer.profileImage}
                              alt={customerName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-blue-600" />
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {customerName}
                          </h4>

                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <RatingStars rating={rating} />

                            <span className="text-xs text-slate-400">
                              {formatDate(review?.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* RATING */}

                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold w-fit">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        {rating}/5
                      </div>
                    </div>

                    {/* =================================================
                                            COMMENT
                                        ================================================== */}

                    <div className="mt-5 ml-0 sm:ml-16">
                      <p className="text-slate-700 leading-7">
                        "{review?.comment || "No comment provided."}"
                      </p>

                      {/* =================================================
                                                SERVICE
                                            ================================================== */}

                      {review?.service && (
                        <div className="flex flex-wrap items-center gap-3 mt-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                            <MessageSquare className="w-3.5 h-3.5" />

                            {review.service?.name || "Service"}
                          </span>

                          {review.service?.category && (
                            <span className="text-xs text-slate-500">
                              {review.service.category}
                            </span>
                          )}
                        </div>
                      )}

                      {/* =================================================
                                                BOOKING DATE
                                            ================================================== */}

                      {bookingDate && (
                        <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
                          <CalendarDays className="w-4 h-4" />
                          Service date: {formatDate(bookingDate)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProviderReviews;
