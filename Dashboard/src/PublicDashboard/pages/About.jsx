import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wrench,
  HeartHandshake,
} from "lucide-react";

const stats = [
  { number: "10K+", label: "Service Bookings" },
  { number: "2.5K+", label: "Professionals" },
  { number: "50+", label: "Service Categories" },
  { number: "4.8/5", label: "Average Rating" },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Trust & Safety",
    description:
      "Explore professional profiles and available information to make more informed service decisions.",
  },
  {
    icon: Users,
    title: "Local Community",
    description:
      "Discover local professionals and connect with people offering services in your area.",
  },
  {
    icon: Sparkles,
    title: "Simple Experience",
    description:
      "Find services, compare professionals and submit booking requests through one convenient platform.",
  },
  {
    icon: BadgeCheck,
    title: "Professional Quality",
    description:
      "Review service details, experience and customer ratings before choosing a professional.",
  },
];

const steps = [
  {
    icon: Search,
    title: "Discover",
    description:
      "Search for the service you need and explore professionals available in your area.",
  },
  {
    icon: Users,
    title: "Compare",
    description:
      "Review profiles, ratings, experience and service information to find a suitable professional.",
  },
  {
    icon: Clock3,
    title: "Book",
    description: "Choose a suitable service and submit your booking request.",
  },
  {
    icon: CheckCircle2,
    title: "Get Service",
    description:
      "Coordinate with your selected professional and get your service completed.",
  },
];

const highlights = [
  "Discover local services in one place",
  "Explore professional profiles and ratings",
  "Submit service booking requests",
];

function SectionLabel({ children, dark = false }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
        dark
          ? "border-blue-400/20 bg-blue-500/10 text-blue-300"
          : "border-blue-100 bg-blue-50 text-blue-700"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
      {children}
    </span>
  );
}

function About() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* ==================== HERO ==================== */}

      <section className="relative isolate overflow-hidden bg-slate-950">
        <div className="absolute -left-40 top-10 -z-10 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -right-40 bottom-0 -z-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.18),transparent_45%)]" />

        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <SectionLabel dark>
                <Wrench size={14} />
                About FIXNEAR
              </SectionLabel>

              <h1 className="mt-7 max-w-2xl text-4xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Local services,
                <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text pb-2 text-transparent">
                  made simpler.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                FIXNEAR brings customers and local professionals closer
                together. Discover services, explore professional profiles and
                find the right help for your everyday needs.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-500"
                >
                  Explore Services
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/providers"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Find Professionals
                  <Users size={17} />
                </Link>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-400" />
                  Convenient discovery
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-400" />
                  Local professionals
                </span>
              </div>
            </div>

            {/* Hero visual */}

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-blue-500/20 to-cyan-400/5 blur-2xl" />

              <div className="relative rounded-[2rem] border border-white/10 bg-white/10 p-2 shadow-2xl backdrop-blur-xl">
                <div className="overflow-hidden rounded-[1.6rem] bg-white">
                  <div className="relative h-64 sm:h-80">
                    <img
                      src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1100&q=85"
                      alt="Professional providing home services"
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />

                    <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                        Local Services. Trusted Professionals.
                      </span>

                      <h2 className="mt-2 max-w-sm text-2xl font-black leading-tight text-white sm:text-3xl">
                        The right help, closer to home.
                      </h2>
                    </div>

                    <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Made for local needs
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                        <Users size={20} />
                      </div>
                      <p className="mt-3 text-xl font-black text-slate-900">
                        Local
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Professionals in your community
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                        <Star size={20} fill="currentColor" />
                      </div>
                      <p className="mt-3 text-xl font-black text-slate-900">
                        Compare
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Review ratings and service details
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating card */}

              <div className="absolute -left-3 top-12 hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:block lg:-left-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <HeartHandshake size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">
                      Built around you
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Your local service connection
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== STATS ==================== */}

      <section className="relative border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`px-3 py-7 text-center sm:py-9 ${
                index < 2 ? "border-b border-slate-100 lg:border-b-0" : ""
              } ${index % 2 === 0 ? "lg:border-l-0" : ""} ${
                index !== 3 ? "lg:border-r lg:border-slate-200" : ""
              }`}
            >
              <p className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {stat.number}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-500 sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== OUR STORY ==================== */}

      <section className="bg-slate-50 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -bottom-5 -left-5 h-36 w-36 rounded-full bg-blue-100/70 blur-2xl" />

              <div className="relative rounded-[2rem] border border-slate-200 bg-white p-2 shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1100&q=85"
                  alt="Professionals working together"
                  className="h-72 w-full rounded-[1.5rem] object-cover sm:h-96"
                  loading="lazy"
                />

                <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/70 bg-white/95 p-4 shadow-lg backdrop-blur sm:bottom-8 sm:left-8 sm:right-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <Wrench size={21} />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900">FIXNEAR</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Local Services. Trusted Professionals.
                      </p>
                    </div>
                    <BadgeCheck
                      size={23}
                      className="ml-auto shrink-0 text-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionLabel>Our Story</SectionLabel>

              <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[2.7rem]">
                Everyday service needs deserve a simpler solution.
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600">
                Finding someone for a repair, cleaning or other household
                service can take time. Customers often have to search in
                different places, compare professionals and work out how to
                contact them.
              </p>

              <p className="mt-4 text-base leading-8 text-slate-600">
                FIXNEAR brings service discovery and professional information
                together in one place, helping customers explore their options
                and submit booking requests more conveniently.
              </p>

              <div className="mt-7 space-y-4">
                {highlights.map((highlight) => (
                  <div key={highlight} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <CheckCircle2 size={16} />
                    </div>
                    <p className="text-sm font-semibold leading-6 text-slate-700">
                      {highlight}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                to="/services"
                className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-blue-700 transition hover:gap-3 hover:text-blue-800"
              >
                Discover our services
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== MISSION ==================== */}

      <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
        <div className="absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Globe size={26} />
          </div>

          <SectionLabel>Our Mission</SectionLabel>

          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Connecting people with the services they need.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Our mission is to make local service discovery convenient for
            customers while helping service professionals build their presence
            in the communities they serve. We want to create a straightforward
            experience for finding services, comparing options and requesting
            bookings.
          </p>

          <div className="mx-auto mt-8 h-1 w-20 rounded-full bg-gradient-to-r from-blue-700 to-cyan-400" />
        </div>
      </section>

      {/* ==================== CORE VALUES ==================== */}

      <section className="bg-slate-50 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel>What Matters to Us</SectionLabel>

            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              The values behind FIXNEAR
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              The principles that guide the experience we are building for
              customers and local professionals.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => {
              const Icon = value.icon;

              return (
                <article
                  key={value.title}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50 sm:p-7"
                >
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-blue-50/70 transition group-hover:bg-blue-100/80" />

                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition duration-300 group-hover:bg-blue-600 group-hover:text-white">
                        <Icon size={23} />
                      </div>
                      <span className="text-sm font-black text-slate-200">
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-6 text-lg font-extrabold text-slate-900">
                      {value.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {value.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}

      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel>Simple Process</SectionLabel>

            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              How FIXNEAR works
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Four straightforward steps to help you discover and request the
              service you need.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.title}
                  className="group relative rounded-3xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100 transition group-hover:bg-slate-950">
                      <Icon size={22} />
                    </div>

                    <span className="text-3xl font-black tracking-tight text-slate-100 transition group-hover:text-blue-100">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-extrabold text-slate-900">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {step.description}
                  </p>

                  {index < steps.length - 1 && (
                    <div className="mt-6 hidden items-center gap-2 text-xs font-bold text-blue-600 lg:flex">
                      NEXT STEP
                      <ArrowRight size={14} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== CONTACT ==================== */}

      <section className="relative isolate overflow-hidden bg-slate-950 py-16 sm:py-20 lg:py-24">
        <div className="absolute -left-40 top-0 -z-10 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -right-40 bottom-0 -z-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionLabel dark>Let's Connect</SectionLabel>

              <h2 className="mt-5 max-w-xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Have a question?
                <span className="block text-blue-400">We're here to help.</span>
              </h2>

              <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                Need help navigating FIXNEAR or want to learn more about the
                platform? Visit our contact page and support resources.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  Contact Us
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/help-support"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Help & Support
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <a
                href="https://maps.google.com/?q=Patna,Bihar,India"
                target="_blank"
                rel="noreferrer"
                className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-blue-400/40 hover:bg-white/10"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                  <MapPin size={21} />
                </div>
                <h3 className="mt-4 font-extrabold text-white">Location</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Patna, Bihar, India
                </p>
              </a>

              <a
                href="mailto:support@fixnear.com"
                className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-blue-400/40 hover:bg-white/10"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                  <Mail size={21} />
                </div>
                <h3 className="mt-4 font-extrabold text-white">Email</h3>
                <p className="mt-2 break-all text-sm text-slate-400">
                  support@fixnear.com
                </p>
              </a>

              <a
                href="tel:+918340252282"
                className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-blue-400/40 hover:bg-white/10"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                  <Phone size={21} />
                </div>
                <h3 className="mt-4 font-extrabold text-white">Phone</h3>
                <p className="mt-2 text-sm text-slate-400">+91 8340252282</p>
              </a>

              <Link
                to="/help-support"
                className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-blue-400/40 hover:bg-white/10"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                  <MessageCircle size={21} />
                </div>
                <h3 className="mt-4 font-extrabold text-white">Support</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Visit our help resources
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}

      <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 px-6 py-12 shadow-2xl shadow-blue-200/70 sm:px-12 sm:py-16 lg:px-16">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[40px] border-white/5" />
          <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-cyan-300/10 blur-2xl" />

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-lg backdrop-blur">
              <Wrench size={26} />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
              Your local service connection
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Find the help you need, closer to home.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              Explore local services, compare professional information and
              discover the right next step for your everyday needs.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Explore Services
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/provider/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-white/20"
              >
                Become a Provider
                <Users size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default About;
