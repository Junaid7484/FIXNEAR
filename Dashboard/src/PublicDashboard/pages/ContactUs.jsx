import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Clock3,
  MessageCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to send your message. Please try again.",
        );
      }

      setSuccess(
        data.message ||
          "Your message has been sent successfully. We'll get back to you soon.",
      );

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      console.error("Contact form error:", err);

      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";

  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  const contactDetails = [
    {
      title: "Email Us",
      description: "Send us your questions anytime.",
      value: "fixnearja@gmail.com",
      href: "mailto:fixnearja@gmail.com",
      icon: Mail,
      iconStyle: "bg-blue-100 text-blue-600",
    },
    {
      title: "Call Us",
      description: "Contact us for assistance.",
      value: "+91 8340252282",
      href: "tel:+918340252282",
      icon: Phone,
      iconStyle: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-950 via-blue-950 to-blue-800 text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-200 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-white/10 px-3 py-1.5 text-sm font-medium text-blue-100">
              <MessageCircle className="h-4 w-4" />
              We're here to help
            </div>

            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Contact <span className="text-blue-400">FIXNEAR</span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Have a question, suggestion, or need assistance? Send us a message
              and we'll help you find the right solution.
            </p>
          </div>
        </div>
      </section>

      {/* Contact content */}
      <section className="py-8 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
            {/* Contact information */}
            <aside className="space-y-4">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  Get in touch
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                  We'd love to hear from you
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Choose a contact method or send a message through the form.
                </p>
              </div>

              {contactDetails.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.iconStyle}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.description}
                        </p>

                        <a
                          href={item.href}
                          className="mt-3 inline-block break-all text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                        >
                          {item.value}
                        </a>
                      </div>

                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                    </div>
                  </div>
                );
              })}

              {/* Location */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">Our Location</h3>

                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      Patna, Bihar
                      <br />
                      India
                    </p>
                  </div>
                </div>
              </div>

              {/* Support hours */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">Support Hours</h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Monday – Saturday
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      9:00 AM – 6:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Contact form */}
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
              <div className="mb-6">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Send className="h-5 w-5" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  Send us a message
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Complete the form below. All fields are required.
                </p>
              </div>

              {success && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                  <p className="text-sm leading-relaxed">{success}</p>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                  <p className="text-sm leading-relaxed">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name and email */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className={labelClass}>
                      Full name
                    </label>

                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      autoComplete="name"
                      maxLength={100}
                      required
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className={labelClass}>
                      Email address
                    </label>

                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      maxLength={254}
                      required
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="contact-subject" className={labelClass}>
                    Subject
                  </label>

                  <input
                    id="contact-subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What do you need help with?"
                    maxLength={150}
                    required
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="contact-message" className={labelClass}>
                    Your message
                  </label>

                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    maxLength={5000}
                    placeholder="Describe your question or issue..."
                    required
                    disabled={loading}
                    className={`${inputClass} min-h-36 resize-y leading-relaxed`}
                  />

                  <p className="mt-1.5 text-right text-xs text-slate-400">
                    {formData.message.length}/5000 characters
                  </p>
                </div>

                {/* Privacy note */}
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                  <p className="text-xs leading-relaxed text-slate-500">
                    Please don't include your password or sensitive payment
                    information in your message.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Sending message...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>

          {/* Help centre link */}
          <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-center sm:flex-row sm:text-left">
            <div>
              <h3 className="font-bold text-slate-900">
                Looking for a quick answer?
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Browse common questions before contacting support.
              </p>
            </div>

            <Link
              to="/help-support"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
            >
              Help & Support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ContactUs;
