import { useEffect, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  User,
  Briefcase,
  IndianRupee,
  Calendar,
  Heart,
  MessageSquare,
  RefreshCw,
  Mail,
  Pencil,
} from "lucide-react";

import API from "../services/api";

function ProviderProfile() {
  const navigate = useNavigate();
  const locationPath = useLocation();

  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [error, setError] = useState("");
  const [servicesError, setServicesError] = useState("");
  const [reviewsError, setReviewsError] = useState("");

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // ============================================================
  // CHECK WHETHER THIS IS PROVIDER'S OWN PROFILE
  // ============================================================

  const isOwnProviderProfile = locationPath.pathname === "/provider/profile";

  // ============================================================
  // GET USER ROLE
  // ============================================================

  const getUserRole = () => {
    try {
      const possibleRoleKeys = ["role", "userRole", "currentUserRole"];

      for (const key of possibleRoleKeys) {
        const storedRole = localStorage.getItem(key);

        if (storedRole) {
          return storedRole.toLowerCase().trim();
        }
      }

      const possibleUserKeys = ["user", "currentUser", "authUser"];

      for (const key of possibleUserKeys) {
        const user = localStorage.getItem(key);

        if (user) {
          try {
            const parsedUser = JSON.parse(user);

            const role =
              parsedUser?.role ||
              parsedUser?.user?.role ||
              parsedUser?.data?.role;

            if (role) {
              return String(role).toLowerCase().trim();
            }
          } catch (parseError) {
            console.error(`Unable to parse ${key}:`, parseError);
          }
        }
      }

      return "";
    } catch (error) {
      console.error("Role error:", error);
      return "";
    }
  };

  const userRole = getUserRole();

  const isCustomer = userRole === "customer";

  // ============================================================
  // FAVORITE IS ALLOWED ONLY FOR CUSTOMER ON OTHER PROVIDER
  // ============================================================

  const canFavorite = isCustomer && !isOwnProviderProfile;

  // ============================================================
  // FETCH PROVIDER PROFILE
  // ============================================================

  const fetchProviderProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/providers/my/profile");

      console.log("Provider profile response:", response.data);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load provider profile.",
        );
      }

      const providerData = response.data?.provider || response.data?.data;

      if (!providerData) {
        throw new Error("Provider profile data not found.");
      }

      setProvider(providerData);

      const providerId = providerData?._id;

      if (!providerId) {
        throw new Error("Provider ID not found.");
      }

      // Load services and reviews together
      await Promise.all([
        fetchProviderServices(providerId),
        fetchProviderReviews(providerId),
      ]);

      // Only customers viewing another provider
      // need favorite status
      if (canFavorite) {
        await checkFavoriteStatus(providerId);
      } else {
        setIsFavorite(false);
      }
    } catch (error) {
      console.error("Provider profile error:", error);

      if (error?.response?.status === 401) {
        setError("Please login to view this provider profile.");
      } else {
        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load provider profile.",
        );
      }

      setServicesLoading(false);
      setReviewsLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FETCH PROVIDER SERVICES
  // ============================================================

  const fetchProviderServices = async (providerId) => {
    if (!providerId) {
      setServicesLoading(false);
      return;
    }

    try {
      setServicesLoading(true);
      setServicesError("");

      const response = await API.get(
        `/providers/services/provider/${providerId}`,
      );

      console.log("Provider services response:", response.data);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load provider services.",
        );
      }

      const serviceList = response.data?.services || response.data?.data || [];

      setServices(Array.isArray(serviceList) ? serviceList : []);
    } catch (error) {
      console.error("Provider services error:", error);

      setServicesError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load provider services.",
      );

      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  // ============================================================
  // FETCH PROVIDER REVIEWS
  // ============================================================

  const fetchProviderReviews = async (providerId) => {
    if (!providerId) {
      setReviewsLoading(false);
      return;
    }

    try {
      setReviewsLoading(true);
      setReviewsError("");

      const response = await API.get(`/reviews/provider/${providerId}`);

      console.log("Provider reviews response:", response.data);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to load provider reviews.",
        );
      }

      const reviewList = response.data?.reviews || response.data?.data || [];

      setReviews(Array.isArray(reviewList) ? reviewList : []);

      // ========================================================
      // UPDATE PROVIDER RATING + TOTAL REVIEWS
      // ========================================================

      setProvider((currentProvider) => {
        if (!currentProvider) {
          return currentProvider;
        }

        const newRating =
          response.data?.rating ??
          response.data?.averageRating ??
          currentProvider?.rating ??
          0;

        const newTotalReviews =
          response.data?.totalReviews ??
          response.data?.count ??
          (Array.isArray(reviewList)
            ? reviewList.length
            : (currentProvider?.totalReviews ?? 0));

        return {
          ...currentProvider,
          rating: Number(newRating) || 0,
          totalReviews: Number(newTotalReviews) || 0,
        };
      });
    } catch (error) {
      console.error("Provider reviews error:", error);

      setReviewsError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load provider reviews.",
      );

      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // ============================================================
  // CHECK FAVORITE STATUS
  // ============================================================

  const checkFavoriteStatus = async (providerId) => {
    if (!providerId || !canFavorite) {
      return;
    }

    try {
      const response = await API.get(`/favorites/check/${providerId}`);

      console.log("Favorite status:", response.data);

      if (response.data?.success) {
        setIsFavorite(Boolean(response.data?.isFavorite));
      }
    } catch (error) {
      console.error("Favorite check error:", error);

      setIsFavorite(false);
    }
  };

  // ============================================================
  // TOGGLE FAVORITE
  // ============================================================

  const toggleFavorite = async () => {
    if (favoriteLoading) {
      return;
    }

    // Favorite functionality is only for customers
    // viewing another provider
    if (!canFavorite) {
      return;
    }

    if (!provider?._id) {
      alert("Provider information is not available.");
      return;
    }

    try {
      setFavoriteLoading(true);

      // ========================================================
      // REMOVE FAVORITE
      // ========================================================

      if (isFavorite) {
        const response = await API.delete(`/favorites/${provider._id}`);

        console.log("Remove favorite:", response.data);

        if (response.data?.success) {
          setIsFavorite(false);
        }
      }

      // ========================================================
      // ADD FAVORITE
      // ========================================================
      else {
        const response = await API.post("/favorites", {
          provider: provider._id,
        });

        console.log("Add favorite:", response.data);

        if (response.data?.success) {
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error("Favorite error:", error);

      if (error?.response?.status === 401) {
        navigate("/login");
        return;
      }

      alert(error?.response?.data?.message || "Unable to update favorite.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchProviderProfile();
  }, []);

  // ============================================================
  // FORMAT REVIEW DATE
  // ============================================================

  const formatReviewDate = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // CUSTOMER NAME
  // ============================================================

  const getCustomerName = (review) => {
    return (
      review?.customer?.name ||
      review?.customer?.fullName ||
      review?.customer?.username ||
      "Customer"
    );
  };

  // ============================================================
  // CUSTOMER IMAGE
  // ============================================================

  const getCustomerImage = (review) => {
    return review?.customer?.profileImage || review?.customer?.image || "";
  };

  // ============================================================
  // REVIEW SERVICE NAME
  // ============================================================

  const getReviewServiceName = (review) => {
    return (
      review?.service?.name ||
      review?.service?.title ||
      review?.service?.serviceName ||
      "Service"
    );
  };

  // ============================================================
  // SERVICE PRICE
  // ============================================================

  const getServicePrice = (providerService) => {
    if (
      providerService?.price !== undefined &&
      providerService?.price !== null
    ) {
      return providerService.price;
    }

    if (
      providerService?.basePrice !== undefined &&
      providerService?.basePrice !== null
    ) {
      return providerService.basePrice;
    }

    if (
      providerService?.providerPrice !== undefined &&
      providerService?.providerPrice !== null
    ) {
      return providerService.providerPrice;
    }

    return null;
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

          <h2 className="mt-5 text-xl font-semibold text-slate-800">
            Loading provider profile...
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Please wait while we load the profile.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <User size={30} className="text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mt-5">
            Unable to Load Profile
          </h1>

          <p className="text-red-600 mt-3">
            {error || "Provider profile not found."}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={fetchProviderProfile}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition"
            >
              Try Again
            </button>

            <Link
              to="/provider/dashboard"
              className="px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // PROVIDER DATA
  // ============================================================

  const providerName = provider?.businessName || provider?.name || "Provider";

  const ownerName =
    provider?.user?.name ||
    provider?.user?.fullName ||
    provider?.user?.username ||
    "Provider";

  const email = provider?.user?.email || provider?.email || "";

  const phone = provider?.phone || provider?.user?.phone || "";

  const city = provider?.city || "";
  const state = provider?.state || "";
  const pincode = provider?.pincode || "";
  const address = provider?.address || "";

  const location = [city, state].filter(Boolean).join(", ");

  const fullAddress = [address, city, state, pincode]
    .filter(Boolean)
    .join(", ");

  const rating = Number(provider?.rating || 0);

  const totalReviews = Number(provider?.totalReviews || reviews.length || 0);

  const experience = Number(provider?.experience || 0);

  const completedBookings = Number(provider?.completedBookings || 0);

  const isAvailable = provider?.isAvailable !== false;

  const isVerified = provider?.isVerified === true;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* BACK */}

          <Link
            to="/provider/dashboard"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>

          <div className="mt-8 flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* PROFILE IMAGE */}

            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-blue-600 flex items-center justify-center shrink-0">
              {provider?.profileImage ? (
                <img
                  src={provider.profileImage}
                  alt={providerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={52} />
              )}
            </div>

            {/* PROFILE INFO */}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold">
                  {providerName}
                </h1>

                {isVerified && (
                  <CheckCircle2 size={25} className="text-blue-400" />
                )}
              </div>

              <p className="mt-2 text-slate-300">{ownerName}</p>

              <div className="flex flex-wrap items-center gap-5 mt-4">
                {/* RATING */}

                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={17}
                        className={
                          star <= Math.round(rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-500"
                        }
                      />
                    ))}
                  </div>

                  <span className="font-semibold">{rating.toFixed(1)}</span>

                  <span className="text-slate-400">
                    ({totalReviews} reviews)
                  </span>
                </div>

                {/* LOCATION */}

                {location && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin size={17} />
                    <span>{location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* =================================================
                EDIT PROFILE BUTTON
                ONLY PROVIDER'S OWN PROFILE
            ================================================= */}

            {isOwnProviderProfile && (
              <Link
                to="/provider/edit-profile"
                className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold border border-white/20 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 shadow-sm"
              >
                <Pencil size={18} />
                Edit Profile
              </Link>
            )}

            {/* =================================================
                FAVORITE BUTTON
                ONLY CUSTOMER + NOT OWN PROFILE
            ================================================= */}

            {canFavorite && (
              <button
                type="button"
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                title={
                  isFavorite ? "Remove from Favorites" : "Add to Favorites"
                }
                className={`
                  group
                  shrink-0
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  px-5
                  py-3
                  rounded-xl
                  font-semibold
                  transition-all
                  duration-200
                  border
                  ${
                    isFavorite
                      ? "bg-red-500 text-white border-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/40"
                  }
                  ${favoriteLoading ? "opacity-60 cursor-not-allowed" : ""}
                `}
              >
                <Heart
                  size={20}
                  className={
                    isFavorite
                      ? "fill-current"
                      : "group-hover:scale-110 transition-transform"
                  }
                />

                <span className="hidden sm:inline">
                  {favoriteLoading
                    ? "Updating..."
                    : isFavorite
                      ? "Favorited"
                      : "Add to Favorites"}
                </span>
              </button>
            )}

            {/* AVAILABILITY */}

            <div
              className={`
                px-4 py-2 rounded-full text-sm font-semibold shrink-0
                ${
                  isAvailable
                    ? "bg-green-500/20 text-green-300"
                    : "bg-red-500/20 text-red-300"
                }
              `}
            >
              {isAvailable ? "Available" : "Unavailable"}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <div className="lg:col-span-2 space-y-6">
            {/* =================================================
                ABOUT
            ================================================= */}

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <Award size={24} className="text-blue-600" />

                <h2 className="text-xl font-bold text-slate-900">
                  About Business
                </h2>
              </div>

              <p className="mt-4 text-slate-600 leading-7">
                {provider?.description ||
                  "No business description has been added yet."}
              </p>
            </section>

            {/* =================================================
                SERVICES
            ================================================= */}

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Briefcase size={24} className="text-blue-600" />

                  <h2 className="text-xl font-bold text-slate-900">Services</h2>
                </div>

                <span className="text-sm text-slate-500">
                  {services.length}{" "}
                  {services.length === 1 ? "service" : "services"}
                </span>
              </div>

              {/* SERVICES LOADING */}

              {servicesLoading && (
                <div className="py-10 text-center">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

                  <p className="mt-4 text-sm text-slate-500">
                    Loading services...
                  </p>
                </div>
              )}

              {/* SERVICES ERROR */}

              {!servicesLoading && servicesError && (
                <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-600">{servicesError}</p>

                  <button
                    type="button"
                    onClick={() => fetchProviderServices(provider._id)}
                    className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* NO SERVICES */}

              {!servicesLoading && !servicesError && services.length === 0 && (
                <div className="mt-5 border border-dashed border-slate-300 rounded-xl p-8 text-center">
                  <Briefcase size={40} className="mx-auto text-slate-400" />

                  <h3 className="mt-4 font-semibold text-slate-800">
                    No services available
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    This provider has not added any active services yet.
                  </p>
                </div>
              )}

              {/* SERVICES LIST */}

              {!servicesLoading && !servicesError && services.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  {services.map((providerService) => {
                    const service = providerService?.service || {};

                    const serviceName =
                      service?.name ||
                      service?.title ||
                      providerService?.name ||
                      "Service";

                    const category =
                      service?.category || providerService?.category || "";

                    const description =
                      providerService?.description ||
                      service?.description ||
                      "No service description available.";

                    const price = getServicePrice(providerService);

                    const providerServiceId = providerService?._id;

                    const serviceId = service?._id || service?.id;

                    return (
                      <div
                        key={providerServiceId || serviceId}
                        className="border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition"
                      >
                        {/* SERVICE IMAGE */}

                        {service?.image && (
                          <div className="h-40 rounded-xl overflow-hidden mb-4 bg-slate-100">
                            <img
                              src={service.image}
                              alt={serviceName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* SERVICE NAME */}

                        <h3 className="text-lg font-bold text-slate-900">
                          {serviceName}
                        </h3>

                        {/* CATEGORY */}

                        {category && (
                          <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                            {category}
                          </span>
                        )}

                        {/* DESCRIPTION */}

                        <p className="mt-3 text-sm text-slate-600 leading-6 line-clamp-3">
                          {description}
                        </p>

                        {/* PRICE + BOOK */}

                        <div className="flex items-center justify-between gap-3 mt-5">
                          <div>
                            {price !== null ? (
                              <div className="flex items-center gap-1 text-slate-900">
                                <IndianRupee size={17} />

                                <span className="text-xl font-bold">
                                  {price}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm font-medium text-slate-500">
                                Price on request
                              </span>
                            )}
                          </div>

                          {/* BOOKING LINK */}

                          {serviceId ? (
                            <Link
                              to={`/booking/${provider._id}/${serviceId}?providerService=${providerServiceId}`}
                              className={`
                                    inline-flex
                                    items-center
                                    gap-2
                                    px-4
                                    py-2.5
                                    rounded-xl
                                    font-semibold
                                    text-sm
                                    transition
                                    ${
                                      isAvailable
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-slate-200 text-slate-500 pointer-events-none"
                                    }
                                  `}
                            >
                              <Calendar size={16} />

                              {isAvailable ? "Book Now" : "Unavailable"}
                            </Link>
                          ) : (
                            <span className="text-sm text-red-500">
                              Service unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* =================================================
                REVIEWS
            ================================================= */}

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              {/* REVIEW HEADER */}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <MessageSquare size={24} className="text-blue-600" />

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Customer Reviews
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      {totalReviews}{" "}
                      {totalReviews === 1
                        ? "customer review"
                        : "customer reviews"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fetchProviderReviews(provider._id)}
                  disabled={reviewsLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={reviewsLoading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              {/* RATING SUMMARY */}

              <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="text-center sm:text-left">
                    <p className="text-4xl font-bold text-slate-900">
                      {rating.toFixed(1)}
                    </p>

                    <div className="flex justify-center sm:justify-start mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          className={
                            star <= Math.round(rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-slate-300"
                          }
                        />
                      ))}
                    </div>

                    <p className="text-sm text-slate-500 mt-2">
                      Based on {totalReviews}{" "}
                      {totalReviews === 1 ? "review" : "reviews"}
                    </p>
                  </div>

                  <div className="hidden sm:block h-16 w-px bg-slate-200" />

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Provider rating
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      Ratings are calculated from visible customer reviews.
                    </p>
                  </div>
                </div>
              </div>

              {/* REVIEWS LOADING */}

              {reviewsLoading && (
                <div className="py-12 text-center">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

                  <p className="mt-4 text-sm text-slate-500">
                    Loading customer reviews...
                  </p>
                </div>
              )}

              {/* REVIEWS ERROR */}

              {!reviewsLoading && reviewsError && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
                  <p className="text-sm text-red-600">{reviewsError}</p>

                  <button
                    type="button"
                    onClick={() => fetchProviderReviews(provider._id)}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <RefreshCw size={15} />
                    Try Again
                  </button>
                </div>
              )}

              {/* NO REVIEWS */}

              {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                <div className="mt-6 border border-dashed border-slate-300 rounded-xl p-10 text-center">
                  <Star size={42} className="mx-auto text-slate-300" />

                  <h3 className="mt-4 text-lg font-semibold text-slate-800">
                    No reviews yet
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Customers can leave a review after completing a booking.
                  </p>
                </div>
              )}

              {/* REVIEWS LIST */}

              {!reviewsLoading && !reviewsError && reviews.length > 0 && (
                <div className="mt-6 space-y-4">
                  {reviews.map((review) => {
                    const customerName = getCustomerName(review);

                    const customerImage = getCustomerImage(review);

                    const serviceName = getReviewServiceName(review);

                    const reviewRating = Number(review?.rating || 0);

                    return (
                      <article
                        key={review?._id}
                        className="border border-slate-200 rounded-2xl p-5"
                      >
                        {/* CUSTOMER + DATE */}

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* CUSTOMER IMAGE */}

                            <div className="w-11 h-11 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center shrink-0">
                              {customerImage ? (
                                <img
                                  src={customerImage}
                                  alt={customerName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={20} className="text-blue-600" />
                              )}
                            </div>

                            {/* CUSTOMER DETAILS */}

                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-900 truncate">
                                {customerName}
                              </h3>

                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={15}
                                      className={
                                        star <= reviewRating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-slate-300"
                                      }
                                    />
                                  ))}
                                </div>

                                <span className="text-xs text-slate-500">
                                  {reviewRating}/5
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* REVIEW DATE */}

                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {formatReviewDate(review?.createdAt)}
                          </span>
                        </div>

                        {/* SERVICE */}

                        <div className="mt-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                            {serviceName}
                          </span>
                        </div>

                        {/* COMMENT */}

                        <p className="mt-4 text-slate-600 leading-7 break-words">
                          {review?.comment || "No comment provided."}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* =================================================
                STATISTICS
            ================================================= */}

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Provider Statistics
              </h2>

              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                {/* EXPERIENCE */}

                <div className="bg-slate-50 rounded-xl p-5">
                  <Award size={24} className="text-blue-600" />

                  <p className="text-2xl font-bold text-slate-900 mt-3">
                    {experience}
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    Years Experience
                  </p>
                </div>

                {/* COMPLETED */}

                <div className="bg-slate-50 rounded-xl p-5">
                  <CheckCircle2 size={24} className="text-green-600" />

                  <p className="text-2xl font-bold text-slate-900 mt-3">
                    {completedBookings}
                  </p>

                  <p className="text-sm text-slate-500 mt-1">Jobs Completed</p>
                </div>

                {/* REVIEWS */}

                <div className="bg-slate-50 rounded-xl p-5">
                  <Star size={24} className="text-yellow-500" />

                  <p className="text-2xl font-bold text-slate-900 mt-3">
                    {totalReviews}
                  </p>

                  <p className="text-sm text-slate-500 mt-1">Total Reviews</p>
                </div>
              </div>
            </section>

            {/* =================================================
                SERVICE AREA
            ================================================= */}

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <MapPin size={24} className="text-blue-600" />

                <h2 className="text-xl font-bold text-slate-900">
                  Service Area
                </h2>
              </div>

              <div className="mt-5 space-y-2">
                {address && (
                  <p className="text-slate-700">
                    <strong>Address:</strong> {address}
                  </p>
                )}

                {location && (
                  <p className="text-slate-700">
                    <strong>Location:</strong> {location}
                  </p>
                )}

                {pincode && (
                  <p className="text-slate-700">
                    <strong>Pincode:</strong> {pincode}
                  </p>
                )}

                {!fullAddress && (
                  <p className="text-slate-500">Service area not specified.</p>
                )}
              </div>
            </section>

            {/* =================================================
                VERIFICATION
            ================================================= */}

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  size={24}
                  className={isVerified ? "text-green-600" : "text-orange-500"}
                />

                <h2 className="text-xl font-bold text-slate-900">
                  Verification
                </h2>
              </div>

              <div className="mt-4">
                {isVerified ? (
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle2 size={20} />

                    <span className="font-medium">
                      Your provider account is verified.
                    </span>
                  </div>
                ) : (
                  <p className="text-orange-600">
                    Your provider account is waiting for verification.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* ==================================================
              RIGHT SIDE
          ================================================== */}

          <div className="space-y-6">
            {/* =================================================
                CONTACT INFORMATION
            ================================================= */}

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Phone size={20} className="text-blue-600" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Contact Information
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Get in touch with this provider
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {/* PHONE */}

                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 transition group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <Phone size={18} className="text-green-600" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Phone</p>

                      <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition">
                        {phone}
                      </p>
                    </div>
                  </a>
                )}

                {/* EMAIL */}

                {email && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Mail size={18} className="text-blue-600" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Email</p>

                      <p className="font-semibold text-slate-800 break-all text-sm">
                        {email}
                      </p>
                    </div>
                  </div>
                )}

                {/* LOCATION */}

                {location && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-purple-600" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Location</p>

                      <p className="font-semibold text-slate-800">{location}</p>

                      {pincode && (
                        <p className="text-sm text-slate-500 mt-1">
                          Pincode: {pincode}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* NO CONTACT */}

                {!phone && !email && !location && (
                  <div className="text-center py-5">
                    <Phone size={30} className="mx-auto text-slate-300" />

                    <p className="mt-3 text-sm text-slate-500">
                      Contact information not available.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* =================================================
                CURRENT STATUS
            ================================================= */}

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Clock3 size={20} className="text-blue-600" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Current Status
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Provider availability
                  </p>
                </div>
              </div>

              <div
                className={`
                  mt-6 flex items-center gap-4 p-4 rounded-xl border
                  ${
                    isAvailable
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }
                `}
              >
                <div
                  className={`
                    w-11 h-11 rounded-full flex items-center justify-center
                    ${isAvailable ? "bg-green-100" : "bg-red-100"}
                  `}
                >
                  <span
                    className={`
                      w-3.5 h-3.5 rounded-full
                      ${isAvailable ? "bg-green-500" : "bg-red-500"}
                    `}
                  />
                </div>

                <div>
                  <p
                    className={`
                      font-bold
                      ${isAvailable ? "text-green-700" : "text-red-700"}
                    `}
                  >
                    {isAvailable ? "Available" : "Currently Unavailable"}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    {isAvailable
                      ? "Accepting new bookings"
                      : "Not accepting bookings right now"}
                  </p>
                </div>
              </div>
            </section>

            {/* =================================================
                QUICK INFORMATION
            ================================================= */}

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <Award size={20} className="text-yellow-600" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Quick Information
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Provider performance
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {/* RATING */}

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Star
                      size={19}
                      className="text-yellow-500 fill-yellow-400"
                    />

                    <span className="text-sm font-medium text-slate-700">
                      Rating
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      {rating.toFixed(1)}
                    </p>

                    <p className="text-xs text-slate-500">
                      {totalReviews} reviews
                    </p>
                  </div>
                </div>

                {/* EXPERIENCE */}

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Award size={19} className="text-blue-600" />

                    <span className="text-sm font-medium text-slate-700">
                      Experience
                    </span>
                  </div>

                  <p className="font-bold text-slate-900">
                    {experience} {experience === 1 ? "Year" : "Years"}
                  </p>
                </div>

                {/* JOBS COMPLETED */}

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={19} className="text-green-600" />

                    <span className="text-sm font-medium text-slate-700">
                      Jobs Completed
                    </span>
                  </div>

                  <p className="font-bold text-slate-900">
                    {completedBookings}
                  </p>
                </div>

                {/* SERVICES */}

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Briefcase size={19} className="text-purple-600" />

                    <span className="text-sm font-medium text-slate-700">
                      Services
                    </span>
                  </div>

                  <p className="font-bold text-slate-900">{services.length}</p>
                </div>
              </div>
            </section>

            {/* =================================================
                FAVORITE PROVIDER
                ONLY CUSTOMER + OTHER PROVIDER
            ================================================= */}

            {canFavorite && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      w-10 h-10 rounded-xl flex items-center justify-center
                      ${isFavorite ? "bg-red-50" : "bg-blue-50"}
                    `}
                  >
                    <Heart
                      size={20}
                      className={
                        isFavorite
                          ? "text-red-500 fill-red-500"
                          : "text-blue-600"
                      }
                    />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Favorite Provider
                    </h2>

                    <p className="text-xs text-slate-500 mt-1">
                      Save this provider for later
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm text-slate-600 leading-6">
                    {isFavorite
                      ? "This provider is saved in your favorites. You can easily find them again later."
                      : "Save this provider to quickly find and book their services later."}
                  </p>

                  <button
                    type="button"
                    onClick={toggleFavorite}
                    disabled={favoriteLoading}
                    className={`
                      mt-5
                      w-full
                      py-3
                      rounded-xl
                      font-semibold
                      transition
                      ${
                        isFavorite
                          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }
                      ${favoriteLoading ? "opacity-60 cursor-not-allowed" : ""}
                    `}
                  >
                    {favoriteLoading
                      ? "Updating..."
                      : isFavorite
                        ? "Remove from Favorites"
                        : "Add to Favorites"}
                  </button>
                </div>
              </section>
            )}

            {/* =================================================
                VERIFICATION STATUS
            ================================================= */}

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    ${isVerified ? "bg-green-50" : "bg-orange-50"}
                  `}
                >
                  <ShieldCheck
                    size={20}
                    className={
                      isVerified ? "text-green-600" : "text-orange-500"
                    }
                  />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Verification
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Account verification status
                  </p>
                </div>
              </div>

              <div className="mt-5">
                {isVerified ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                    <CheckCircle2
                      size={21}
                      className="text-green-600 shrink-0"
                    />

                    <div>
                      <p className="font-semibold text-green-700">
                        Verified Provider
                      </p>

                      <p className="text-xs text-green-600 mt-1">
                        This provider account has been verified.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200">
                    <ShieldCheck
                      size={21}
                      className="text-orange-500 shrink-0"
                    />

                    <div>
                      <p className="font-semibold text-orange-700">
                        Verification Pending
                      </p>

                      <p className="text-xs text-orange-600 mt-1">
                        This provider account is waiting for verification.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* =================================================
                DASHBOARD BUTTON
            ================================================= */}

            <Link
              to="/provider/dashboard"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold transition shadow-sm"
            >
              <Briefcase size={18} />
              Go to Provider Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProviderProfile;
