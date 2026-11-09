import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  CalendarCheck,
  CreditCard,
  Users,
  AlertTriangle,
  Scale,
  ChevronRight,
  Mail,
  ArrowLeft,
} from "lucide-react";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    icon: FileText,
    content: [
      "Welcome to FixNear, a platform designed to help customers discover and connect with local service professionals.",
      "By accessing or using FixNear, creating an account, requesting a service, or registering as a provider, you agree to these Terms and Conditions and any applicable policies published on the platform.",
      "If you do not agree with these terms, please discontinue using the platform.",
    ],
  },
  {
    id: "eligibility",
    title: "2. Eligibility and Accounts",
    icon: Users,
    content: [
      "You must be legally capable of entering into a binding agreement under applicable law to use FixNear.",
      "You agree to provide accurate, complete, and up-to-date information when registering and using your account.",
      "You are responsible for keeping your login credentials confidential and for activities conducted through your account. Notify FixNear if you suspect unauthorized access.",
      "You must not impersonate another person, create fraudulent accounts, or use the platform for unlawful purposes.",
    ],
  },
  {
    id: "platform",
    title: "3. Role of FixNear",
    icon: ShieldCheck,
    content: [
      "FixNear provides a platform for customers to find and request services from local professionals.",
      "Unless expressly stated otherwise, service providers independently perform the requested work. FixNear does not automatically become a party to every agreement between a customer and a provider.",
      "Provider profiles, ratings, service descriptions, availability, and other information should be reviewed before making a booking.",
      "Any verification performed by FixNear does not constitute a guarantee of a provider's skills, conduct, work quality, or suitability for a particular job.",
    ],
  },
  {
    id: "bookings",
    title: "4. Bookings and Service Delivery",
    icon: CalendarCheck,
    content: [
      "Customers must provide accurate service details, contact information, location, and preferred appointment time.",
      "A booking request may require provider acceptance before it becomes confirmed. Customers should check their booking status and notifications.",
      "Providers should make reasonable efforts to attend confirmed appointments, communicate delays, and perform accepted services with appropriate care.",
      "Service scope, estimated duration, materials, and any additional charges should be discussed and agreed upon before extra work begins.",
      "Actual service availability may vary by location, provider schedules, and the nature of the requested work.",
    ],
  },
  {
    id: "cancellation",
    title: "5. Cancellations and Rescheduling",
    icon: CalendarCheck,
    content: [
      "Customers should cancel or reschedule bookings through the available platform features as early as possible.",
      "Providers should promptly communicate when they cannot fulfill a confirmed booking.",
      "Cancellation windows, applicable fees, and restrictions must be disclosed before the customer confirms the relevant booking.",
      "Repeated cancellations, missed appointments, or misuse of booking features may result in account review or restrictions, subject to applicable law.",
    ],
  },
  {
    id: "payments",
    title: "6. Pricing and Payments",
    icon: CreditCard,
    content: [
      "Customers should review the displayed service price and any disclosed charges before confirming a booking.",
      "The final amount may depend on the agreed scope of work, materials, additional tasks, and other charges communicated in advance.",
      "Available payment methods depend on the options enabled for the particular booking. These may include online payment or cash.",
      "Customers must not share passwords, one-time passwords (OTPs), or sensitive payment credentials with providers or other users.",
      "Where online payments are supported, payment processing may be handled by a third-party payment service subject to its applicable terms.",
    ],
  },
  {
    id: "refunds",
    title: "7. Refunds and Complaints",
    icon: Scale,
    content: [
      "Customers who experience a service issue or payment discrepancy may contact FixNear support and provide their booking reference and relevant evidence.",
      "Refund requests may be reviewed using booking details, payment records, and communications between the parties.",
      "Refund eligibility depends on the circumstances, the disclosed booking terms, the applicable payment process, and applicable law. A refund is not guaranteed in every case.",
      "FixNear may assist with communication and complaint resolution but cannot guarantee a particular outcome for every dispute.",
      "Nothing in these terms limits any consumer rights that cannot lawfully be excluded.",
    ],
  },
  {
    id: "provider",
    title: "8. Provider Responsibilities",
    icon: Users,
    content: [
      "Providers must submit truthful information about their identity, qualifications, business, services, availability, and pricing.",
      "Providers are responsible for obtaining and maintaining any licenses, permissions, qualifications, or insurance required for the services they offer.",
      "Providers must treat customers respectfully, protect customer information, and comply with applicable laws and safety requirements.",
      "Providers must not mislead customers, request unauthorized payments, engage in discriminatory or abusive conduct, or misuse FixNear's platform.",
      "Providers are responsible for the work they agree to perform and should clearly communicate service limitations and relevant risks.",
    ],
  },
  {
    id: "conduct",
    title: "9. Prohibited Activities",
    icon: AlertTriangle,
    content: [
      "Users must not use FixNear for fraud, illegal activities, harassment, threats, discrimination, or other harmful conduct.",
      "Users must not attempt to access another person's account, interfere with platform security, distribute malicious software, or disrupt platform operations.",
      "False reviews, fabricated complaints, manipulated bookings, and misleading service listings are prohibited.",
      "Users must not misuse personal information obtained through FixNear or use it for unauthorized marketing or unrelated purposes.",
    ],
  },
  {
    id: "suspension",
    title: "10. Suspension and Termination",
    icon: ShieldCheck,
    content: [
      "FixNear may investigate reported misconduct and may restrict, suspend, or terminate accounts when reasonably necessary for safety, fraud prevention, legal compliance, or enforcement of these terms.",
      "Where appropriate and legally permitted, FixNear may provide notice or an opportunity to address the issue.",
      "Users may stop using FixNear and request account closure through the available account features or support channels.",
      "Account closure does not remove obligations or liabilities that arose before closure, or records that must lawfully be retained.",
    ],
  },
  {
    id: "liability",
    title: "11. Disclaimers and Liability",
    icon: Scale,
    content: [
      "FixNear aims to make the platform useful and reliable but does not guarantee uninterrupted access, error-free operation, or continuous availability of any particular provider.",
      "To the extent permitted by law, FixNear is not responsible for a provider's independent acts, omissions, workmanship, or representations, or for a customer's independent conduct.",
      "Nothing in these terms excludes or limits liability where such exclusion or limitation is prohibited by applicable law.",
      "Users should exercise reasonable judgment when selecting a provider and should discuss important requirements, safety concerns, and service expectations before work begins.",
    ],
  },
  {
    id: "changes",
    title: "12. Changes to These Terms",
    icon: FileText,
    content: [
      "FixNear may update these Terms and Conditions to reflect changes to its services, platform features, business practices, or legal requirements.",
      "Updated terms will be published on the platform with a revised effective date where appropriate.",
      "Where required by law, FixNear will provide notice of material changes or obtain any necessary consent.",
      "Continued use of the platform after changes take effect is subject to applicable law and any required acceptance process.",
    ],
  },
  {
    id: "law",
    title: "13. Governing Law and Disputes",
    icon: Scale,
    content: [
      "These terms are subject to applicable laws and regulations.",
      "Users are encouraged to contact FixNear support first so that platform-related concerns can be reviewed.",
      "Any formal dispute will be handled by the competent forum under applicable law. Nothing in these terms removes a user's mandatory legal rights or remedies.",
    ],
  },
  {
    id: "contact",
    title: "14. Contact Us",
    icon: Mail,
    content: [
      "If you have questions about these Terms and Conditions, account access, bookings, payments, or complaints, contact the FixNear support team through the contact options provided on the platform.",
      "When contacting support about a booking, include the relevant booking reference and a clear description of your concern. Do not send passwords or OTPs.",
    ],
  },
];

export default function TermsAndConditions() {
  const effectiveDate = "10 October 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-blue-800 via-blue-700 to-indigo-800 px-4 py-16 text-white sm:py-20">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-5xl">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-blue-100 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Home
          </Link>

          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <FileText size={30} />
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
            FixNear Legal Center
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Terms &amp; Conditions
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">
            Please read these terms carefully to understand the rules,
            responsibilities, and conditions that apply when using FixNear.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
              Effective date: {effectiveDate}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
              Customers &amp; Providers
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 shrink-0 text-blue-700" size={23} />
            <div>
              <h2 className="font-bold text-blue-950">Important information</h2>
              <p className="mt-2 text-sm leading-7 text-blue-900">
                These terms explain the intended rules for using FixNear.
                Service availability, payment methods, cancellation rules, and
                other features depend on the platform's actual configuration.
                Please review the terms before using the platform.
              </p>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            In this document
          </h2>

          <div className="grid gap-2 sm:grid-cols-2">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-center gap-3 rounded-xl p-3 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  <Icon size={18} className="shrink-0 text-blue-600" />
                  <span className="flex-1">{section.title}</span>
                  <ChevronRight
                    size={16}
                    className="shrink-0 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100"
                  />
                </a>
              );
            })}
          </div>
        </section>

        {/* Terms Sections */}
        <div className="space-y-5">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon size={21} />
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-3 pl-0 text-sm leading-7 text-slate-600 sm:pl-13 sm:text-base">
                  {section.content.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Related Policies */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <h2 className="text-lg font-bold text-slate-900">Related policies</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Please also review the policies that explain how FixNear handles
            personal information and platform-related concerns.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/policy"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <ShieldCheck size={17} />
              Policies
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Mail size={17} />
              Contact Support
            </Link>
          </div>
        </section>

        <p className="mt-8 text-center text-xs leading-6 text-slate-500">
          These terms are a starter template for the FixNear project and should
          be reviewed for legal compliance before production use.
        </p>
      </main>

    </div>
  );
}
