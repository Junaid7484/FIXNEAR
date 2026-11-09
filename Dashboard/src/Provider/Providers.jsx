import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Users,
  Wrench,
  ArrowRight,
  RefreshCw,
  X,
  SlidersHorizontal,
} from "lucide-react";

import API from "../services/api";

function Providers() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [providers, setProviders] = useState([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/providers");

        console.log("Providers API Response:", response.data);

        const receivedProviders =
          response.data?.providers ||
          response.data?.data ||
          (Array.isArray(response.data) ? response.data : []);

        setProviders(receivedProviders);
      } catch (error) {
        console.error("Fetch Providers Error:", error);

        setError(
          error.response?.data?.message ||
            "Failed to load providers. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const filteredProviders = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    if (!cleanSearch) {
      return providers;
    }

    return providers.filter((provider) => {
      const name = provider?.name?.toLowerCase() || "";

      const businessName = provider?.businessName?.toLowerCase() || "";

      const city = provider?.city?.toLowerCase() || "";

      const state = provider?.state?.toLowerCase() || "";

      const service = provider?.service?.toLowerCase() || "";

      return (
        name.includes(cleanSearch) ||
        businessName.includes(cleanSearch) ||
        city.includes(cleanSearch) ||
        state.includes(cleanSearch) ||
        service.includes(cleanSearch)
      );
    });
  }, [providers, search]);

  const handleSearch = (e) => {
    e.preventDefault();

    const params = {};

    if (search.trim()) {
      params.search = search.trim();
    }

    setSearchParams(params);
  };

  const clearSearch = () => {
    setSearch("");
    setSearchParams({});
  };

  const getProviderName = (provider) => {
    return (
      provider.businessName ||
      provider.name ||
      provider.user?.name ||
      "FIXNEAR Professional"
    );
  };

  const getProviderImage = (provider) => {
    return (
      provider.profileImage ||
      provider.image ||
      provider.user?.profileImage ||
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80"
    );
  };

  const getProviderLocation = (provider) => {
    const location = [provider.city, provider.state].filter(Boolean).join(", ");

    return location || "Location not specified";
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />

          <p className="text-sm text-slate-500">Loading providers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[600px] flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <X size={30} />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Unable to load providers
          </h2>

          <p className="text-slate-500 mt-2">{error}</p>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition"
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
              <Users size={16} />
              FIXNEAR Professionals
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-5 leading-tight">
              Find trusted{" "}
              <span className="text-blue-500">service providers</span>
            </h1>

            <p className="text-slate-300 mt-4 text-base sm:text-lg max-w-2xl">
              Discover verified professionals near you and book the right person
              for your home service.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mt-8 max-w-3xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search provider, city, service..."
                  className="w-full bg-white text-slate-900 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-7 py-3.5 rounded-xl font-semibold transition"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Providers */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Mobile Filter */}
        <div className="lg:hidden mb-5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl py-3 font-medium text-slate-700"
          >
            <SlidersHorizontal size={18} />

            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-sm text-slate-500">
              {filteredProviders.length}{" "}
              {filteredProviders.length === 1 ? "provider" : "providers"} found
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Available Professionals
            </h2>
          </div>

          {(search || showFilters) && (
            <button
              onClick={clearSearch}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
            >
              <X size={16} />
              Clear search
            </button>
          )}
        </div>

        {search && (
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
              <Search size={14} />
              Search: {search}
              <button onClick={clearSearch}>
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {filteredProviders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => {
              const providerName = getProviderName(provider);

              const providerImage = getProviderImage(provider);

              const location = getProviderLocation(provider);

              return (
                <div
                  key={provider._id}
                  className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden bg-slate-100">
                    <img
                      src={providerImage}
                      alt={providerName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Available
                      </span>
                    </div>

                    {provider.isVerified && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                          Verified
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                      {providerName}
                    </h3>

                    {provider.service && (
                      <div className="flex items-center gap-2 text-blue-600 text-sm mt-2">
                        <Wrench size={15} />

                        <span className="line-clamp-1">{provider.service}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-3">
                      <MapPin size={16} />

                      <span className="line-clamp-1">{location}</span>
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <Star
                          size={17}
                          className="fill-yellow-400 text-yellow-400"
                        />

                        <span className="font-bold text-slate-800">
                          {provider.rating ?? provider.averageRating ?? "New"}
                        </span>
                      </div>

                      <span className="text-sm text-slate-500">
                        {provider.reviewCount ?? provider.reviews?.length ?? 0}{" "}
                        reviews
                      </span>
                    </div>

                    <Link
                      to={`/providers/${provider._id}`}
                      className="mt-5 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition-colors"
                    >
                      View Profile
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-14 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Users size={28} className="text-slate-400" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mt-5">
              No providers found
            </h3>

            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Try another provider name, service, or location.
            </p>

            <button
              onClick={clearSearch}
              className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium"
            >
              <RefreshCw size={17} />
              View All Providers
            </button>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 mt-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Are you a service professional?
            </h2>

            <p className="text-slate-300 mt-2">
              Join FIXNEAR and connect with customers looking for your services.
            </p>
          </div>

          <Link
            to="/provider/register"
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Become a Provider
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Providers;
