import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  RefreshCw,
  Wrench,
  ArrowRight,
  Clock,
  IndianRupee,
  Zap,
  Droplets,
  Snowflake,
  Sparkles,
  Hammer,
  Paintbrush,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import API from "../../services/api";

// Safely extract arrays from common API response formats.
const extractArray = (data, key) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  if (Array.isArray(data[key])) return data[key];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.data?.[key])) return data.data[key];
  if (Array.isArray(data.result?.[key])) return data.result[key];
  if (Array.isArray(data.result)) return data.result;

  return [];
};

const getId = (item) => {
  if (item == null) return "";

  if (typeof item === "string" || typeof item === "number") {
    return String(item);
  }

  if (typeof item === "object") {
    const id = item._id ?? item.id ?? item.$oid;
    return id != null ? String(id) : "";
  }

  return "";
};

const getCategoryName = (category) => {
  if (!category) return "";

  if (typeof category === "string") {
    return category.trim();
  }

  if (typeof category !== "object") return "";

  return String(
    category.name ??
      category.title ??
      category.categoryName ??
      category.label ??
      "",
  ).trim();
};

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getCategoryLabel = (service) =>
  getCategoryName(service?.category) ||
  getCategoryName(service?.categoryId) ||
  String(service?.categoryName ?? "").trim();

function Services() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [services, setServices] = useState([]);
  const [categoriesFromAPI, setCategoriesFromAPI] = useState([]);

  const [search, setSearch] = useState(searchParams.get("search") || "");

  const [appliedSearch, setAppliedSearch] = useState(
    searchParams.get("search") || "",
  );

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "",
  );

  const [page, setPage] = useState(
    Math.max(1, Number(searchParams.get("page")) || 1),
  );

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const LIMIT = 10;

  // Fetch categories once.
  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        const response = await API.get("/categories");

        if (cancelled) return;

        const receivedCategories = extractArray(response.data, "categories");

        setCategoriesFromAPI(receivedCategories);

        // Convert an older category ID in the URL into its category name.
        const categoryFromURL = searchParams.get("category");

        if (categoryFromURL) {
          const matchingCategory = receivedCategories.find(
            (category) => getId(category) === categoryFromURL,
          );

          if (matchingCategory?.name) {
            setSelectedCategory(matchingCategory.name);
            setSearchParams(
              (previousParams) => {
                const params = new URLSearchParams(previousParams);
                params.set("category", matchingCategory.name);
                return params;
              },
              { replace: true },
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setCategoriesFromAPI([]);
        }
      }
    };

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch services from the backend using server-side pagination.
  useEffect(() => {
    let cancelled = false;

    const fetchServices = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {
          page,
          limit: LIMIT,
        };

        if (appliedSearch.trim()) {
          params.search = appliedSearch.trim();
        }

        // Service.category is stored as a string.
        // Therefore, send the category name, not its MongoDB ID.
        if (selectedCategory.trim()) {
          params.category = selectedCategory.trim();
        }

        const response = await API.get("/services", {
          params,
        });

        if (cancelled) return;

        const receivedServices = extractArray(response.data, "services");

        setServices(receivedServices);

        const receivedPagination = response.data?.pagination;

        if (receivedPagination) {
          setPagination({
            page: Number(receivedPagination.page) || page,
            limit: Number(receivedPagination.limit) || LIMIT,
            total: Number(receivedPagination.total) || 0,
            totalPages: Math.max(1, Number(receivedPagination.totalPages) || 1),
            hasNextPage: Boolean(receivedPagination.hasNextPage),
            hasPrevPage: Boolean(receivedPagination.hasPrevPage),
          });
        } else {
          // Compatibility with an older API response without pagination.
          setPagination({
            page,
            limit: LIMIT,
            total: receivedServices.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setServices([]);
          setError(
            err?.response?.data?.message ||
              "Failed to load services. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchServices();

    return () => {
      cancelled = true;
    };
  }, [page, appliedSearch, selectedCategory]);

  // Build the category list from the categories API.
  const categories = useMemo(() => {
    const categoryMap = new Map();

    categoriesFromAPI.forEach((category) => {
      const name = getCategoryName(category);

      if (!name) return;

      const key = normalize(name);

      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          ...category,
          _id: getId(category),
          name,
        });
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [categoriesFromAPI]);

  // Return an icon appropriate for each service category.
  const getCategoryIcon = (icon, name = "") => {
    const iconName = normalize(icon);
    const categoryName = normalize(name);

    if (iconName.includes("electric") || categoryName.includes("electric")) {
      return <Zap size={17} />;
    }

    if (iconName.includes("plumb") || categoryName.includes("plumb")) {
      return <Droplets size={17} />;
    }

    if (
      iconName === "ac" ||
      categoryName.includes("ac repair") ||
      categoryName.includes("appliance") ||
      categoryName.includes("cooling")
    ) {
      return <Snowflake size={17} />;
    }

    if (iconName.includes("clean") || categoryName.includes("clean")) {
      return <Sparkles size={17} />;
    }

    if (iconName.includes("carpent") || categoryName.includes("carpent")) {
      return <Hammer size={17} />;
    }

    if (iconName.includes("paint") || categoryName.includes("paint")) {
      return <Paintbrush size={17} />;
    }

    return <Wrench size={17} />;
  };

  // Keep search and category filters synchronized with the URL.
  const updateURL = (searchValue, categoryName, currentPage = 1) => {
    const params = {};

    if (searchValue.trim()) {
      params.search = searchValue.trim();
    }

    if (categoryName) {
      params.category = categoryName;
    }

    if (currentPage > 1) {
      params.page = String(currentPage);
    }

    setSearchParams(params);
  };

  // Search is applied when the user submits the form.
  const handleSearch = (event) => {
    event.preventDefault();

    const cleanSearch = search.trim();

    setAppliedSearch(cleanSearch);
    setPage(1);

    updateURL(cleanSearch, selectedCategory, 1);
  };

  // Category filtering uses the category name.
  const handleCategoryChange = (categoryName) => {
    setSelectedCategory(categoryName);
    setPage(1);

    updateURL(appliedSearch, categoryName, 1);

    setShowFilters(false);
  };

  // Clear search and category filters.
  const clearFilters = () => {
    setSearch("");
    setAppliedSearch("");
    setSelectedCategory("");
    setPage(1);

    setSearchParams({});
  };

  // Clear only the search filter.
  const clearSearch = () => {
    setSearch("");
    setAppliedSearch("");
    setPage(1);

    updateURL("", selectedCategory, 1);
  };

  // Change pagination page.
  const handlePageChange = (nextPage) => {
    const safePage = Math.max(1, Math.min(nextPage, pagination.totalPages));

    if (safePage === page) return;

    setPage(safePage);

    updateURL(appliedSearch, selectedCategory, safePage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleRetry = () => {
    setPage((currentPage) => currentPage);
    setError("");

    // Trigger a fresh request by reloading the current page.
    window.location.reload();
  };

  // Loading state.
  if (loading && services.length === 0) {
    return (
      <div className="min-h-125 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading services...</p>
        </div>
      </div>
    );
  }

  // Error state.
  if (error && services.length === 0) {
    return (
      <div className="min-h-125 flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md w-full shadow-sm">
          <X size={28} className="mx-auto text-red-500" />

          <h2 className="text-xl font-bold text-slate-900 mt-5">
            Unable to load services
          </h2>

          <p className="text-slate-500 mt-2">{error}</p>

          <button
            type="button"
            onClick={handleRetry}
            className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium"
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
      {/* HERO */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
              <Wrench size={16} />
              FIXNEAR Services
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-5 leading-tight">
              Find the right service{" "}
              <span className="text-blue-500">for your home</span>
            </h1>

            <p className="text-slate-300 mt-4 text-base sm:text-lg max-w-2xl">
              Book trusted professionals for repairs, maintenance, cleaning and
              other home services near you.
            </p>
          </div>

          {/* SEARCH */}
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
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search plumber, electrician, cleaning..."
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

      {/* MAIN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* MOBILE FILTER BUTTON */}
        <div className="lg:hidden mb-5">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl py-3 font-medium text-slate-700"
          >
            <SlidersHorizontal size={18} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* CATEGORY SIDEBAR */}
          <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg text-slate-900">Categories</h2>

                {(appliedSearch || selectedCategory) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleCategoryChange("")}
                  className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm transition ${
                    !selectedCategory
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Wrench size={17} />
                  All Services
                </button>

                {categories.map((category) => {
                  const categoryName = category.name;

                  const isSelected =
                    normalize(selectedCategory) === normalize(categoryName);

                  return (
                    <button
                      type="button"
                      key={category._id || categoryName}
                      onClick={() => handleCategoryChange(categoryName)}
                      className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm transition ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {getCategoryIcon(category.icon, category.name)}

                      <span>{category.name}</span>
                    </button>
                  );
                })}

                {categories.length === 0 && (
                  <p className="text-sm text-slate-500 px-3 py-3">
                    No categories available.
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* SERVICES */}
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-sm text-slate-500">
                  {pagination.total}{" "}
                  {pagination.total === 1 ? "service" : "services"} found
                </p>

                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  Available Services
                </h2>
              </div>

              {(appliedSearch || selectedCategory) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
                >
                  <X size={16} />
                  Clear filters
                </button>
              )}
            </div>

            {appliedSearch && (
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
                  <Search size={14} />
                  Search: {appliedSearch}
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={clearSearch}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {selectedCategory && (
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm">
                  Category: {selectedCategory}
                </div>
              </div>
            )}

            {/* SERVICE GRID */}
            {services.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {services.map((service) => {
                  const categoryLabel = getCategoryLabel(service);

                  const category = categories.find(
                    (item) => normalize(item.name) === normalize(categoryLabel),
                  );

                  const serviceId = getId(service);

                  const fallbackImage =
                    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80";

                  return (
                    <div
                      key={serviceId || service.name}
                      className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      {/* IMAGE */}
                      <div className="relative h-48 overflow-hidden bg-slate-100">
                        <img
                          src={service.image || fallbackImage}
                          alt={service.name || "Home service"}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = fallbackImage;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {categoryLabel && (
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                              {getCategoryIcon(category?.icon, categoryLabel)}

                              {categoryLabel}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* CONTENT */}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                          {service.name}
                        </h3>

                        <p className="text-sm text-slate-500 mt-2 line-clamp-2 min-h-10">
                          {service.description ||
                            "Professional home service from trusted local providers."}
                        </p>

                        {/* PRICE AND DURATION */}
                        <div className="flex items-center justify-between mt-5 gap-2">
                          <div className="flex items-center gap-1 text-blue-600">
                            {typeof service.price === "number" ||
                            typeof service.price === "string" ? (
                              <>
                                <IndianRupee size={17} />

                                <span className="font-bold">
                                  {service.price}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-sm">
                                Contact for price
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                            <Clock size={15} />
                            <span>{service.duration || "Flexible"}</span>
                          </div>
                        </div>

                        {/* VIEW SERVICE */}
                        <Link
                          to={`/services/${serviceId}`}
                          className="mt-5 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition-colors"
                        >
                          View Service
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
                  <Search size={28} className="text-slate-400" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 mt-5">
                  No services found
                </h3>

                <p className="text-slate-500 mt-2 max-w-md mx-auto">
                  Try another search term or select a different category.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium"
                >
                  <RefreshCw size={17} />
                  View All Services
                </button>
              </div>
            )}

            {/* PAGINATION */}
            {pagination.totalPages > 1 && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
                <p className="text-sm text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-slate-900">
                    {pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {pagination.totalPages}
                  </span>
                  {" · "}
                  {pagination.total} total services
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading || !pagination.hasPrevPage || page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={17} />
                    Previous
                  </button>

                  <span className="px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg">
                    {page}
                  </span>

                  <button
                    type="button"
                    disabled={
                      loading ||
                      !pagination.hasNextPage ||
                      page >= pagination.totalPages
                    }
                    onClick={() => handlePageChange(page + 1)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            )}

            {loading && services.length > 0 && (
              <p className="text-center text-sm text-blue-600 mt-5">
                Loading services...
              </p>
            )}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Can't find your service?
            </h2>

            <p className="text-slate-300 mt-2">
              Find professionals who can help with your specific requirement.
            </p>
          </div>

          <Link
            to="/providers"
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Find Providers
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Services;
