import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  MapPin,
  UserRound,
  LogIn,
  ChevronDown,
  LoaderCircle,
  LocateFixed,
  ArrowUpRight,
  BriefcaseBusiness,
  ArrowRight,
  User,
} from "lucide-react";

const LOCATION_KEY = "userLocation";

// Only Customer and Service Provider panels
const panels = [
  {
    title: "Customer Panel",
    description: "Find local services and book trusted professionals.",
    icon: User,
    path: "/login",
    iconStyle: "bg-blue-100 text-blue-700",
  },
  {
    title: "Service Provider Panel",
    description: "Manage services, bookings, and earnings.",
    icon: BriefcaseBusiness,
    path: "/provider/login",
    iconStyle: "bg-emerald-100 text-emerald-700",
  },
];

function PublicNavbar() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showPanelMenu, setShowPanelMenu] = useState(false);

  const [location, setLocation] = useState("Detect location");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const moreRef = useRef(null);
  const panelMenuRef = useRef(null);

  // Restore saved location
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCATION_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (
          Number.isFinite(parsed.latitude) &&
          Number.isFinite(parsed.longitude)
        ) {
          setLocation(parsed.address || "Previously detected location");
        }
      }
    } catch (error) {
      console.error("Unable to restore location:", error);
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setShowMore(false);
      }

      if (
        panelMenuRef.current &&
        !panelMenuRef.current.contains(event.target)
      ) {
        setShowPanelMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Close the panel menu with Escape
  useEffect(() => {
    if (!showPanelMenu) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowPanelMenu(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showPanelMenu]);

  const navLinkClass = ({ isActive }) =>
    `relative px-1 py-2.5 text-[13px] font-semibold tracking-wide
     transition-colors duration-200
     after:absolute after:bottom-0 after:left-0 after:h-[2px]
     after:bg-blue-600 after:transition-all after:duration-300
     ${
       isActive
         ? "text-blue-700 after:w-full"
         : "text-slate-600 after:w-0 hover:text-blue-700 hover:after:w-full"
     }`;

  const closeMobileMenu = () => {
    setIsOpen(false);
    setShowMore(false);
  };

  // Get Started dropdown
  const togglePanelMenu = () => {
    setShowPanelMenu((previous) => !previous);
  };

  const openPanelMenuFromMobile = () => {
    setIsOpen(false);
    setShowMore(false);
    setShowPanelMenu(true);
  };

  const selectPanel = (path) => {
    setShowPanelMenu(false);
    setIsOpen(false);
    setShowMore(false);
    navigate(path);
  };

  // Reverse-geocode GPS coordinates
  const reverseGeocode = async (latitude, longitude) => {
    const url = new URL(
      "https://api.bigdatacloud.net/data/reverse-geocode-client",
    );

    url.searchParams.set("latitude", latitude);
    url.searchParams.set("longitude", longitude);
    url.searchParams.set("localityLanguage", "en");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Unable to retrieve address.");
    }

    const data = await response.json();
    const administrativeAreas = data.localityInfo?.administrative || [];

    const city =
      data.city ||
      data.locality ||
      administrativeAreas.find((item) => item.adminLevel === 6)?.name ||
      administrativeAreas.find((item) => item.adminLevel === 5)?.name ||
      "";

    const state = data.principalSubdivision || "";

    let address = "Current location";

    if (city && state && city.toLowerCase() !== state.toLowerCase()) {
      address = `${city}, ${state}`;
    } else if (city) {
      address = city;
    } else if (state) {
      address = state;
    }

    return { address, data };
  };

  // Detect current GPS location
  const getCurrentLocation = () => {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Your browser does not support location detection.");
      return;
    }

    setLocationLoading(true);
    setLocation("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        const initialLocation = {
          latitude,
          longitude,
          accuracy,
          address: "Finding your city...",
          updatedAt: new Date().toISOString(),
        };

        try {
          localStorage.setItem(LOCATION_KEY, JSON.stringify(initialLocation));
        } catch (error) {
          console.error("Unable to save location:", error);
        }

        window.dispatchEvent(
          new CustomEvent("userLocationUpdated", {
            detail: initialLocation,
          }),
        );

        try {
          const { address, data } = await reverseGeocode(latitude, longitude);

          const updatedLocation = {
            latitude,
            longitude,
            accuracy,
            address,
            updatedAt: new Date().toISOString(),
            city: data.city || data.locality || "",
            state: data.principalSubdivision || "",
          };

          try {
            localStorage.setItem(LOCATION_KEY, JSON.stringify(updatedLocation));
          } catch (error) {
            console.error("Unable to save location:", error);
          }

          setLocation(address);

          window.dispatchEvent(
            new CustomEvent("userLocationUpdated", {
              detail: updatedLocation,
            }),
          );

          if (accuracy > 1000) {
            setLocationError(
              `Your device reported an approximate location (accuracy about ${(accuracy / 1000).toFixed(1)} km). Check your device location settings if the city seems wrong.`,
            );
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setLocation("Coordinates detected");
          setLocationError(
            "GPS was detected, but the city name could not be retrieved. Please try again.",
          );
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("GPS detection error:", error);
        setLocationLoading(false);

        switch (error.code) {
          case 1:
            setLocation("Permission denied");
            setLocationError(
              "Please allow location access in your browser settings.",
            );
            break;

          case 2:
            setLocation("Location unavailable");
            setLocationError(
              "Your device could not determine your current location.",
            );
            break;

          case 3:
            setLocation("Location timed out");
            setLocationError("Location detection timed out. Please try again.");
            break;

          default:
            setLocation("Detect location");
            setLocationError("Unable to detect your current location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );
  };

  // Reusable location button
  const LocationButton = ({ mobile = false }) => (
    <button
      type="button"
      onClick={getCurrentLocation}
      disabled={locationLoading}
      title="Detect my current location"
      className={`group flex items-center gap-2.5 rounded-xl text-left
        transition-all duration-200 disabled:cursor-wait
        ${
          mobile
            ? "w-full px-4 py-3.5 hover:bg-blue-50"
            : "max-w-56 border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 hover:border-blue-200 hover:bg-blue-50/70"
        }`}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center
                   rounded-lg bg-white text-blue-700 shadow-sm
                   ring-1 ring-slate-200/70"
      >
        {locationLoading ? (
          <LoaderCircle size={17} className="animate-spin" />
        ) : mobile ? (
          <LocateFixed size={17} />
        ) : (
          <MapPin size={17} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="block text-[10px] font-bold uppercase
                         tracking-[0.14em] text-slate-400"
        >
          {locationLoading ? "Please wait" : "Your location"}
        </span>

        <span
          className="block truncate text-xs font-semibold
                         text-slate-700 group-hover:text-blue-700"
        >
          {location}
        </span>
      </span>

      {!mobile && (
        <ChevronDown
          size={14}
          className="shrink-0 text-slate-400 group-hover:text-blue-600"
        />
      )}
    </button>
  );

  // Reusable panel dropdown
  const PanelDropdown = ({ mobile = false }) => (
    <div
      ref={panelMenuRef}
      className={`${
        mobile ? "w-full" : "absolute right-0 top-[calc(100%+12px)] w-80"
      } z-17 overflow-hidden rounded-2xl border
        border-slate-200 bg-white p-2
        shadow-[0_18px_50px_rgba(15,23,42,0.16)]`}
    >
      <div className="px-3 pb-3 pt-3">
        <h3 className="font-serif text-lg font-bold text-slate-900">
          Choose Your Panel
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Select how you want to use FixNear.
        </p>
      </div>

      <div className="border-t border-slate-100 pt-2">
        {panels.map((panel) => {
          const Icon = panel.icon;

          return (
            <button
              key={panel.path}
              type="button"
              onClick={() => selectPanel(panel.path)}
              className="group flex w-full items-center gap-3
                         rounded-xl p-3 text-left transition
                         hover:bg-blue-50 focus:outline-none
                         focus:ring-2 focus:ring-blue-500"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center
                            justify-center rounded-xl ${panel.iconStyle}`}
              >
                <Icon size={22} />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className="block text-sm font-bold text-slate-900
                                 group-hover:text-blue-700"
                >
                  {panel.title}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {panel.description}
                </span>
              </span>

              <ArrowRight
                size={17}
                className="shrink-0 text-slate-400
                           transition group-hover:translate-x-1
                           group-hover:text-blue-700"
              />
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b border-slate-200/80
                         bg-white/95 shadow-[0_4px_24px_rgba(15,23,42,0.045)]
                         backdrop-blur-xl"
      >
        <div className="h-1 bg-linear-to-r from-blue-800 via-blue-600 to-sky-400" />

        <div
          className="mx-auto flex min-h-19 max-w-7xl
                        items-center justify-between gap-4 px-4
                        sm:px-6 lg:px-8"
        >
          {/* Logo */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="group flex shrink-0 items-center"
            aria-label="FixNear home"
          >
            <img
              src="/images/FixnearFooterLogo.png"
              alt="FixNear"
              className="h-14 w-auto max-w-52 object-contain
                         transition duration-300 group-hover:scale-[1.02]
                         sm:h-16 sm:max-w-64"
            />
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-6 xl:flex">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>

            <NavLink to="/services" className={navLinkClass}>
              Services
            </NavLink>

            <NavLink to="/providers" className={navLinkClass}>
              Providers
            </NavLink>

            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setShowMore((previous) => !previous)}
                aria-expanded={showMore}
                className={`flex items-center gap-1.5 px-1 py-2.5
                  text-[13px] font-semibold tracking-wide transition-colors
                  ${
                    showMore
                      ? "text-blue-700"
                      : "text-slate-600 hover:text-blue-700"
                  }`}
              >
                More
                <ChevronDown
                  size={15}
                  className={`transition-transform duration-200 ${
                    showMore ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showMore && (
                <div
                  className="absolute right-0 top-[calc(100%+14px)]
                                w-64 overflow-hidden rounded-2xl border
                                border-slate-200 bg-white p-2
                                shadow-[0_18px_50px_rgba(15,23,42,0.13)]"
                >
                  <div className="px-3 pb-2 pt-3">
                    <p className="font-serif text-base font-bold text-slate-900">
                      Explore FixNear
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Help and information
                    </p>
                  </div>

                  <div className="my-1 border-t border-slate-100" />

                  {[
                    {
                      label: "Contact Us",
                      description: "Get in touch with our team",
                      to: "/contact",
                    },
                    {
                      label: "Help & Support",
                      description: "Find answers and assistance",
                      to: "/help-support",
                    },
                    {
                      label: "Become a Provider",
                      description: "Grow your local business",
                      to: "/provider/register",
                    },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setShowMore(false)}
                      className="group flex items-center justify-between
                                 rounded-xl px-3 py-3 transition
                                 hover:bg-blue-50"
                    >
                      <span>
                        <span
                          className="block text-sm font-semibold
                                         text-slate-800 group-hover:text-blue-700"
                        >
                          {item.label}
                        </span>
                        <span className="mt-1 block text-[11px] text-slate-400">
                          {item.description}
                        </span>
                      </span>

                      <ArrowUpRight
                        size={16}
                        className="text-slate-300 group-hover:text-blue-600"
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2.5 lg:flex">
            <LocationButton />

            <Link
              to="/login"
              className="group inline-flex items-center gap-2
                         rounded-xl px-3.5 py-2.5 text-[13px]
                         font-semibold text-slate-700 transition
                         hover:bg-slate-100 hover:text-blue-700"
            >
              <LogIn
                size={17}
                className="text-slate-500 group-hover:text-blue-600"
              />
              Login
            </Link>

            {/* Get Started dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={togglePanelMenu}
                aria-expanded={showPanelMenu}
                aria-haspopup="true"
                className="group inline-flex items-center gap-2
                           rounded-xl bg-blue-700 px-4 py-3
                           text-[13px] font-bold text-white
                           shadow-md shadow-blue-700/20 transition
                           hover:-translate-y-0.5 hover:bg-blue-800"
              >
                Get Started
                <ChevronDown
                  size={15}
                  className={`transition-transform ${
                    showPanelMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showPanelMenu && <PanelDropdown />}
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setIsOpen((previous) => !previous)}
            className="flex h-11 w-11 items-center justify-center
                       rounded-xl border border-slate-200 bg-white
                       text-slate-700 transition hover:border-blue-200
                       hover:bg-blue-50 hover:text-blue-700 lg:hidden"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div
            className="border-t border-slate-200 bg-white
                          shadow-lg lg:hidden"
          >
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
              <nav className="space-y-1">
                {[
                  { label: "Home", to: "/" },
                  { label: "Services", to: "/services" },
                  { label: "Providers", to: "/providers" },
                  { label: "About", to: "/about" },
                  { label: "Contact Us", to: "/contact" },
                  { label: "Help & Support", to: "/help-support" },
                  {
                    label: "Become a Provider",
                    to: "/provider/register",
                  },
                ].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-xl
                       px-4 py-3 text-sm font-semibold transition
                       ${
                         isActive
                           ? "bg-blue-50 text-blue-700"
                           : "text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                       }`
                    }
                  >
                    {item.label}
                    <ArrowUpRight size={15} className="text-slate-300" />
                  </NavLink>
                ))}
              </nav>

              {/* Mobile location */}
              <div
                className="mt-4 rounded-2xl border border-slate-200
                              bg-slate-50/70 p-2"
              >
                <LocationButton mobile />
              </div>

              {/* Mobile actions */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center gap-2
                             rounded-xl border border-slate-200
                             bg-white px-3 py-3 text-sm font-semibold
                             text-slate-700 transition hover:border-blue-200
                             hover:text-blue-700"
                >
                  <UserRound size={17} />
                  Login
                </Link>

                <button
                  type="button"
                  onClick={openPanelMenuFromMobile}
                  className="flex items-center justify-center gap-2
                             rounded-xl bg-blue-700 px-3 py-3
                             text-sm font-bold text-white
                             transition hover:bg-blue-800"
                >
                  Get Started
                  <ChevronDown size={15} />
                </button>
              </div>

              {/* Mobile panel dropdown */}
              {showPanelMenu && (
                <div className="mt-3">
                  <PanelDropdown mobile />
                </div>
              )}

              <p
                className="mt-5 text-center text-[10px] font-medium
                            uppercase tracking-[0.15em] text-slate-400"
              >
                Local services. Trusted professionals.
              </p>
            </div>
          </div>
        )}

        {/* Location notice */}
        {locationError && (
          <div
            role="status"
            className="absolute right-4 top-full z-50 mt-2
                       w-[min(20rem,calc(100vw-2rem))]
                       rounded-xl border border-red-200 bg-white
                       p-3 text-sm text-red-600 shadow-xl"
          >
            <p className="font-semibold">Location notice</p>
            <p className="mt-1 text-xs leading-relaxed">{locationError}</p>

            <button
              type="button"
              onClick={() => setLocationError("")}
              className="mt-2 text-xs font-bold text-red-700 underline
                         underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        )}
      </header>
    </>
  );
}

export default PublicNavbar;
