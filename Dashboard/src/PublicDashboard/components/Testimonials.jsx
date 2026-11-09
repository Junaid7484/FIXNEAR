import React from "react";
import {
  Star,
  Quote,
  BadgeCheck,
  MapPin,
  ThumbsUp,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: "Aman Kumar",
      role: "Customer",
      location: "Bhagalpur, Bihar",
      image: "https://i.pravatar.cc/150?img=12",
      rating: 5,
      service: "Electrical Service",
      text: "FIXNEAR made it very easy to find a reliable electrician near my home. The service was quick, professional and affordable.",
    },
    {
      id: 2,
      name: "Priya Singh",
      role: "Customer",
      location: "Bhagalpur, Bihar",
      image: "https://i.pravatar.cc/150?img=47",
      rating: 5,
      service: "Home Cleaning",
      text: "I booked a cleaning service through FIXNEAR and the entire experience was smooth. I could easily check the provider details and reviews.",
    },
    {
      id: 3,
      name: "Rohit Kumar",
      role: "Customer",
      location: "Bhagalpur, Bihar",
      image: "https://i.pravatar.cc/150?img=33",
      rating: 4,
      service: "Plumbing Service",
      text: "Finding a plumber used to take a lot of time. With FIXNEAR I found a nearby professional and booked the service in just a few minutes.",
    },
  ];

  const stats = [
    {
      value: "4.8/5",
      label: "Average Customer Rating",
      icon: Star,
    },
    {
      value: "1,000+",
      label: "Happy Customers",
      icon: ShieldCheck,
    },
    {
      value: "500+",
      label: "Services Completed",
      icon: ThumbsUp,
    },
  ];

  return (
    <section className="relative overflow-hidden bg-slate-50 py-20 sm:py-24 lg:py-28">
      {/* DECORATIVE BACKGROUND */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-sky-100/60 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-blue-700 shadow-sm">
            <Sparkles size={15} className="text-blue-600" />
            Customer Stories
          </span>

          <h2 className="mt-6 font-serif text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Trust built through
            <span className="mt-1 block text-blue-700">every experience.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
            Discover what customers say about finding trusted local
            professionals with FIXNEAR. Every review reflects an experience that
            helps our community make informed choices.
          </p>

          {/* RATING SUMMARY */}
          <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-3 shadow-sm">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={16}
                  className="fill-amber-400 text-amber-400"
                />
              ))}
            </div>

            <span className="h-4 w-px bg-slate-200" />

            <span className="text-sm font-bold text-slate-800">
              4.8 out of 5
            </span>

            <span className="text-xs text-slate-400">
              Customer satisfaction
            </span>
          </div>
        </div>

        {/* TESTIMONIAL CARDS */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(30,64,175,0.09)] sm:p-7"
            >
              {/* TOP ACCENT */}
              <div className="absolute left-0 top-0 h-1 w-full origin-left scale-x-0 bg-gradient-to-r from-blue-800 via-blue-600 to-sky-400 transition-transform duration-300 group-hover:scale-x-100" />

              {/* QUOTE ICON */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                      className="h-14 w-14 rounded-2xl border border-slate-200 object-cover"
                    />

                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white">
                      <BadgeCheck size={13} />
                    </span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="font-serif text-base font-bold text-slate-900">
                        {testimonial.name}
                      </h3>
                    </div>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {testimonial.role}
                    </p>
                  </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition duration-300 group-hover:bg-blue-600 group-hover:text-white">
                  <Quote size={19} />
                </div>
              </div>

              {/* LOCATION */}
              <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
                <MapPin size={14} className="shrink-0 text-blue-500" />
                <span>{testimonial.location}</span>
              </div>

              {/* STARS */}
              <div
                className="mt-5 flex items-center gap-1"
                aria-label={`${testimonial.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={16}
                    className={
                      index < testimonial.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    }
                  />
                ))}

                <span className="ml-2 text-xs font-bold text-slate-700">
                  {testimonial.rating}.0
                </span>
              </div>

              {/* REVIEW TEXT */}
              <blockquote className="mt-5 flex-1 font-serif text-[15px] leading-7 text-slate-600">
                “{testimonial.text}”
              </blockquote>

              {/* SERVICE TAG */}
              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  {testimonial.service}
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <ThumbsUp size={14} className="text-blue-500" />
                  Helpful
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* TRUST STATS */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:mt-16">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                  <Icon
                    size={21}
                    className={
                      stat.label === "Average Customer Rating"
                        ? "fill-current"
                        : ""
                    }
                  />
                </div>

                <div>
                  <p className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                    {stat.label}
                  </p>
                </div>

                <ArrowUpRight
                  size={17}
                  className="ml-auto shrink-0 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-600"
                />
              </div>
            );
          })}
        </div>

        {/* CLOSING MESSAGE */}
        <div className="mt-12 text-center">
          <p className="text-sm leading-7 text-slate-500">
            Thank you for making FIXNEAR part of your community.
          </p>
          <div className="mx-auto mt-4 h-[2px] w-16 rounded-full bg-gradient-to-r from-blue-800 via-blue-600 to-sky-400" />
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
