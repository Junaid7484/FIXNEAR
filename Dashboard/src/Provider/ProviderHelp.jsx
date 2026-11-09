import { useState } from "react";
import {
  Search,
  HelpCircle,
  CalendarCheck,
  CreditCard,
  UserRound,
  ShieldCheck,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  Send,
  LifeBuoy,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import API from "../services/api";

// =========================================================
// HELP CATEGORIES
// =========================================================

const helpCategories = [
  {
    title: "Bookings",
    description: "Manage bookings and customer requests.",
    icon: CalendarCheck,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Payments",
    description: "Understand payments and payouts.",
    icon: CreditCard,
    color: "bg-green-50 text-green-600",
  },
  {
    title: "Account & Profile",
    description: "Update your provider information.",
    icon: UserRound,
    color: "bg-purple-50 text-purple-600",
  },
  {
    title: "Security",
    description: "Password and account security help.",
    icon: ShieldCheck,
    color: "bg-orange-50 text-orange-600",
  },
];

// =========================================================
// FREQUENTLY ASKED QUESTIONS
// =========================================================

const faqs = [
  {
    category: "Bookings",
    question: "How can I manage my bookings?",
    answer:
      "Open your Provider Dashboard and navigate to Bookings. You can review customer requests and check the current status of each booking. Available actions depend on your booking workflow.",
  },
  {
    category: "Bookings",
    question: "How do I change my working hours?",
    answer:
      "Open Working Hours in your provider panel, update your available days and start/end times, and save your changes.",
  },
  {
    category: "Bookings",
    question: "Why am I not receiving new bookings?",
    answer:
      "Check that your provider profile is complete, your working hours are configured, and your account is approved if approval is required.",
  },
  {
    category: "Payments",
    question: "Where can I check my payments?",
    answer:
      "Open the Earnings section in your provider panel. If payment or payout information is not available, the payment integration may need to be enabled by the platform administrator.",
  },
  {
    category: "Payments",
    question: "What should I do if a payment is missing?",
    answer:
      "Check the booking status and available payment details. If the payment is still missing, contact support with the booking reference. Never share your password or OTP.",
  },
  {
    category: "Account & Profile",
    question: "How do I update my provider profile?",
    answer:
      "Open your Provider Profile page, edit the available details, and save your changes. Check your address, service information, and contact details for accuracy.",
  },
  {
    category: "Account & Profile",
    question: "How do I change my password?",
    answer:
      "Use the password or security options available in your account. If your provider settings do not offer password changes, contact support or use the password recovery flow.",
  },
  {
    category: "Security",
    question: "What should I do if I cannot log in?",
    answer:
      "Check your login credentials and make sure you are using the provider login page. If the problem continues, contact support. Never share your password or authentication token.",
  },
  {
    category: "Security",
    question: "Can I delete my provider account?",
    answer:
      "If account deletion is available in your settings, review the confirmation messages carefully before proceeding. Account deletion may be permanent.",
  },
];

// =========================================================
// PROVIDER HELP PAGE
// =========================================================

const ProviderHelp = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState(null);

  const [contactForm, setContactForm] = useState({
    subject: "",
    email: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  // =======================================================
  // FILTER FAQS
  // =======================================================

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      activeCategory === "All" || faq.category === activeCategory;

    const searchText =
      `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase();

    return matchesCategory && searchText.includes(search.toLowerCase().trim());
  });

  // =======================================================
  // HANDLE FORM INPUTS
  // =======================================================

  const handleContactChange = (event) => {
    const { name, value } = event.target;

    setContactForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =======================================================
  // SUBMIT SUPPORT REQUEST TO BACKEND
  // =======================================================

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setNotice(null);

    const subject = contactForm.subject.trim();
    const email = contactForm.email.trim();
    const message = contactForm.message.trim();

    if (!subject || !email || !message) {
      setNotice({
        type: "error",
        text: "Please complete all fields before submitting.",
      });
      return;
    }

    if (message.length > 5000) {
      setNotice({
        type: "error",
        text: "Your message must be 5000 characters or fewer.",
      });
      return;
    }

    try {
      setSubmitting(true);

      // API base URL should already include /api.
      // Backend endpoint: POST /api/providers/help
      const response = await API.post("/providers/help", {
        category: subject,
        email,
        message,
      });

      setNotice({
        type: "success",
        text:
          response.data?.message ||
          "Your support request has been sent successfully.",
      });

      setContactForm({
        subject: "",
        email: "",
        message: "",
      });
    } catch (error) {
      console.error(
        "Provider help request error:",
        error.response?.data || error.message,
      );

      if (error.response?.status === 401) {
        setNotice({
          type: "error",
          text: "Your session may have expired. Please log in again and retry.",
        });
      } else if (error.response?.status === 403) {
        setNotice({
          type: "error",
          text: "Only an authenticated provider can submit this request.",
        });
      } else {
        setNotice({
          type: "error",
          text:
            error.response?.data?.message ||
            "Unable to send your request. Please check your connection and try again.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // =======================================================
  // PAGE UI
  // =======================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <LifeBuoy size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Help & Support
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Find answers and get help with your FixNear provider account.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Hero */}
        <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-10 text-white sm:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <HelpCircle className="mx-auto mb-4" size={42} />

            <h2 className="text-2xl font-bold sm:text-3xl">
              How can we help you?
            </h2>

            <p className="mt-2 text-blue-100">
              Search common questions or browse help topics below.
            </p>

            <div className="mt-6 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-gray-500 shadow-lg">
              <Search size={21} />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search bookings, payments, account..."
                className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
                aria-label="Search help articles"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-sm font-medium text-blue-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Help Categories */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Browse Help Topics
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose a category to find relevant answers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {helpCategories.map((category) => {
              const Icon = category.icon;
              const selected = activeCategory === category.title;

              return (
                <button
                  key={category.title}
                  type="button"
                  onClick={() =>
                    setActiveCategory(selected ? "All" : category.title)
                  }
                  className={`rounded-xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    selected
                      ? "border-blue-500 ring-2 ring-blue-100"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`rounded-lg p-3 ${category.color}`}>
                      <Icon size={23} />
                    </div>
                    <FileText size={18} className="text-gray-300" />
                  </div>

                  <h3 className="mt-4 font-semibold text-gray-900">
                    {category.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    {category.description}
                  </p>
                </button>
              );
            })}
          </div>

          {activeCategory !== "All" && (
            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Show all help topics
            </button>
          )}
        </section>

        {/* FAQs and Support Information */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                Frequently Asked Questions
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Answers to common provider questions.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => {
                  const isOpen = openFaq === faq.question;

                  return (
                    <div
                      key={faq.question}
                      className={index !== 0 ? "border-t border-gray-200" : ""}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : faq.question)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left hover:bg-gray-50 sm:px-6"
                        aria-expanded={isOpen}
                      >
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            {faq.category}
                          </span>

                          <h3 className="mt-1 font-medium text-gray-900">
                            {faq.question}
                          </h3>
                        </div>

                        {isOpen ? (
                          <ChevronUp
                            size={20}
                            className="shrink-0 text-gray-500"
                          />
                        ) : (
                          <ChevronDown
                            size={20}
                            className="shrink-0 text-gray-500"
                          />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 text-sm leading-7 text-gray-600 sm:px-6">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-10 text-center">
                  <Search size={32} className="mx-auto text-gray-300" />

                  <h3 className="mt-3 font-semibold text-gray-900">
                    No matching questions
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Try another search term or select a different category.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setActiveCategory("All");
                    }}
                    className="mt-4 text-sm font-medium text-blue-600"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Support Information */}
          <aside className="space-y-5">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="w-fit rounded-lg bg-blue-50 p-3 text-blue-600">
                <MessageCircle size={23} />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Still need help?
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Describe your issue in the support form and provide enough
                information for the team to investigate.
              </p>

              <a
                href="#contact-support"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                <Mail size={18} />
                Contact Support
              </a>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900">
                Before contacting us
              </h3>

              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <Clock size={19} className="mt-0.5 shrink-0 text-blue-600" />
                  <p className="text-sm leading-6 text-gray-600">
                    Include when the issue occurred and which page you were
                    using.
                  </p>
                </div>

                <div className="flex gap-3">
                  <FileText
                    size={19}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />
                  <p className="text-sm leading-6 text-gray-600">
                    Include the booking reference or error message if relevant.
                  </p>
                </div>

                <div className="flex gap-3">
                  <ShieldCheck
                    size={19}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />
                  <p className="text-sm leading-6 text-gray-600">
                    Never include your password, OTP, or authentication token.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {/* Contact Support Form */}
        <section
          id="contact-support"
          className="rounded-xl border border-gray-200 bg-white"
        >
          <div className="border-b border-gray-200 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                <Mail size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Contact Support
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Send details about the problem you are experiencing.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-5 p-6 sm:p-8">
            {notice && (
              <div
                className={`flex items-start gap-3 rounded-lg border p-4 ${
                  notice.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
                role="status"
              >
                {notice.type === "success" ? (
                  <CheckCircle size={20} className="shrink-0" />
                ) : (
                  <AlertCircle size={20} className="shrink-0" />
                )}

                <p className="text-sm">{notice.text}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="support-subject"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Issue Category
                </label>

                <select
                  id="support-subject"
                  name="subject"
                  value={contactForm.subject}
                  onChange={handleContactChange}
                  required
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                >
                  <option value="">Select an issue</option>
                  <option value="Booking Issue">Booking Issue</option>
                  <option value="Payment Issue">Payment Issue</option>
                  <option value="Profile Issue">Profile Issue</option>
                  <option value="Login or Security">Login or Security</option>
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="support-email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Your Email
                </label>

                <input
                  id="support-email"
                  type="email"
                  name="email"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  placeholder="you@example.com"
                  maxLength={254}
                  required
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="support-message"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Describe Your Issue
              </label>

              <textarea
                id="support-message"
                name="message"
                value={contactForm.message}
                onChange={handleContactChange}
                rows={5}
                maxLength={5000}
                placeholder="Explain what happened and what you have already tried..."
                required
                disabled={submitting}
                className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={18} />
                {submitting ? "Sending..." : "Submit Request"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default ProviderHelp;
