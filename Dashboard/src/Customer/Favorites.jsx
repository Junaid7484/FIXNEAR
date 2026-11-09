import { useCallback, useEffect, useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import {
  Heart,
  MapPin,
  Star,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  User,
  BriefcaseBusiness,
  CheckCircle2,
  Search,
  X,
  Loader2,
} from "lucide-react";

import API from "../services/api";

function Favorites() {
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [search, setSearch] = useState("");

  // GET MY FAVORITES
  const fetchFavorites = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await API.get("/favorites/my");

        const receivedFavorites =
          response?.data?.favorites ?? response?.data?.data ?? [];

        setFavorites(Array.isArray(receivedFavorites) ? receivedFavorites : []);
      } catch (err) {
        console.error("Fetch Favorites Error:", err);

        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          navigate("/login");
          return;
        }

        setError(
          err?.response?.data?.message || "Failed to load your favorites.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate],
  );

  // LOAD FAVORITES ON PAGE OPEN
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // GET PROVIDER
  const getProvider = (favorite) => {
    const provider = favorite?.provider;

    return provider && typeof provider === "object" ? provider : null;
  };

  // GET PROVIDER SERVICE
  const getProviderService = (favorite) => {
    const service = favorite?.providerService;

    return service && typeof service === "object" ? service : null;
  };

  // GET PROVIDER ID
  const getProviderId = (favorite) => {
    const provider = favorite?.provider;

    if (provider && typeof provider === "object") {
      return provider._id || null;
    }

    return typeof provider === "string" ? provider : null;
  };

  // GET SERVICE ID
  const getProviderServiceId = (favorite) => {
    const service = favorite?.providerService;

    if (service && typeof service === "object") {
      return service._id || null;
    }

    return typeof service === "string" ? service : null;
  };

  // GET PROVIDER NAME
  const getProviderName = (provider) =>
    provider?.businessName ||
    provider?.user?.name ||
    provider?.name ||
    "Service Provider";

  // GET OWNER NAME
  const getOwnerName = (provider) =>
    provider?.user?.name || provider?.ownerName || provider?.name || "Provider";

  // GET PROVIDER IMAGE
  const getProviderImage = (provider) => {
    const image = provider?.profileImage || provider?.user?.profileImage;

    if (typeof image === "string") {
      return image;
    }

    return image?.url || image?.secure_url || "";
  };

  // GET LOCATION
  const getLocation = (provider) => {
    const parts = [
      provider?.address,
      provider?.city,
      provider?.state,
      provider?.pincode,
    ].filter(Boolean);

    return parts.length ? parts.join(", ") : "Location not available";
  };

  // GET EXPERIENCE
  const getExperience = (provider) => {
    if (
      provider?.experience === undefined ||
      provider?.experience === null ||
      provider?.experience === ""
    ) {
      return "Experience not specified";
    }

    const experience = Number(provider.experience);

    if (!Number.isFinite(experience)) {
      return "Experience not specified";
    }

    return `${experience} ${experience === 1 ? "year" : "years"} experience`;
  };

  // GET RATING
  const getRating = (provider) => {
    const rating = Number(provider?.rating ?? 0);

    return Number.isFinite(rating) ? rating.toFixed(1) : "0.0";
  };

  // GET REVIEW COUNT
  const getReviewCount = (provider) => {
    const reviews = Number(provider?.totalReviews ?? 0);

    return Number.isFinite(reviews) ? reviews : 0;
  };

  // GET SERVICE NAME
  const getServiceName = (service) =>
    service?.serviceName || service?.title || service?.name || "Saved service";

  // SEARCH FAVORITES
  const filteredFavorites = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return favorites;
    }

    return favorites.filter((favorite) => {
      const provider = getProvider(favorite);
      const service = getProviderService(favorite);

      if (!provider) {
        return false;
      }

      const searchableText = [
        getProviderName(provider),
        getOwnerName(provider),
        getLocation(provider),
        getServiceName(service),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchValue);
    });
  }, [favorites, search]);

  // CLEAR SEARCH
  const clearSearch = () => {
    setSearch("");
  };

  // REMOVE FAVORITE SERVICE
  const removeFavorite = async (providerId, providerServiceId) => {
    if (!providerId || !providerServiceId) {
      setError("Provider or service ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this service from your favorites?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingId(providerServiceId);
      setError("");

      const response = await API.delete(
        `/favorites/${providerId}/${providerServiceId}`,
      );

      if (response?.data?.success) {
        setFavorites((currentFavorites) =>
          currentFavorites.filter(
            (favorite) =>
              String(getProviderServiceId(favorite)) !==
              String(providerServiceId),
          ),
        );
      }
    } catch (err) {
      console.error("Remove Favorite Error:", err);

      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        navigate("/login");
        return;
      }

      setError(
        err?.response?.data?.message || "Failed to remove favorite service.",
      );
    } finally {
      setRemovingId(null);
    }
  };

  // LOADING SCREEN
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
            <Heart
              size={28}
              className="text-red-500 fill-red-500 animate-pulse"
            />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Loading your favorites...
            </h2>
            <p className="text-sm text-slate-500 mt-1">Please wait a moment.</p>
          </div>
        </div>
      </div>
    );
  }

  // ERROR SCREEN
  if (error && favorites.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={30} />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Unable to load favorites
          </h2>

          <p className="text-slate-500 mt-2">{error}</p>

          <button
            type="button"
            onClick={() => fetchFavorites()}
            className="mt-6 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium"
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // MAIN PAGE
  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-300 px-4 py-2 rounded-full text-sm font-medium">
                <Heart size={16} fill="currentColor" />
                Saved Providers
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold mt-5">
                My Favorites
              </h1>

              <p className="text-slate-300 mt-2 max-w-2xl">
                Quickly access the providers and services you have saved for
                future bookings.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchFavorites(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-60 px-5 py-2.5 rounded-xl font-semibold"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* TITLE AND ACTION */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-7">
          <div>
            <p className="text-sm text-slate-500">
              {favorites.length} saved{" "}
              {favorites.length === 1 ? "favorite" : "favorites"}
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Your Favorite Services
            </h2>
          </div>

          <Link
            to="/providers"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
          >
            Find Providers
            <ArrowRight size={17} />
          </Link>
        </div>

        {/* SEARCH */}
        {favorites.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-7 shadow-sm">
            <div className="relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search provider, service or location..."
                className="w-full pl-11 pr-12 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
              />

              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center"
                  title="Clear search"
                >
                  <X size={17} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && favorites.length > 0 && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* EMPTY FAVORITES */}
        {favorites.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 sm:p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <Heart size={35} className="text-red-400" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mt-6">
              No favorite services yet
            </h3>

            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Save services from trusted providers to access them here whenever
              you need them.
            </p>

            <Link
              to="/providers"
              className="mt-7 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Explore Providers
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : filteredFavorites.length === 0 ? (
          /* NO SEARCH RESULTS */
          <div className="bg-white border border-slate-200 rounded-3xl p-10 sm:p-14 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Search size={28} className="text-slate-400" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mt-5">
              No favorites found
            </h3>

            <p className="text-slate-500 mt-2">
              Try searching with another provider, service or location.
            </p>

            <button
              type="button"
              onClick={clearSearch}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
            >
              <X size={16} />
              Clear Search
            </button>
          </div>
        ) : (
          /* FAVORITE CARDS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((favorite) => {
              const provider = getProvider(favorite);
              const service = getProviderService(favorite);

              const providerId = getProviderId(favorite);
              const serviceId = getProviderServiceId(favorite);

              if (!provider || !providerId || !serviceId) {
                return null;
              }

              const providerName = getProviderName(provider);
              const ownerName = getOwnerName(provider);
              const image = getProviderImage(provider);
              const location = getLocation(provider);
              const experience = getExperience(provider);
              const rating = getRating(provider);
              const reviews = getReviewCount(provider);

              const isVerified = provider.isVerified === true;
              const isAvailable = provider.isAvailable === true;

              return (
                <article
                  key={favorite._id || serviceId}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition"
                >
                  {/* IMAGE */}
                  <div className="relative h-52 bg-slate-100">
                    {image ? (
                      <img
                        src={image}
                        alt={providerName}
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={58} className="text-slate-300" />
                      </div>
                    )}

                    {/* REMOVE FAVORITE */}
                    <button
                      type="button"
                      onClick={() => removeFavorite(providerId, serviceId)}
                      disabled={removingId === serviceId}
                      aria-label="Remove from favorites"
                      title="Remove from favorites"
                      className="absolute top-3 right-3 w-10 h-10 bg-white/95 text-red-500 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 disabled:opacity-50"
                    >
                      {removingId === serviceId ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Heart size={18} fill="currentColor" />
                      )}
                    </button>

                    {/* VERIFIED */}
                    {isVerified && (
                      <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                        <CheckCircle2 size={13} />
                        Verified
                      </div>
                    )}
                  </div>

                  {/* DETAILS */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                      {providerName}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">{ownerName}</p>

                    <p className="text-sm text-blue-600 font-semibold mt-3">
                      {getServiceName(service)}
                    </p>

                    {/* RATING */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star size={16} fill="currentColor" />
                        <span className="text-sm font-bold">{rating}</span>
                      </div>

                      <span className="text-sm text-slate-400">
                        ({reviews} reviews)
                      </span>
                    </div>

                    {/* LOCATION */}
                    <div className="flex items-start gap-2 mt-4 text-sm text-slate-500">
                      <MapPin size={16} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{location}</span>
                    </div>

                    {/* EXPERIENCE */}
                    <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                      <BriefcaseBusiness size={16} />
                      <span>{experience}</span>
                    </div>

                    {/* AVAILABILITY */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isAvailable ? "bg-green-500" : "bg-slate-400"
                        }`}
                      />

                      <span
                        className={`text-sm font-medium ${
                          isAvailable ? "text-green-700" : "text-slate-500"
                        }`}
                      >
                        {isAvailable ? "Available" : "Currently unavailable"}
                      </span>
                    </div>

                    {/* ACTIONS */}
                    <div className="grid grid-cols-1 gap-3 mt-5">
                      <Link
                        to={`/providers/${providerId}`}
                        className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-semibold"
                      >
                        View Profile
                        <ArrowRight size={15} />
                      </Link>

                      <Link
                        to={`/providers/${providerId}`}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold"
                      >
                        View Services
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* REFRESH */}
        {favorites.length > 0 && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => fetchFavorites(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh Favorites"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Favorites;
