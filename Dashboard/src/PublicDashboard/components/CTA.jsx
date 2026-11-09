import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  Users,
  Wrench,
  CalendarCheck,
  Star,
  Sparkles,
  MapPin,
  BadgeCheck,
} from "lucide-react";

function CTA() {
  const benefits = [
    {
      icon: ShieldCheck,
      title: "Verified Professionals",
      description: "Trusted local experts",
    },
    {
      icon: CheckCircle,
      title: "Transparent Pricing",
      description: "Clear service pricing",
    },
    {
      icon: CalendarCheck,
      title: "Easy Booking",
      description: "Book in a few clicks",
    },
    {
      icon: Users,
      title: "Trusted Community",
      description: "Customer-first service",
    },
  ];

  const serviceHighlights = [
    {
      icon: Wrench,
      title: "Home Repairs",
      description: "Electrical, plumbing & more",
      iconStyle: "bg-blue-500/15 text-blue-300",
    },
    {
      icon: ShieldCheck,
      title: "Verified Experts",
      description: "Professionals you can trust",
      iconStyle: "bg-emerald-500/15 text-emerald-300",
    },
    {
      icon: Star,
      title: "Quality Service",
      description: "Customer-focused experiences",
      iconStyle: "bg-amber-500/15 text-amber-300",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* MAIN CTA CARD */}
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-900/10 sm:rounded-[2.5rem]">
          {/* BACKGROUND DECORATION */}
          <div className="pointer-events-none absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full bg-blue-600/25 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-40 -left-20 -z-10 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

          <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(37,99,235,0.12),transparent_45%,rgba(56,189,248,0.08))]" />

          {/* SUBTLE GRID */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />

          <div className="relative grid grid-cols-1 items-center gap-12 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-16 lg:py-20">
            {/* LEFT CONTENT */}
            <div>
              {/* BRAND BADGE */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 shadow-sm">
                <Sparkles size={16} />
                <span>THE FIXNEAR EXPERIENCE</span>
              </div>

              {/* HEADING */}
              <h2 className="mt-7 max-w-2xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-[3.4rem]">
                Your home deserves
                <span className="mt-1 block bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
                  the right expert.
                </span>
              </h2>

              {/* DESCRIPTION */}
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                From everyday repairs to essential home services, discover local
                professionals and find the right help for your needs—all in one
                convenient place.
              </p>

              {/* BENEFITS */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;

                  return (
                    <div
                      key={benefit.title}
                      className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5 transition duration-300 hover:border-blue-400/30 hover:bg-white/[0.08]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300 transition group-hover:bg-blue-500 group-hover:text-white">
                        <Icon size={20} />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-white">
                          {benefit.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/services"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-600/30"
                >
                  Explore Services
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  to="/provider/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-6 py-3.5 text-sm font-bold text-white transition duration-300 hover:border-white/30 hover:bg-white/10"
                >
                  <Users size={18} />
                  Become a Provider
                </Link>
              </div>

              {/* TRUST NOTE */}
              <div className="mt-7 flex items-center gap-2 text-sm text-slate-400">
                <BadgeCheck size={17} className="shrink-0 text-emerald-400" />
                <span>Discover local services with confidence.</span>
              </div>
            </div>

            {/* RIGHT VISUAL */}
            <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
              {/* FLOATING LOCATION BADGE */}
              <div className="absolute -left-2 top-7 z-20 hidden items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl shadow-slate-950/20 sm:flex lg:-left-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Your neighborhood</p>
                  <p className="text-sm font-bold text-slate-900">
                    Local professionals
                  </p>
                </div>
              </div>

              {/* MAIN GLASS CARD */}
              <div className="rounded-[1.8rem] border border-white/15 bg-white/[0.07] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
                {/* CARD HEADER */}
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-600/20">
                      <Wrench size={23} />
                    </div>

                    <div>
                      <p className="font-bold text-white">FixNear Services</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Help for your everyday needs
                      </p>
                    </div>
                  </div>

                  <span className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Discover
                  </span>
                </div>

                {/* SERVICE HIGHLIGHTS */}
                <div className="mt-5 space-y-3">
                  {serviceHighlights.map((service) => {
                    const Icon = service.icon;

                    return (
                      <Link
                        key={service.title}
                        to="/services"
                        className="group flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 transition duration-300 hover:border-blue-400/30 hover:bg-white/[0.08]"
                      >
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${service.iconStyle}`}
                          >
                            <Icon size={21} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-white transition group-hover:text-blue-300">
                              {service.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                              {service.description}
                            </p>
                          </div>
                        </div>

                        <ArrowRight
                          size={18}
                          className="shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-300"
                        />
                      </Link>
                    );
                  })}
                </div>

                {/* CARD FOOTER */}
                <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-slate-400">
                      Find the help you need
                    </p>
                    <p className="mt-1 text-sm font-bold text-white">
                      Your home. Your choice.
                    </p>
                  </div>

                  <Link
                    to="/providers"
                    className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-blue-50 sm:self-auto"
                  >
                    Find Providers
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              {/* FLOATING TRUST BADGE */}
              <div className="absolute -bottom-5 right-3 z-20 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl shadow-slate-950/20 sm:right-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle size={21} />
                </div>

                <div>
                  <p className="text-xs text-slate-500">Your next step</p>
                  <p className="text-sm font-bold text-slate-900">
                    Find the right service
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ACCENT */}
          <div className="h-1 bg-gradient-to-r from-blue-800 via-blue-500 to-sky-400" />
        </div>
      </div>
    </section>
  );
}

export default CTA;
