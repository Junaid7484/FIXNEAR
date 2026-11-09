import React, { useState } from "react";
import {
  ShieldCheck,
  FileText,
  CalendarCheck,
  CreditCard,
  UserCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  LockKeyhole,
} from "lucide-react";
import { Link } from "react-router-dom";

const policies = [
  {
    id: "privacy",
    title: "Privacy Policy",
    icon: ShieldCheck,
    intro: "Your privacy matters to FixNear.",
    content: [
      {
        heading: "Information We Collect",
        text: "We may collect your name, email address, phone number, service address, account details, booking information, and other information you provide while using FixNear.",
      },
      {
        heading: "How We Use Your Information",
        text: "We use your information to manage accounts, process service bookings, connect customers with providers, send important notifications, improve our platform, and help prevent fraud or misuse.",
      },
      {
        heading: "Information Sharing",
        text: "Relevant booking information may be shared with the selected service provider to fulfill your request. We do not intend to sell your personal information. Information may also be disclosed when legally required.",
      },
      {
        heading: "Data Security",
        text: "We take reasonable measures to protect your information. However, no online platform can guarantee absolute security.",
      },
      {
        heading: "Your Choices",
        text: "You should keep your login credentials confidential and provide accurate account information. Contact FixNear if you need help with your personal data or account.",
      },
    ],
  },
  {
    id: "terms",
    title: "Terms of Service",
    icon: FileText,
    intro: "These terms explain the basic rules for using FixNear.",
    content: [
      {
        heading: "Using FixNear",
        text: "You agree to provide accurate information, use the platform lawfully, and avoid fraudulent, abusive, or misleading activity.",
      },
      {
        heading: "Accounts",
        text: "You are responsible for maintaining the confidentiality of your account credentials and for activity performed through your account. Notify us if you suspect unauthorized access.",
      },
      {
        heading: "Service Providers",
        text: "FixNear connects customers with local service providers. Unless expressly stated otherwise, the actual service is performed by the selected provider, not by FixNear itself.",
      },
      {
        heading: "Service Information",
        text: "Service availability, prices, duration, and descriptions should be reviewed before booking. Final arrangements may depend on the provider and the nature of the work.",
      },
      {
        heading: "Suspension",
        text: "Accounts may be restricted or suspended for suspected fraud, abuse, policy violations, or other legitimate safety and operational reasons, subject to applicable law.",
      },
    ],
  },
  {
    id: "booking",
    title: "Booking & Cancellation Policy",
    icon: CalendarCheck,
    intro: "Understand how bookings and cancellations work.",
    content: [
      {
        heading: "Making a Booking",
        text: "Customers should provide an accurate service address, contact details, requested service, and preferred appointment time.",
      },
      {
        heading: "Booking Confirmation",
        text: "A booking request may require provider acceptance before it is confirmed. Check your booking status and notifications for updates.",
      },
      {
        heading: "Cancellations",
        text: "Customers should cancel through the platform as early as possible. Any cancellation fee or time restriction must be disclosed before the customer confirms the booking.",
      },
      {
        heading: "Rescheduling",
        text: "Rescheduling depends on provider availability. Contact the provider or use the available booking controls to request a new time.",
      },
      {
        heading: "Delays and No-Shows",
        text: "Customers and providers should communicate promptly about delays or missed appointments. Report unresolved issues through the available support channels.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payment Policy",
    icon: CreditCard,
    intro: "Payment terms should be clear before a service is booked.",
    content: [
      {
        heading: "Service Charges",
        text: "Review the displayed service price and any additional charges before confirming a booking. Extra work should be discussed and agreed upon before it is performed.",
      },
      {
        heading: "Payment Methods",
        text: "Available payment methods may include online payments and cash, depending on the options enabled for your booking.",
      },
      {
        heading: "Payment Confirmation",
        text: "Keep your booking details and payment confirmation where applicable. Do not share your passwords, OTPs, or sensitive payment credentials with anyone.",
      },
      {
        heading: "Disputed Payments",
        text: "If you believe a payment is incorrect or duplicated, contact FixNear support with your booking reference and relevant transaction details.",
      },
    ],
  },
  {
    id: "provider",
    title: "Provider Policy",
    icon: UserCheck,
    intro:
      "Providers are expected to deliver reliable and professional service.",
    content: [
      {
        heading: "Accurate Profiles",
        text: "Providers must submit truthful identity, contact, business, service, and pricing information, along with any documents required by FixNear.",
      },
      {
        heading: "Professional Conduct",
        text: "Providers should treat customers respectfully, arrive at agreed times where possible, communicate delays, and perform accepted work with reasonable care.",
      },
      {
        heading: "Bookings and Pricing",
        text: "Providers should keep their availability and service information up to date. They must explain additional costs and obtain customer agreement before proceeding with extra work.",
      },
      {
        heading: "Customer Information",
        text: "Customer details obtained through FixNear should be used only for legitimate service-related purposes and handled confidentially.",
      },
      {
        heading: "Verification and Complaints",
        text: "FixNear may review provider information, booking disputes, and complaints. Misrepresentation, harassment, fraud, or repeated policy violations may result in account restrictions.",
      },
    ],
  },
  {
    id: "refunds",
    title: "Refund & Complaint Policy",
    icon: RefreshCw,
    intro: "We aim to help resolve service and payment concerns fairly.",
    content: [
      {
        heading: "Requesting a Refund",
        text: "If a service was not delivered as agreed or a payment issue occurred, contact support with your booking reference, payment details, and a description of the problem.",
      },
      {
        heading: "Review Process",
        text: "Refund requests may be reviewed using booking records, payment confirmations, and relevant communications. Additional information may be requested before a decision is made.",
      },
      {
        heading: "Eligibility",
        text: "Refund eligibility depends on the circumstances, the payment method, the disclosed booking terms, and applicable law. A refund is not guaranteed for every complaint.",
      },
      {
        heading: "Complaints",
        text: "Customers and providers should submit accurate information and allow a reasonable opportunity for the issue to be reviewed. FixNear may contact the parties involved to investigate.",
      },
      {
        heading: "Resolution",
        text: "Where appropriate, FixNear may help coordinate communication between the customer and provider. Statutory consumer rights remain unaffected.",
      },
    ],
  },
];

const Policy = () => {
  const [activePolicy, setActivePolicy] = useState("privacy");
  const [openSections, setOpenSections] = useState({});

  const selectedPolicy = policies.find((policy) => policy.id === activePolicy);

  const toggleSection = (key) => {
    setOpenSections((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Hero */}
      <section className="bg-linear-to-br from-blue-700 via-blue-600 to-indigo-700 px-4 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <ShieldCheck size={32} />
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
            FixNear · Trust Center
          </p>

          <h1 className="text-3xl font-extrabold sm:text-5xl">
            Policies & Guidelines
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
            Learn how FixNear handles your information, bookings, payments, and
            interactions with local service professionals.
          </p>

          <p className="mt-5 text-sm text-blue-100">
            Please review the policies that apply to your use of FixNear.
          </p>
        </div>
      </section>

      {/* Policy Content */}
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[280px_1fr] lg:py-14">
        {/* Sidebar */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="px-3 pb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
            Policy Categories
          </h2>

          <nav className="space-y-1">
            {policies.map((policy) => {
              const Icon = policy.icon;
              const isActive = activePolicy === policy.id;

              return (
                <button
                  key={policy.id}
                  type="button"
                  onClick={() => setActivePolicy(policy.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                  }`}
                >
                  <Icon size={19} />
                  <span>{policy.title}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <LockKeyhole size={17} />
              Your trust matters
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Read the relevant policy before using a service or submitting
              personal information.
            </p>
          </div>
        </aside>

        {/* Main Policy */}
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {selectedPolicy && (
            <>
              <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <selectedPolicy.icon size={25} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    {selectedPolicy.title}
                  </h2>
                  <p className="mt-2 leading-7 text-slate-600">
                    {selectedPolicy.intro}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {selectedPolicy.content.map((section, index) => {
                  const key = `${selectedPolicy.id}-${index}`;
                  const isOpen = openSections[key] !== false;

                  return (
                    <div
                      key={key}
                      className="overflow-hidden rounded-xl border border-slate-200"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSection(key)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5"
                      >
                        <span className="font-semibold text-slate-800">
                          {section.heading}
                        </span>

                        {isOpen ? (
                          <ChevronUp
                            size={19}
                            className="shrink-0 text-blue-600"
                          />
                        ) : (
                          <ChevronDown
                            size={19}
                            className="shrink-0 text-slate-500"
                          />
                        )}
                      </button>

                      {isOpen && (
                        <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
                          <p className="text-sm leading-7 text-slate-600 sm:text-base">
                            {section.text}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-xl bg-blue-50 p-5">
                <h3 className="font-bold text-blue-900">
                  Need help with this policy?
                </h3>
                <p className="mt-2 text-sm leading-6 text-blue-800">
                  Contact the FixNear support team for clarification or
                  assistance with an account, booking, or complaint.
                </p>
                <Link
                  to="/contact"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Mail size={17} />
                  Contact Support
                </Link>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default Policy;
