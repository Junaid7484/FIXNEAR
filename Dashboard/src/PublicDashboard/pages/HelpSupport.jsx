import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  MessageCircle,
  CalendarDays,
  UserRound,
  CreditCard,
  ShieldCheck,
  Wrench,
  ChevronDown,
  CircleHelp,
  X,
  Sparkles,
  Headphones,
  LifeBuoy,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

const helpTopics = [
  {
    id: "bookings",
    title: "Bookings",
    description:
      "Book, cancel, reschedule, and track your service appointments.",
    icon: CalendarDays,
    color: "blue",
    questions: [
      {
        question: "How do I book a service?",
        answer:
          "Browse available services, select a professional, choose your preferred date and time, and confirm your booking. You can then track your booking from your customer dashboard.",
      },
      {
        question: "Can I cancel my booking?",
        answer:
          "Open your customer dashboard, select the relevant booking, and use the cancellation option if it is available. Review the cancellation policy before confirming.",
      },
      {
        question: "How can I check my booking status?",
        answer:
          "Sign in to your customer account and open the bookings section. Your booking status should appear alongside the relevant booking details.",
      },
      {
        question: "Can I change my booking date or time?",
        answer:
          "If rescheduling is supported for your booking, check the booking details in your dashboard. Otherwise, contact support for assistance.",
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    description:
      "Manage your profile, password, login, and account information.",
    icon: UserRound,
    color: "purple",
    questions: [
      {
        question: "How do I update my profile?",
        answer:
          "Sign in and open your profile or account settings. Update the available fields and save your changes.",
      },
      {
        question: "I forgot my password. What should I do?",
        answer:
          "Use the Forgot Password link on the login page and follow the available password-reset instructions.",
      },
      {
        question: "How do I create an account?",
        answer:
          "Open the Register page, complete the required fields, and submit the form. Follow any additional verification steps shown by FIXNEAR.",
      },
      {
        question: "Why can't I log in?",
        answer:
          "Check that your email and password are correct. If the problem continues, use the password-reset option or contact support.",
      },
    ],
  },
  {
    id: "services",
    title: "Services",
    description:
      "Find trusted professionals and explore available local services.",
    icon: Wrench,
    color: "green",
    questions: [
      {
        question: "How do I find a service professional?",
        answer:
          "Browse the services or providers section, search for the service you need, and review the available professional profiles.",
      },
      {
        question: "How do I become a service provider?",
        answer:
          "Open the provider registration page, complete the application, and submit the required information. If approval is required, wait for the application status to update.",
      },
      {
        question: "What if no professional is available?",
        answer:
          "Try a different date or search area if those options are available. You can also check again later or contact support.",
      },
      {
        question: "How can I review a professional?",
        answer:
          "If reviews are enabled for your completed booking, open the relevant booking or review section and submit your feedback.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    description:
      "Get help with payment methods, charges, and booking payments.",
    icon: CreditCard,
    color: "orange",
    questions: [
      {
        question: "Which payment methods are supported?",
        answer:
          "Available payment methods depend on the options enabled by FIXNEAR. Check the payment section during booking for the methods currently offered.",
      },
      {
        question: "What should I do if a payment fails?",
        answer:
          "Check your payment details and account balance, then try again if appropriate. If money was deducted but your booking was not confirmed, contact support with your transaction details.",
      },
      {
        question: "How can I ask about a charge?",
        answer:
          "Contact support and provide the relevant booking reference, transaction information, and a brief explanation of the charge.",
      },
    ],
  },
  {
    id: "safety",
    title: "Safety & Trust",
    description:
      "Learn about account security, provider verification, and safe bookings.",
    icon: ShieldCheck,
    color: "red",
    questions: [
      {
        question: "How are professionals verified?",
        answer:
          "Verification depends on the checks implemented by FIXNEAR. Review the information displayed on a professional's profile and contact support if you have questions about their verification status.",
      },
      {
        question: "How do I keep my account secure?",
        answer:
          "Use a strong, unique password, do not share your login credentials, and sign out when using a shared device.",
      },
      {
        question: "What if I have a safety concern?",
        answer:
          "If you feel unsafe or suspect fraudulent activity, prioritize your immediate safety and contact the appropriate local emergency services when necessary. You can also report the concern to FIXNEAR support.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact Support",
    description: "Find the next step when you need help from our support team.",
    icon: MessageCircle,
    color: "indigo",
    questions: [
      {
        question: "How do I contact FIXNEAR support?",
        answer:
          "Open the Contact Us page to see the contact options provided by your FIXNEAR application.",
      },
      {
        question: "What information should I include in a support request?",
        answer:
          "Explain the issue clearly and include the relevant booking reference or account details needed to investigate it. Never send your password or other sensitive login credentials.",
      },
    ],
  },
];

const colorStyles = {
  blue: {
    icon: "bg-blue-100 text-blue-700",
    active: "border-blue-400 ring-2 ring-blue-100",
    hover: "hover:border-blue-300 hover:bg-blue-50/50",
    badge: "bg-blue-50 text-blue-700",
  },
  purple: {
    icon: "bg-purple-100 text-purple-700",
    active: "border-purple-400 ring-2 ring-purple-100",
    hover: "hover:border-purple-300 hover:bg-purple-50/50",
    badge: "bg-purple-50 text-purple-700",
  },
  green: {
    icon: "bg-emerald-100 text-emerald-700",
    active: "border-emerald-400 ring-2 ring-emerald-100",
    hover: "hover:border-emerald-300 hover:bg-emerald-50/50",
    badge: "bg-emerald-50 text-emerald-700",
  },
  orange: {
    icon: "bg-orange-100 text-orange-700",
    active: "border-orange-400 ring-2 ring-orange-100",
    hover: "hover:border-orange-300 hover:bg-orange-50/50",
    badge: "bg-orange-50 text-orange-700",
  },
  red: {
    icon: "bg-rose-100 text-rose-700",
    active: "border-rose-400 ring-2 ring-rose-100",
    hover: "hover:border-rose-300 hover:bg-rose-50/50",
    badge: "bg-rose-50 text-rose-700",
  },
  indigo: {
    icon: "bg-indigo-100 text-indigo-700",
    active: "border-indigo-400 ring-2 ring-indigo-100",
    hover: "hover:border-indigo-300 hover:bg-indigo-50/50",
    badge: "bg-indigo-50 text-indigo-700",
  },
};

const HelpSupport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTopic, setActiveTopic] = useState("all");
  const [openQuestion, setOpenQuestion] = useState(null);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredTopics = useMemo(() => {
    return helpTopics
      .filter((topic) => {
        const matchesActive = activeTopic === "all" || topic.id === activeTopic;

        if (!matchesActive) return false;
        if (!normalizedSearch) return true;

        const matchesTopic =
          topic.title.toLowerCase().includes(normalizedSearch) ||
          topic.description.toLowerCase().includes(normalizedSearch);

        const matchesQuestion = topic.questions.some(
          ({ question, answer }) =>
            question.toLowerCase().includes(normalizedSearch) ||
            answer.toLowerCase().includes(normalizedSearch),
        );

        return matchesTopic || matchesQuestion;
      })
      .map((topic) => {
        if (!normalizedSearch) return topic;

        const matchesTopic =
          topic.title.toLowerCase().includes(normalizedSearch) ||
          topic.description.toLowerCase().includes(normalizedSearch);

        return {
          ...topic,
          questions: matchesTopic
            ? topic.questions
            : topic.questions.filter(
                ({ question, answer }) =>
                  question.toLowerCase().includes(normalizedSearch) ||
                  answer.toLowerCase().includes(normalizedSearch),
              ),
        };
      });
  }, [activeTopic, normalizedSearch]);

  const visibleQuestions = useMemo(() => {
    return filteredTopics.flatMap((topic) =>
      topic.questions.map((item) => ({
        ...item,
        topicId: topic.id,
        topicTitle: topic.title,
        color: topic.color,
        id: `${topic.id}-${item.question}`,
      })),
    );
  }, [filteredTopics]);

  const selectTopic = (topicId) => {
    setActiveTopic(topicId);
    setOpenQuestion(null);

    document.getElementById("help-faq")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveTopic("all");
    setOpenQuestion(null);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    document.getElementById("help-results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-800">
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-950 via-blue-950 to-indigo-800 text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-100">
                <Sparkles className="h-4 w-4" />
                Welcome to FIXNEAR Support
              </div>

              <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                We're here to
                <span className="block bg-linear-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  make things easier.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-blue-100/80 sm:text-lg">
                Find quick answers about bookings, service professionals,
                payments, and your account — all in one place.
              </p>

              <form
                onSubmit={handleSearch}
                role="search"
                className="mt-8 max-w-2xl"
              >
                <label htmlFor="help-search" className="sr-only">
                  Search help topics and questions
                </label>

                <div className="group flex items-center gap-3 rounded-2xl border border-white/20 bg-white p-2 shadow-2xl shadow-blue-950/30 transition focus-within:ring-4 focus-within:ring-blue-300/30">
                  <Search className="ml-3 h-5 w-5 shrink-0 text-slate-400" />

                  <input
                    id="help-search"
                    type="search"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setOpenQuestion(null);
                    }}
                    placeholder="Search bookings, passwords, payments..."
                    className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
                  />

                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setOpenQuestion(null);
                      }}
                      aria-label="Clear search"
                      className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    Search
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-3 text-xs text-blue-100/70 sm:text-sm">
                  Search by keyword to find the help you need.
                </p>
              </form>
            </div>

            {/* Hero information card */}
            <div className="hidden lg:block">
              <div className="relative mx-auto max-w-md rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-lg">
                  <Headphones className="h-7 w-7" />
                </div>

                <h2 className="mt-6 text-2xl font-bold">
                  How can we help you today?
                </h2>

                <p className="mt-3 leading-7 text-blue-100/80">
                  Explore our help topics or browse frequently asked questions
                  to get guidance for your FIXNEAR experience.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    "Find answers quickly",
                    "Explore service-related help",
                    "Get guidance for your account",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm text-blue-50"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-300" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-blue-950 shadow-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-3xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <BookOpen className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 text-2xl font-bold">6</p>
              <p className="mt-1 text-xs text-blue-100/70 sm:text-sm">
                Help categories
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <CircleHelp className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 text-2xl font-bold">
                {helpTopics.reduce(
                  (total, topic) => total + topic.questions.length,
                  0,
                )}
              </p>
              <p className="mt-1 text-xs text-blue-100/70 sm:text-sm">
                Common questions
              </p>
            </div>

            <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-1">
              <LifeBuoy className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 text-lg font-bold">Here to help</p>
              <p className="mt-1 text-xs text-blue-100/70 sm:text-sm">
                Explore answers below
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Help categories */}
      <section id="help-results" className="scroll-mt-6 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                Help centre
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Browse help topics
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Choose a category to explore relevant answers and guidance.
              </p>
            </div>

            {(searchTerm || activeTopic !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
              >
                <X className="h-4 w-4" />
                Reset filters
              </button>
            )}
          </div>

          {/* Category quick filters */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => {
                setActiveTopic("all");
                setOpenQuestion(null);
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTopic === "all"
                  ? "bg-slate-900 text-white shadow-md"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100"
              }`}
            >
              All topics
            </button>

            {helpTopics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => {
                  setActiveTopic(topic.id);
                  setOpenQuestion(null);
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTopic === topic.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                }`}
              >
                {topic.title}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTopics.map((topic) => {
              const Icon = topic.icon;
              const colors = colorStyles[topic.color];

              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => selectTopic(topic.id)}
                  className={`group flex h-full flex-col rounded-2xl border bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:p-6 ${
                    activeTopic === topic.id
                      ? colors.active
                      : `border-slate-200 ${colors.hover}`
                  }`}
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl transition group-hover:scale-105 ${colors.icon}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${colors.badge}`}
                    >
                      {topic.questions.length} questions
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    {topic.title}
                  </h3>

                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
                    {topic.description}
                  </p>

                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-600 transition group-hover:gap-3">
                    Explore answers
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              );
            })}
          </div>

          {filteredTopics.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">
                No matching help topics
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                We couldn't find a topic matching your search. Try different
                keywords or reset your filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                <X className="h-4 w-4" />
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section
        id="help-faq"
        className="scroll-mt-6 border-y border-slate-100 bg-white py-12 sm:py-16"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <CircleHelp className="h-6 w-6" />
            </div>

            <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
              Answers and guidance
            </p>

            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Frequently asked questions
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              {normalizedSearch
                ? `Showing answers matching "${searchTerm.trim()}".`
                : activeTopic === "all"
                  ? "Browse common questions or choose a category above."
                  : `Showing questions about ${
                      helpTopics.find((topic) => topic.id === activeTopic)
                        ?.title
                    }.`}
            </p>

            {(normalizedSearch || activeTopic !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-blue-600 transition hover:text-blue-800"
              >
                <X className="h-4 w-4" />
                View all questions
              </button>
            )}
          </div>

          <div className="space-y-3">
            {visibleQuestions.map((item) => {
              const isOpen = openQuestion === item.id;
              const colors = colorStyles[item.color];

              return (
                <div
                  key={item.id}
                  className={`overflow-hidden rounded-2xl border transition duration-200 ${
                    isOpen
                      ? "border-blue-200 bg-blue-50/40 shadow-sm"
                      : "border-slate-200 bg-white hover:border-blue-200"
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenQuestion(isOpen ? null : item.id)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:flex ${colors.icon}`}
                      >
                        <CircleHelp className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-6 text-slate-800 sm:text-base">
                          {item.question}
                        </p>
                        <span
                          className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors.badge}`}
                        >
                          {item.topicTitle}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                        isOpen
                          ? "rotate-180 bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-blue-100 px-4 pb-5 pt-4 sm:pl-18 sm:pr-6">
                      <p className="text-sm leading-7 text-slate-600">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {visibleQuestions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                <Search className="mx-auto h-9 w-9 text-slate-400" />
                <h3 className="mt-4 text-lg font-bold text-slate-800">
                  No questions found
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Try another keyword or view all questions.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Show all questions
                </button>
              </div>
            )}
          </div>

          {/* Contact support banner */}
          <div className="relative mt-10 overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-blue-950 to-indigo-800 p-6 text-white shadow-xl sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                  <MessageCircle className="h-6 w-6 text-cyan-300" />
                </div>

                <div>
                  <h3 className="text-xl font-extrabold">Still need a hand?</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-blue-100/80">
                    Visit our Contact Us page to find the support options
                    available in your FIXNEAR application.
                  </p>
                </div>
              </div>

              <Link
                to="/contact"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              >
                Contact Support
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to FIXNEAR Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HelpSupport;
