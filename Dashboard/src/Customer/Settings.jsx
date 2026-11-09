import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Bell,
  ShieldCheck,
  User,
  CalendarDays,
  Save,
} from "lucide-react";

const Settings = () => {
  const [settings, setSettings] = useState({
    bookingNotifications: true,
    emailNotifications: true,
    promotionalNotifications: false,
    profileVisibility: true,
    bookingReminders: true,
  });

  const handleChange = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    localStorage.setItem("customerSettings", JSON.stringify(settings));

    alert("Settings saved successfully!");
  };

  const settingGroups = [
    {
      title: "Notifications",
      description: "Manage how FIXNEAR keeps you informed.",
      icon: Bell,
      options: [
        {
          key: "bookingNotifications",
          title: "Booking updates",
          description: "Receive updates about your service bookings.",
        },
        {
          key: "emailNotifications",
          title: "Email notifications",
          description: "Receive important updates by email.",
        },
        {
          key: "promotionalNotifications",
          title: "Offers and promotions",
          description: "Receive information about offers and discounts.",
        },
      ],
    },
    {
      title: "Booking Preferences",
      description: "Choose how you receive booking reminders.",
      icon: CalendarDays,
      options: [
        {
          key: "bookingReminders",
          title: "Booking reminders",
          description: "Get reminders about upcoming appointments.",
        },
      ],
    },
    {
      title: "Privacy",
      description: "Control your profile preferences.",
      icon: ShieldCheck,
      options: [
        {
          key: "profileVisibility",
          title: "Profile visibility",
          description: "Allow relevant service providers to view your profile.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/customer/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <SettingsIcon size={28} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            <p className="mt-1 text-slate-500">
              Customize your FIXNEAR customer experience.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {settingGroups.map((group) => {
            const Icon = group.icon;

            return (
              <section
                key={group.title}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={22} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {group.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {group.description}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 px-6">
                  {group.options.map((option) => (
                    <div
                      key={option.key}
                      className="flex items-center justify-between gap-4 py-5"
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          {option.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {option.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings[option.key]}
                        aria-label={option.title}
                        onClick={() => handleChange(option.key)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                          settings[option.key] ? "bg-blue-600" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                            settings[option.key] ? "left-[22px]" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Save size={18} />
              Save Settings
            </button>
          </div>
        </form>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5">
          <User className="text-slate-500" size={22} />
          <div>
            <p className="font-medium text-slate-800">Account settings</p>
            <Link
              to="/profile"
              className="mt-1 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Manage your profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
