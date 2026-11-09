import React from "react";
import { Link } from "react-router-dom";

import {
  MapPin,
  Phone,
  Globe,
  MessageCircle,
  Mail,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Clock3,
  Heart,
  ChevronRight,
} from "lucide-react";

function PublicFooter() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "Home", to: "/" },
    { label: "About Us", to: "/about" },
    { label: "Our Services", to: "/services" },
    { label: "Find Professionals", to: "/providers" },
    { label: "Contact Us", to: "/contact" },
  ];

  const providerLinks = [
    {
      label: "Become a Provider",
      to: "/provider/register",
    },
    {
      label: "List Your Services",
      to: "/provider/register",
    },
    {
      label: "Provider Help",
      to: "/help-support",
    },
    {
      label: "Provider Login",
      to: "/provider/login",
    },
  ];

  const supportLinks = [
    { label: "Help & Support", to: "/help-support" },
    { label: "Privacy Policy", to: "/policy" },
    {
      label: "Terms & Conditions",
      to: "/terms-and-conditions",
    },
  ];

  const socialLinks = [
    {
      label: "Website",
      icon: Globe,
      href: "/",
    },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: "https://wa.me/918340252282",
    },
    {
      label: "Email",
      icon: Mail,
      href: "mailto:fixnearja@gmail.com",
    },
    {
      label: "Call us",
      icon: Phone,
      href: "tel:+918340252282",
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-slate-950 text-white">
      {/* DECORATIVE BACKGROUND */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-sky-500/[0.07] blur-3xl"
      />

      {/* TOP BRAND ACCENT */}
      <div className="h-0.75 bg-linear-to-r from-blue-900 via-blue-500 to-sky-400" />

      {/* MAIN FOOTER */}
      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pb-14 lg:pt-20">
        <div className="grid grid-cols-1 gap-11 sm:grid-cols-2 lg:grid-cols-12 lg:gap-9">
          {/* BRAND COLUMN */}
          <div className="lg:col-span-4">
            <Link
              to="/"
              aria-label="FixNear home"
              className="inline-flex items-center rounded-xl transition-opacity hover:opacity-90"
            >
              {/* CUSTOM FIXNEAR LOGO IMAGE */}
              <img
                src="/images/FixnearFooterLogo.png"
                alt="FixNear - Local services. Trusted professionals."
                className="h-14 w-auto max-w-57.5 object-contain object-left sm:h-16"
              />
            </Link>

            <p className="mt-6 max-w-sm font-serif text-lg leading-8 text-slate-200">
              Your neighborhood, made easier.
            </p>

            <p className="mt-2 max-w-sm text-sm leading-7 text-slate-400">
              Discover trusted local professionals for your everyday needs. From
              home repairs to essential services, FixNear brings dependable help
              closer to you.
            </p>

            {/* TRUST HIGHLIGHTS */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10 text-blue-400">
                  <ShieldCheck size={17} />
                </span>
                Trusted local professionals
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10 text-blue-400">
                  <Clock3 size={17} />
                </span>
                Convenient service discovery
              </div>
            </div>

            {/* SOCIAL AND CONTACT LINKS */}
            <div className="mt-7">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Connect with us
              </p>

              <div className="flex flex-wrap items-center gap-2.5">
                {socialLinks.map((item) => {
                  const Icon = item.icon;
                  const isExternal = item.href.startsWith("https://");
                  const isInternal = item.href === "/";

                  const classes =
                    "flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition duration-200 hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-blue-500/15 hover:text-blue-300";

                  if (isInternal) {
                    return (
                      <Link
                        key={item.label}
                        to={item.href}
                        aria-label={item.label}
                        title={item.label}
                        className={classes}
                      >
                        <Icon size={17} />
                      </Link>
                    );
                  }

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noreferrer" : undefined}
                      aria-label={item.label}
                      title={item.label}
                      className={classes}
                    >
                      <Icon size={17} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div className="lg:col-span-2">
            <h3 className="font-serif text-lg font-bold tracking-wide text-white">
              Explore
            </h3>

            <div className="mb-5 mt-3 h-0.5 w-10 rounded-full bg-blue-500" />

            <nav aria-label="Footer quick links" className="space-y-3.5">
              {quickLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-blue-300"
                >
                  <ChevronRight
                    size={14}
                    className="shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-blue-400"
                  />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* PROVIDER LINKS */}
          <div className="lg:col-span-3">
            <h3 className="font-serif text-lg font-bold tracking-wide text-white">
              For Professionals
            </h3>

            <div className="mb-5 mt-3 h-0.5 w-10 rounded-full bg-blue-500" />

            <nav aria-label="Footer provider links" className="space-y-3.5">
              {providerLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="group flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-blue-300"
                >
                  <ChevronRight
                    size={14}
                    className="shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-blue-400"
                  />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* PROVIDER CTA */}
            <Link
              to="/provider/register"
              className="group mt-6 inline-flex items-center gap-2 rounded-xl border border-blue-400/25 bg-blue-500/10 px-4 py-3 text-xs font-bold text-blue-200 transition hover:border-blue-400/50 hover:bg-blue-500/20"
            >
              Grow your business
              <ArrowUpRight
                size={15}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          {/* CONTACT COLUMN */}
          <div className="lg:col-span-3">
            <h3 className="font-serif text-lg font-bold tracking-wide text-white">
              Get in Touch
            </h3>

            <div className="mb-5 mt-3 h-0.5 w-10 rounded-full bg-blue-500" />

            <div className="space-y-5">
              {/* ADDRESS */}
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-400">
                  <MapPin size={17} />
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Our Location
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-400">
                    Patna, Bihar, India
                  </p>
                </div>
              </div>

              {/* PHONE */}
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-400">
                  <Phone size={17} />
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Call Us
                  </p>
                  <a
                    href="tel:+918340252282"
                    className="mt-1.5 block text-sm text-slate-400 transition hover:text-blue-300"
                  >
                    +91 83402 52282
                  </a>
                </div>
              </div>

              {/* EMAIL */}
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-400">
                  <Mail size={17} />
                </span>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Email Us
                  </p>
                  <a
                    href="mailto:fixnearja@gmail.com"
                    className="mt-1.5 block break-all text-sm text-slate-400 transition hover:text-blue-300"
                  >
                    fixnearja@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* SUPPORT LINK */}
            <Link
              to="/help-support"
              className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-blue-300"
            >
              Visit Help & Support
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>

        {/* FOOTER DIVIDER */}
        <div className="my-10 border-t border-white/10 lg:my-12" />

        {/* BOTTOM BRAND STRIP */}
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <p className="text-xs leading-6 text-slate-500 sm:text-sm">
            © {currentYear}{" "}
            <span className="font-bold tracking-wide text-slate-300">
              FIXNEAR
            </span>
            . All rights reserved.
          </p>

          <nav
            aria-label="Legal links"
            className="flex flex-wrap gap-x-5 gap-y-3"
          >
            {supportLinks.slice(1).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-xs text-slate-500 transition hover:text-blue-300 sm:text-sm"
              >
                {item.label}
              </Link>
            ))}

            <Link
              to="/help-support"
              className="text-xs text-slate-500 transition hover:text-blue-300 sm:text-sm"
            >
              Help & Support
            </Link>
          </nav>
        </div>

        {/* CLOSING BRAND LINE */}
        <div className="mt-8 flex items-center justify-center gap-2 border-t border-white/5 pt-6 text-xs text-slate-500">
          Made for local communities
          <Heart size={13} className="fill-blue-500 text-blue-500" />
          <span className="font-semibold text-slate-400">FIXNEAR</span>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
