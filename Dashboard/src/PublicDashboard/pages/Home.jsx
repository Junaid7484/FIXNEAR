import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowRight,
  ArrowLeft,
  Search,
  MapPin,
  ChevronDown,
  ShieldCheck,
  Clock3,
  Star,
  LockKeyhole,
  Zap,
  Droplets,
  Snowflake,
  Sparkles,
  Hammer,
  Wrench,
  CheckCircle2,
  Users,
} from "lucide-react";

import Testimonials from "../components/Testimonials";
import CTA from "../components/CTA";

// Backend base URL fallback
const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const categories = [
  {
    name: "Electrician",
    description: "Lighting · Wiring · Repair",
    icon: Zap,
    theme: "amber",
  },
  {
    name: "Plumber",
    description: "Leaks · Pipes · Fixtures",
    icon: Droplets,
    theme: "blue",
  },
  {
    name: "AC Repair",
    description: "Service · Gas Fill · Cooling",
    icon: Snowflake,
    theme: "cyan",
  },
  {
    name: "Cleaning",
    description: "Home · Office · Deep Clean",
    icon: Sparkles,
    theme: "purple",
  },
  {
    name: "Carpenter",
    description: "Furniture · Woodwork · Repair",
    icon: Hammer,
    theme: "orange",
  },
  {
    name: "Other Services",
    description: "Painting · Pest Control · More",
    icon: Wrench,
    theme: "green",
  },
];

const getServiceIcon = (category = "") => {
  const value =
    typeof category === "object"
      ? category?.name || category?.title || ""
      : String(category);

  const name = value.toLowerCase();

  if (name.includes("electric")) return Zap;
  if (name.includes("plumb")) return Droplets;
  if (name.includes("ac") || name.includes("cool")) return Snowflake;
  if (name.includes("clean")) return Sparkles;
  if (name.includes("carpent") || name.includes("wood")) return Hammer;

  return Wrench;
};

const getServiceTheme = (category = "") => {
  const value =
    typeof category === "object"
      ? category?.name || category?.title || ""
      : String(category);

  const name = value.toLowerCase();

  if (name.includes("electric")) return "amber";
  if (name.includes("plumb")) return "blue";
  if (name.includes("ac") || name.includes("cool")) return "cyan";
  if (name.includes("clean")) return "purple";
  if (name.includes("carpent") || name.includes("wood")) return "orange";

  return "green";
};

const getCategoryName = (category) => {
  if (typeof category === "string") return category;
  return (
    category?.name || category?.title || category?.categoryName || "Service"
  );
};

const getServiceImage = (service) => {
  if (typeof service.image === "string") return service.image;
  return (
    service.image?.url ||
    service.imageUrl ||
    service.thumbnail ||
    service.photo ||
    ""
  );
};

const getServicePrice = (service) => {
  const price = service.price ?? service.basePrice ?? service.startingPrice;
  if (price === undefined || price === null || price === "") {
    return "Price on request";
  }
  return `₹${price}`;
};

const getServiceDuration = (service) => {
  const duration =
    service.duration ?? service.estimatedDuration ?? service.durationInMinutes;
  if (duration === undefined || duration === null || duration === "") {
    return "";
  }
  if (typeof duration === "number") {
    return `${duration} minutes`;
  }
  return String(duration);
};

const themeStyles = {
  amber: {
    card: "border-amber-200 bg-amber-50/60",
    icon: "bg-amber-100/80 text-amber-500 ring-amber-200",
    arrow: "bg-amber-100 text-amber-600",
  },
  blue: {
    card: "border-blue-200 bg-blue-50/60",
    icon: "bg-blue-100/80 text-blue-600 ring-blue-200",
    arrow: "bg-blue-100 text-blue-600",
  },
  cyan: {
    card: "border-teal-200 bg-teal-50/60",
    icon: "bg-teal-100/80 text-teal-600 ring-teal-200",
    arrow: "bg-teal-100 text-teal-700",
  },
  purple: {
    card: "border-purple-200 bg-purple-50/60",
    icon: "bg-purple-100/80 text-purple-600 ring-purple-200",
    arrow: "bg-purple-100 text-purple-600",
  },
  orange: {
    card: "border-orange-200 bg-orange-50/60",
    icon: "bg-orange-100/80 text-orange-600 ring-orange-200",
    arrow: "bg-orange-100 text-orange-600",
  },
  green: {
    card: "border-green-200 bg-green-50/60",
    icon: "bg-green-100/80 text-green-600 ring-green-200",
    arrow: "bg-green-100 text-green-600",
  },
};

function Home() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [serviceOffset, setServiceOffset] = useState(0);

  const [popularServices, setPopularServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        setServicesError("");

        const response = await axios.get(`${API_BASE}/services`);
        const payload = response.data;

        const serviceList = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.services)
            ? payload.services
            : Array.isArray(payload?.data?.services)
              ? payload.data.services
              : Array.isArray(payload?.data)
                ? payload.data
                : [];

        if (cancelled) return;

        const listedServices = serviceList.filter((service) => {
          if (!service || typeof service !== "object") return false;

          const serviceName =
            service.name || service.title || service.serviceName;

          if (!serviceName) return false;

          if (
            service.isActive === false ||
            service.active === false ||
            service.isListed === false ||
            service.isAvailable === false ||
            service.status === "inactive" ||
            service.status === "disabled"
          ) {
            return false;
          }

          return true;
        });

        const formattedServices = listedServices.map((service) => {
          const category = getCategoryName(
            service.category || service.categoryId || service.serviceCategory,
          );

          return {
            id: service._id || service.id,
            name: service.name || service.title || service.serviceName,
            category,
            price: getServicePrice(service),
            duration: getServiceDuration(service),
            image: getServiceImage(service),
            icon: getServiceIcon(category),
            theme: getServiceTheme(category),
          };
        });

        setPopularServices(formattedServices);
      } catch (error) {
        if (cancelled) return;

        console.error("Error fetching home services:", error);
        setServicesError(
          error.response?.data?.message || "Unable to load services right now.",
        );
        setPopularServices([]);
      } finally {
        if (!cancelled) {
          setServicesLoading(false);
        }
      }
    };

    fetchServices();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (location.trim()) params.set("location", location.trim());

    navigate(`/services${params.toString() ? `?${params}` : ""}`);
  };

  const openCategory = (name) => {
    navigate(`/services?category=${encodeURIComponent(name)}`);
  };

  const displayedServices =
    popularServices.length > 0
      ? popularServices.map(
          (_, index) =>
            popularServices[
              (index + serviceOffset + popularServices.length) %
                popularServices.length
            ],
        )
      : [];

  const moveServices = (direction) => {
    if (popularServices.length <= 1) return;

    setServiceOffset(
      (current) =>
        (current + direction + popularServices.length) % popularServices.length,
    );
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#fcfaf7] text-[#102b50]">
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_75%_40%,#e8f1ff_0%,#fcfaf7_48%,#f8f6f2_100%)]">
        <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-48 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />

        <div className="relative mx-auto grid min-h-121.25 max-w-362.5 items-center gap-8 px-5 py-12 sm:px-8 lg:min-h-121.25 lg:grid-cols-[1.12fr_0.88fr] lg:gap-5 lg:px-10 lg:py-8">
          {/* HERO COPY */}
          <div className="relative z-10 max-w-187.5">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#e5efff] px-4 py-2 text-xs font-semibold text-[#0865f9] sm:text-[13px]">
              <ShieldCheck size={18} />
              Trusted Local Professionals
            </div>

            <h1 className="font-serif text-[43px] font-bold leading-[1.04] tracking-[-1.6px] text-[#102b50] sm:text-[54px] lg:text-[58px] xl:text-[62px]">
              Find Trusted
              <br />
              <span className="italic text-[#0865f9]">Local Services</span> Near
              You
            </h1>

            <p className="mt-5 max-w-152.5 text-[15px] leading-7 text-[#496789] sm:text-[17px] sm:leading-[1.8]">
              From plumbing and electrical repairs to cleaning and AC services,
              find reliable professionals for your home in just a few clicks.
            </p>

            {/* SEARCH BAR */}
            <form
              onSubmit={handleSearch}
              className="mt-6 flex max-w-180 flex-col gap-2 rounded-[28px] border border-white bg-white/95 p-2 shadow-[0_12px_38px_rgba(30,65,110,0.12)] sm:flex-row sm:items-center sm:gap-0"
            >
              <label className="flex min-w-0 flex-1 items-center gap-3 px-4">
                <Search size={20} className="shrink-0 text-[#547397]" />
                <input
                  type="text"
                  name="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="What service do you need?"
                  className="w-full min-w-0 bg-transparent py-3 text-[13px] text-[#17365d] outline-none placeholder:text-[#355578]"
                />
              </label>

              <div className="hidden h-9 w-px bg-slate-200 sm:block" />

              <label className="flex min-w-0 items-center gap-3 px-4 sm:w-45">
                <MapPin size={19} className="shrink-0 text-[#547397]" />
                <input
                  type="text"
                  name="location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Your Location"
                  className="w-full min-w-0 bg-transparent py-3 text-[13px] text-[#17365d] outline-none placeholder:text-[#355578]"
                />
                <ChevronDown size={16} className="shrink-0 text-[#547397]" />
              </label>

              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-[#0865f9] px-7 py-4 text-[13px] font-semibold text-white shadow-lg shadow-blue-200/60 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:min-w-37.5"
              >
                Search
                <ArrowRight size={17} />
              </button>
            </form>

            {/* TRUST BENEFITS */}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 sm:gap-x-7">
              {[
                {
                  icon: ShieldCheck,
                  text: "Verified",
                  second: "Professionals",
                },
                { icon: Clock3, text: "Fast & Reliable", second: "Service" },
                { icon: Star, text: "Top Rated", second: "Providers" },
                { icon: LockKeyhole, text: "Secure", second: "Payments" },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.text}
                    className={`flex items-center gap-2.5 ${
                      index !== 0
                        ? "sm:border-l sm:border-slate-200 sm:pl-6"
                        : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e4efff] text-[#0865f9]">
                      <Icon size={22} />
                    </div>
                    <div className="text-[11px] font-medium leading-normal text-[#17365d] sm:text-xs">
                      <p>{item.text}</p>
                      <p>{item.second}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="relative mx-auto hidden h-110 w-full max-w-162.5 lg:block">
            <div className="absolute left-[7%] top-[7%] h-90 w-[72%] rounded-[48%_45%_35%_42%] bg-[#e7edf3]" />

            <div className="absolute left-[12%] top-[13%] h-85 w-[70%] overflow-hidden rounded-[45%_45%_22%_25%] bg-linear-to-br from-[#e9f0f7] via-[#d5e4ef] to-[#f7f6f2]">
              <img
                src="/images/image.png"
                alt="Trusted FixNear home service professional"
                className="h-full w-full object-cover object-center"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-[#dce9f4]/30 to-transparent" />
            </div>

            {/* Floating category cards */}
            <div className="absolute right-0 top-3 flex w-43.75 flex-col gap-3">
              {[
                {
                  name: "Electrician",
                  desc: "Quick & Safe",
                  icon: Zap,
                  theme: "amber",
                },
                {
                  name: "Plumber",
                  desc: "Fixing Leaks",
                  icon: Droplets,
                  theme: "blue",
                },
                {
                  name: "AC Repair",
                  desc: "Stay Cool",
                  icon: Snowflake,
                  theme: "blue",
                },
                {
                  name: "Cleaning",
                  desc: "Fresh & Clean",
                  icon: Sparkles,
                  theme: "purple",
                },
                {
                  name: "Carpenter",
                  desc: "Build & Repair",
                  icon: Hammer,
                  theme: "orange",
                },
              ].map((item) => {
                const Icon = item.icon;
                const styles = themeStyles[item.theme];

                return (
                  <button
                    type="button"
                    key={item.name}
                    onClick={() => openCategory(item.name)}
                    className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 p-3.5 text-left shadow-[0_8px_25px_rgba(40,65,100,0.07)] transition hover:-translate-x-1 hover:shadow-lg"
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${styles.icon}`}
                    >
                      <Icon size={24} />
                    </span>
                    <span>
                      <span className="block text-[12px] font-semibold text-[#102b50]">
                        {item.name}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-500">
                        {item.desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="absolute left-[1%] top-[18%] -rotate-12 font-serif text-[16px] italic leading-tight text-[#17365d]">
              Your
              <br />
              Local Service
              <br />
              Partner
              <ArrowRight size={28} className="ml-12 mt-2 rotate-35" />
            </div>

            <div className="absolute bottom-5 right-1 -rotate-6 font-serif text-[15px] italic text-[#17365d]">
              and more...
              <ArrowRight size={22} className="ml-20 rotate-[-35deg]" />
            </div>

            <svg
              className="pointer-events-none absolute bottom-14 left-[5%] h-24 w-20 text-[#0865f9]"
              viewBox="0 0 80 100"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M67 4 C10 22, 5 61, 39 91"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M29 83 L39 92 L43 78"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* SERVICE CATEGORIES */}
      <section className="bg-[#fcfaf7] py-9 sm:py-10">
        <div className="mx-auto max-w-362.5 px-5 sm:px-8 lg:px-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[1.7px] text-[#496789]">
                Browse by Category
              </p>
              <h2 className="mt-1 font-serif text-[27px] font-bold leading-tight tracking-tight text-[#102b50] sm:text-[30px]">
                Explore Our Services
              </h2>
              <p className="mt-1 text-[13px] text-[#607b98]">
                Choose from a wide range of professional services for your home
                and business.
              </p>
            </div>

            <Link
              to="/services"
              className="mb-1 hidden shrink-0 items-center gap-2 text-[11px] font-semibold text-[#0865f9] transition hover:gap-3 sm:flex"
            >
              View All Services
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6 lg:gap-5">
            {categories.map((category) => {
              const Icon = category.icon;
              const styles = themeStyles[category.theme];

              return (
                <button
                  type="button"
                  key={category.name}
                  onClick={() => openCategory(category.name)}
                  className={`group flex min-h-37.5 flex-col items-start rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-1 hover:shadow-md sm:min-h-39.25 sm:p-5 ${styles.card}`}
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full ring-1 transition group-hover:scale-105 ${styles.icon}`}
                  >
                    <Icon size={25} strokeWidth={2.2} />
                  </span>

                  <span className="mt-2 text-[13px] font-semibold text-[#102b50]">
                    {category.name}
                  </span>

                  <span className="mt-1 text-[10px] leading-4 text-[#64809c] sm:text-[11px]">
                    {category.description}
                  </span>

                  <span
                    className={`mt-auto flex h-7 w-7 items-center justify-center rounded-full transition group-hover:translate-x-1 ${styles.arrow}`}
                  >
                    <ArrowRight size={15} />
                  </span>
                </button>
              );
            })}
          </div>

          <Link
            to="/services"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#0865f9] sm:hidden"
          >
            View All Services <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* POPULAR SERVICES - DATABASE DATA ONLY */}
      <section className="bg-[#fcfaf7] pb-14 pt-1 sm:pb-16">
        <div className="mx-auto max-w-362.5 px-5 sm:px-8 lg:px-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#496789]">
                Popular Services
              </p>
              <h2 className="mt-1 font-serif text-[27px] font-bold leading-tight tracking-tight text-[#102b50] sm:text-[30px]">
                Top Rated &amp; Most Booked
              </h2>
              <p className="mt-1 text-[12px] text-[#607b98] sm:text-[13px]">
                Explore services currently listed on FIXNEAR.
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                aria-label="Previous services"
                disabled={servicesLoading || popularServices.length <= 1}
                onClick={() => moveServices(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-[#607b98] shadow-sm transition hover:border-blue-300 hover:text-[#0865f9] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={17} />
              </button>

              <button
                type="button"
                aria-label="Next services"
                disabled={servicesLoading || popularServices.length <= 1}
                onClick={() => moveServices(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-[#102b50] shadow-sm transition hover:border-blue-300 hover:text-[#0865f9] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowRight size={17} />
              </button>
            </div>
          </div>

          {servicesLoading ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3"
                >
                  <div className="h-22 w-23.5 shrink-0 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-3 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                    <div className="h-3 w-1/3 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : servicesError ? (
            <div className="mt-5 rounded-2xl border border-red-100 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-red-600">
                {servicesError}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 text-sm font-semibold text-[#0865f9] hover:underline"
              >
                Try again
              </button>
            </div>
          ) : displayedServices.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-slate-100 bg-white px-5 py-12 text-center">
              <Wrench className="mx-auto text-slate-400" size={32} />
              <h3 className="mt-3 text-base font-bold text-[#102b50]">
                No services listed yet
              </h3>
              <p className="mt-2 text-sm text-[#607b98]">
                Services will appear here when they are listed on the Services
                page.
              </p>
              <Link
                to="/services"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0865f9]"
              >
                Browse Services <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {displayedServices.map((service) => {
                const Icon = service.icon;
                const styles = themeStyles[service.theme];

                return (
                  <article
                    key={service.id || service.name}
                    className="group flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_4px_18px_rgba(30,65,110,0.04)] transition hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg"
                  >
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.name}
                        className="h-22 w-23.5 shrink-0 rounded-xl bg-slate-100 object-cover"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        className={`flex h-22 w-23.5 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
                      >
                        <Icon size={30} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 py-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${styles.icon}`}
                        >
                          <Icon size={17} />
                        </span>

                        <div className="min-w-0">
                          <h3 className="truncate text-[11px] font-bold text-[#102b50]">
                            {service.name}
                          </h3>
                          <p className="mt-1 truncate text-[10px] text-[#69839e]">
                            {service.category}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-bold text-[#102b50]">
                          {service.price}
                        </span>

                        <Link
                          to={
                            service.id ? `/services/${service.id}` : "/services"
                          }
                          aria-label={`View ${service.name}`}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-[#102b50] transition hover:border-blue-500 hover:bg-blue-600 hover:text-white"
                        >
                          <ArrowRight size={14} />
                        </Link>
                      </div>

                      {service.duration && (
                        <p className="mt-1 truncate text-[10px] text-[#69839e]">
                          {service.duration}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-5 text-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-xs font-semibold text-[#17365d] transition hover:border-blue-300 hover:text-[#0865f9]"
            >
              Explore All Services <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-slate-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-312.5 px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[1.7px] text-[#0865f9]">
              Simple Process
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#102b50] sm:text-4xl">
              How FIXNEAR Works
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#607b98]">
              Getting reliable help for your home is simple, convenient, and
              just a few clicks away.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                icon: Search,
                title: "Choose a Service",
                description:
                  "Explore local services and find the right solution for your needs.",
              },
              {
                number: "02",
                icon: Users,
                title: "Select a Professional",
                description:
                  "Compare available professionals, their profiles, and reviews.",
              },
              {
                number: "03",
                icon: CheckCircle2,
                title: "Book with Confidence",
                description:
                  "Arrange your service and get help at a convenient time.",
              },
            ].map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="rounded-2xl border border-slate-100 bg-[#fcfaf7] p-7 transition hover:border-blue-100 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e7f0ff] text-[#0865f9]">
                      <Icon size={23} />
                    </span>
                    <span className="font-serif text-4xl font-bold text-slate-200">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-[#102b50]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#607b98]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY FIXNEAR */}
      <section className="bg-[#f7f8fb] py-16 sm:py-20">
        <div className="mx-auto grid max-w-312.5 items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[1.7px] text-[#0865f9]">
              Why Choose FIXNEAR?
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-[#102b50] sm:text-4xl">
              Local help you can{" "}
              <span className="italic text-[#0865f9]">trust.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#607b98]">
              Find skilled professionals in your area with a straightforward
              service discovery and booking experience.
            </p>

            <div className="mt-8 space-y-6">
              {[
                {
                  icon: ShieldCheck,
                  title: "Trusted Professionals",
                  description:
                    "Review provider profiles and available verification information.",
                },
                {
                  icon: Star,
                  title: "Ratings & Reviews",
                  description:
                    "Use customer feedback to help choose the right service provider.",
                },
                {
                  icon: Clock3,
                  title: "Convenient Scheduling",
                  description:
                    "Arrange services around your preferred date and time.",
                },
                {
                  icon: MapPin,
                  title: "Local Service Discovery",
                  description:
                    "Search for services and professionals in your location.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="flex gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#0865f9] shadow-sm ring-1 ring-slate-100">
                      <Icon size={22} />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#102b50]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[#607b98]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] bg-[#102b50] p-5 shadow-xl shadow-blue-950/10 sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-medium text-blue-200">
                Built around your needs
              </p>
              <h3 className="mt-2 font-serif text-2xl font-bold text-white">
                Better service starts here.
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { value: "Easy", label: "Service Discovery" },
                { value: "Local", label: "Professionals" },
                { value: "Clear", label: "Provider Details" },
                { value: "Simple", label: "Booking Journey" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/6 p-5 sm:p-6"
                >
                  <p className="font-serif text-2xl font-bold text-white sm:text-3xl">
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-blue-100/80">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/10 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
                <ShieldCheck size={21} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  Your home, your choice
                </p>
                <p className="mt-1 text-xs text-blue-100/80">
                  Explore services and compare your options.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROVIDER CALL TO ACTION */}
      <section className="bg-[#0865f9] py-14 sm:py-16">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
            <Wrench size={27} />
          </span>
          <h2 className="mt-5 font-serif text-3xl font-bold text-white sm:text-4xl">
            Are You a Service Professional?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
            Join FIXNEAR to showcase your services, connect with customers, and
            manage your business through one convenient platform.
          </p>
          <Link
            to="/provider/register"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#0865f9] shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
          >
            Become a Provider <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[#fcfaf7] py-14 sm:py-16">
        <div className="mx-auto max-w-312.5 px-5 sm:px-8">
          <Testimonials />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-312.5 px-5 sm:px-8">
          <CTA />
        </div>
      </section>
    </main>
  );
}

export default Home;
