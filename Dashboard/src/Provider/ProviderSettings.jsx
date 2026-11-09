
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import {
  Bell,
  CalendarCheck,
  CreditCard,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Moon,
  Phone,
  Shield,
  Smartphone,
  UserRound,
  Eye,
  EyeOff,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  Wallet,
  Clock,
  MapPin,
  Star,
  LifeBuoy,
  Send,
  HelpCircle,
} from "lucide-react";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_WORKING_HOURS = Object.fromEntries(
  DAYS.map((day) => [
    day,
    {
      enabled: day !== "Sunday",
      start: "09:00",
      end: "19:00",
    },
  ]),
);

const INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const ProviderSettings = () => {
  const navigate = useNavigate();

  // SETTINGS
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    bookingNotifications: true,
    paymentNotifications: true,
    reviewNotifications: true,
    marketingNotifications: false,
    availableForBookings: true,
    showPhoneNumber: true,
    darkMode: false,
  });

  // PAGE STATE
  const [activeSection, setActiveSection] = useState("notifications");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // WORKING HOURS
  const [workingHours, setWorkingHours] = useState(DEFAULT_WORKING_HOURS);
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false);
  const [workingHoursSaving, setWorkingHoursSaving] = useState(false);

  // PROVIDER PROFILE
  const [providerProfile, setProviderProfile] = useState(null);
  const [providerProfileLoading, setProviderProfileLoading] = useState(false);

  // PASSWORD
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // HELP & SUPPORT
  const [helpData, setHelpData] = useState({
    category: "select categories",
    email: "",
    message: "",
  });

  const [sendingHelp, setSendingHelp] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchWorkingHours();
    fetchProviderProfile();
  }, []);

  // LOGOUT
  const handleLogout = () => {
    [
      "token",
      "user",
      "role",
      "adminToken",
      "admin",
    ].forEach((key) => localStorage.removeItem(key));

    navigate("/login");
  };

  // FETCH SETTINGS
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/provider-settings");

      if (response.data.success) {
        const data = response.data.settings;

        setSettings({
          emailNotifications: data?.emailNotifications ?? true,
          smsNotifications: data?.smsNotifications ?? true,
          bookingNotifications: data?.bookingNotifications ?? true,
          paymentNotifications: data?.paymentNotifications ?? true,
          reviewNotifications: data?.reviewNotifications ?? true,
          marketingNotifications: data?.marketingNotifications ?? false,
          availableForBookings: data?.availableForBookings ?? true,
          showPhoneNumber: data?.showPhoneNumber ?? true,
          darkMode: data?.darkMode ?? false,
        });
      }
    } catch (err) {
      console.error("Fetch Settings Error:", err);

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(err.response?.data?.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  // FETCH WORKING HOURS
  const fetchWorkingHours = async () => {
    try {
      setWorkingHoursLoading(true);

      const response = await API.get("/providers/my/working-hours");

      if (response.data.success && response.data.workingHours) {
        const backendHours = response.data.workingHours;

        setWorkingHours((previous) => {
          const updatedHours = {};

          DAYS.forEach((day) => {
            updatedHours[day] = {
              ...previous[day],
              ...(backendHours[day] || {}),
            };
          });

          return updatedHours;
        });
      }
    } catch (err) {
      console.error("Fetch Working Hours Error:", err);

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        err.response?.data?.message || "Failed to load working hours.",
      );
    } finally {
      setWorkingHoursLoading(false);
    }
  };

  // FETCH PROVIDER PROFILE
  const fetchProviderProfile = async () => {
    try {
      setProviderProfileLoading(true);

      const response = await API.get("/providers/my/profile");

      if (response.data.success) {
        setProviderProfile(response.data.provider);
      }
    } catch (err) {
      console.error("Fetch Provider Profile Error:", err);

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        err.response?.data?.message || "Failed to load provider profile.",
      );
    } finally {
      setProviderProfileLoading(false);
    }
  };

  // UPDATE SETTINGS
  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // SAVE SETTINGS
  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await API.put("/provider-settings", settings);

      if (response.data.success) {
        setSettings({
          ...response.data.settings,
        });
        setSuccess("Settings saved successfully.");
      }
    } catch (err) {
      console.error("Save Settings Error:", err);

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  // UPDATE WORKING HOURS
  const updateWorkingHour = (day, key, value) => {
    setWorkingHours((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        [key]: value,
      },
    }));
  };

  // SAVE WORKING HOURS
  const handleSaveWorkingHours = async () => {
    try {
      setWorkingHoursSaving(true);
      setError("");
      setSuccess("");

      const response = await API.put("/providers/my/working-hours", {
        workingHours,
      });

      if (response.data.success) {
        setWorkingHours(response.data.workingHours || workingHours);
        setSuccess("Working hours saved successfully.");
      }
    } catch (err) {
      console.error("Save Working Hours Error:", err);

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        err.response?.data?.message || "Failed to save working hours.",
      );
    } finally {
      setWorkingHoursSaving(false);
    }
  };

  // PASSWORD INPUT CHANGE
  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // CHANGE PASSWORD
  const handleChangePassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    try {
      setChangingPassword(true);

      const response = await API.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      if (response.data.success) {
        setSuccess("Password changed successfully.");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      console.error("Change Password Error:", err);

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        err.response?.data?.message || "Failed to change password.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // DELETE PROVIDER ACCOUNT
  const handleDeleteAccount = async () => {
    if (deleteLoading) return;

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your FIXNEAR provider account? This action cannot be undone.",
    );

    if (!confirmed) return;

    const finalConfirmed = window.confirm(
      "FINAL WARNING: Your provider account and provider profile will be permanently deleted. Continue?",
    );

    if (!finalConfirmed) return;

    try {
      setDeleteLoading(true);
      setError("");
      setSuccess("");

      const response = await API.delete("/providers/my/account");

      if (response.data?.success) {
        [
          "token",
          "user",
          "role",
          "currentUser",
          "authUser",
          "provider",
          "providerUser",
        ].forEach((key) => localStorage.removeItem(key));

        alert(
          response.data.message ||
            "Your FIXNEAR provider account has been deleted successfully.",
        );

        navigate("/login", { replace: true });
        return;
      }

      setError(
        response.data?.message || "Failed to delete your provider account.",
      );
    } catch (err) {
      console.error("Delete Provider Account Error:", err);

      if (err.response?.status === 401) {
        [
          "token",
          "user",
          "role",
          "currentUser",
          "authUser",
          "provider",
          "providerUser",
        ].forEach((key) => localStorage.removeItem(key));

        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to delete your provider account. Please try again.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // SEND HELP MESSAGE
  const handleSendHelp = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const category = helpData.category.trim();
    const email = helpData.email.trim();
    const message = helpData.message.trim();

    if (!category || !email || !message) {
      setError("Please fill in all required Help & Support fields.");
      return;
    }

    if (message.length > 5000) {
      setError("Your message cannot exceed 5000 characters.");
      return;
    }

    try {
      setSendingHelp(true);

      const response = await API.post("/providers/help", {
        category,
        email,
        message,
      });

      if (response.data?.success) {
        setSuccess(
          response.data.message ||
            "Your message has been sent to the admin successfully.",
        );

        setHelpData((previous) => ({
          ...previous,
          message: "",
        }));
      } else {
        setError(
          response.data?.message || "Unable to send your message.",
        );
      }
    } catch (err) {
      console.error("Provider Help Error:", err);

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to send your message. Please try again.",
      );
    } finally {
      setSendingHelp(false);
    }
  };

  // SIDEBAR SECTIONS
  const sections = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "availability", label: "Availability", icon: CalendarCheck },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "security", label: "Security", icon: Lock },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "help", label: "Help & Support", icon: LifeBuoy },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-500 mt-1">
                Manage your provider account and preferences
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div
            role="status"
            className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700"
          >
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SIDEBAR */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-3 lg:sticky lg:top-6">
              {sections.map((section) => {
                const Icon = section.icon;
                const active = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setError("");
                      setSuccess("");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition mb-1 ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={19} />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="lg:col-span-3">
            {/* NOTIFICATIONS */}
            {activeSection === "notifications" && (
              <div className="bg-white rounded-xl border border-gray-200">
                <SectionHeader
                  title="Notification Preferences"
                  description="Choose how you want to receive notifications."
                />

                <div className="divide-y divide-gray-200">
                  <SettingRow
                    icon={Mail}
                    iconClass="bg-blue-50 text-blue-600"
                    title="Email Notifications"
                    description="Receive important updates through email."
                    checked={settings.emailNotifications}
                    onChange={(value) =>
                      updateSetting("emailNotifications", value)
                    }
                  />

                  <SettingRow
                    icon={Smartphone}
                    iconClass="bg-green-50 text-green-600"
                    title="SMS Notifications"
                    description="Receive updates through SMS."
                    checked={settings.smsNotifications}
                    onChange={(value) =>
                      updateSetting("smsNotifications", value)
                    }
                  />

                  <SettingRow
                    icon={CalendarCheck}
                    iconClass="bg-purple-50 text-purple-600"
                    title="Booking Notifications"
                    description="Get notified about new and updated bookings."
                    checked={settings.bookingNotifications}
                    onChange={(value) =>
                      updateSetting("bookingNotifications", value)
                    }
                  />

                  <SettingRow
                    icon={Wallet}
                    iconClass="bg-yellow-50 text-yellow-600"
                    title="Payment Notifications"
                    description="Receive payment and payout updates."
                    checked={settings.paymentNotifications}
                    onChange={(value) =>
                      updateSetting("paymentNotifications", value)
                    }
                  />

                  <SettingRow
                    icon={Star}
                    iconClass="bg-orange-50 text-orange-600"
                    title="Review Notifications"
                    description="Get notified when customers leave reviews."
                    checked={settings.reviewNotifications}
                    onChange={(value) =>
                      updateSetting("reviewNotifications", value)
                    }
                  />

                  <SettingRow
                    icon={MessageSquare}
                    iconClass="bg-pink-50 text-pink-600"
                    title="Marketing Notifications"
                    description="Receive offers and promotional updates."
                    checked={settings.marketingNotifications}
                    onChange={(value) =>
                      updateSetting("marketingNotifications", value)
                    }
                  />
                </div>

                <SaveButton saving={saving} onClick={handleSave} />
              </div>
            )}

            {/* AVAILABILITY */}
            {activeSection === "availability" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200">
                  <SectionHeader
                    title="Availability"
                    description="Control whether customers can book your services."
                  />

                  <SettingRow
                    icon={CalendarCheck}
                    iconClass="bg-green-50 text-green-600"
                    title="Available for Bookings"
                    description="Customers can book your services when this is enabled."
                    checked={settings.availableForBookings}
                    onChange={(value) =>
                      updateSetting("availableForBookings", value)
                    }
                  />

                  <SaveButton saving={saving} onClick={handleSave} />
                </div>

                {/* WORKING HOURS */}
                <div className="bg-white rounded-xl border border-gray-200">
                  <SectionHeader
                    title="Working Hours"
                    description="Set the days and times when you accept bookings."
                    icon={Clock}
                  />

                  {workingHoursLoading ? (
                    <LoadingMessage text="Loading working hours..." />
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {DAYS.map((day) => {
                        const dayData =
                          workingHours[day] || DEFAULT_WORKING_HOURS[day];

                        return (
                          <div key={day} className="p-6">
                            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                              <div className="min-w-[120px]">
                                <h3 className="font-medium text-gray-900">
                                  {day}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {dayData.enabled ? "Open" : "Closed"}
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">
                                  {dayData.enabled ? "Available" : "Closed"}
                                </span>
                                <Toggle
                                  checked={dayData.enabled}
                                  onChange={(value) =>
                                    updateWorkingHour(day, "enabled", value)
                                  }
                                />
                              </div>

                              <div className="flex flex-col sm:flex-row gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Start Time
                                  </label>
                                  <input
                                    type="time"
                                    value={dayData.start || "09:00"}
                                    disabled={!dayData.enabled}
                                    onChange={(event) =>
                                      updateWorkingHour(
                                        day,
                                        "start",
                                        event.target.value,
                                      )
                                    }
                                    className={`${INPUT_CLASS} disabled:bg-gray-100 disabled:text-gray-400`}
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">
                                    End Time
                                  </label>
                                  <input
                                    type="time"
                                    value={dayData.end || "19:00"}
                                    disabled={!dayData.enabled}
                                    onChange={(event) =>
                                      updateWorkingHour(
                                        day,
                                        "end",
                                        event.target.value,
                                      )
                                    }
                                    className={`${INPUT_CLASS} disabled:bg-gray-100 disabled:text-gray-400`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="p-6 border-t border-gray-200 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveWorkingHours}
                      disabled={workingHoursSaving || workingHoursLoading}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                      {workingHoursSaving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Saving Working Hours...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Working Hours
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* SERVICE AREA */}
                <div className="bg-white rounded-xl border border-gray-200">
                  <SectionHeader
                    title="Service Area"
                    description="Your current provider service location."
                    icon={MapPin}
                  />

                  {providerProfileLoading ? (
                    <LoadingMessage text="Loading service area..." />
                  ) : providerProfile ? (
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InfoBox
                          label="Address"
                          value={providerProfile.address}
                        />
                        <InfoBox label="City" value={providerProfile.city} />
                        <InfoBox label="State" value={providerProfile.state} />
                        <InfoBox
                          label="Pincode"
                          value={providerProfile.pincode}
                        />
                      </div>

                      <div className="mt-5 rounded-lg bg-gray-50 border border-gray-200 p-5">
                        <div className="flex items-start gap-3">
                          <MapPin
                            size={20}
                            className="text-red-600 mt-0.5"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Service Location
                            </p>
                            <p className="text-gray-900 mt-1">
                              {[
                                providerProfile.address,
                                providerProfile.city,
                                providerProfile.state,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                              {providerProfile.pincode
                                ? ` - ${providerProfile.pincode}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
                        Provider service area information is not available.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PRIVACY */}
            {activeSection === "privacy" && (
              <div className="bg-white rounded-xl border border-gray-200">
                <SectionHeader
                  title="Privacy"
                  description="Control what information customers can see."
                />

                <div className="divide-y divide-gray-200">
                  <SettingRow
                    icon={Phone}
                    iconClass="bg-blue-50 text-blue-600"
                    title="Show Phone Number"
                    description="Allow customers to see your phone number."
                    checked={settings.showPhoneNumber}
                    onChange={(value) =>
                      updateSetting("showPhoneNumber", value)
                    }
                  />

                  <SettingRow
                    icon={Moon}
                    iconClass="bg-purple-50 text-purple-600"
                    title="Dark Mode"
                    description="Save your preferred display mode."
                    checked={settings.darkMode}
                    onChange={(value) => updateSetting("darkMode", value)}
                  />
                </div>

                <SaveButton saving={saving} onClick={handleSave} />
              </div>
            )}

            {/* SECURITY */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200">
                  <SectionHeader
                    title="Change Password"
                    description="Keep your account secure by using a strong password."
                    icon={Lock}
                  />

                  <form
                    onSubmit={handleChangePassword}
                    className="p-6 space-y-5"
                  >
                    <PasswordInput
                      label="Current Password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      show={showPassword.current}
                      onToggle={() =>
                        setShowPassword((previous) => ({
                          ...previous,
                          current: !previous.current,
                        }))
                      }
                    />

                    <PasswordInput
                      label="New Password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      show={showPassword.new}
                      onToggle={() =>
                        setShowPassword((previous) => ({
                          ...previous,
                          new: !previous.new,
                        }))
                      }
                    />

                    <PasswordInput
                      label="Confirm New Password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      show={showPassword.confirm}
                      onToggle={() =>
                        setShowPassword((previous) => ({
                          ...previous,
                          confirm: !previous.confirm,
                        }))
                      }
                    />

                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 transition"
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Lock size={18} />
                          Change Password
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* ACCOUNT SECURITY */}
                <div className="bg-white rounded-xl border border-gray-200">
                  <SectionHeader
                    title="Account Security"
                    description="Basic security information for your account."
                  />

                  <div className="p-6 space-y-5">
                    <SecurityInfo
                      icon={Shield}
                      iconClass="bg-green-50 text-green-600"
                      title="Account Protected"
                      description="Your account uses password authentication and JWT security."
                    />

                    <SecurityInfo
                      icon={UserRound}
                      iconClass="bg-blue-50 text-blue-600"
                      title="Provider Account"
                      description="Your provider access is protected by your authenticated session."
                    />
                  </div>
                </div>

                {/* DELETE ACCOUNT */}
                <div className="bg-white rounded-xl border border-red-200">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                      <div>
                        <h2 className="text-lg font-semibold text-red-600">
                          Delete Account
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Permanently delete your FIXNEAR account and
                          associated data. This action cannot be undone.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        aria-label="Permanently delete provider account"
                      >
                        {deleteLoading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 size={18} />
                            Delete Account
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENTS */}
            {activeSection === "payments" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200">
                  <SectionHeader
                    title="Payments & Payouts"
                    description="Manage your payout information."
                  />

                  <div className="p-6">
                    <SecurityInfo
                      icon={CreditCard}
                      iconClass="bg-green-50 text-green-600"
                      title="Payment Settings"
                      description="Payment and payout integration will be connected when the payment backend is added."
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <SecurityInfo
                    icon={Wallet}
                    iconClass="bg-blue-50 text-blue-600"
                    title="Payout Account"
                    description="Payout account management will be connected with the payment system."
                  />
                </div>
              </div>
            )}

            {/* HELP & SUPPORT */}
            {activeSection === "help" && (
              <div className="space-y-6">
                {/* HELP HERO */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white">
                  <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
                  <div className="absolute -right-2 -bottom-16 h-40 w-40 rounded-full bg-white/10" />

                  <div className="relative flex items-start gap-4">
                    <div className="rounded-xl bg-white/15 p-3">
                      <LifeBuoy size={30} />
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold">
                        How can we help you?
                      </h2>
                      <p className="mt-2 max-w-xl text-blue-100">
                        Need assistance with bookings, payments, your provider
                        profile, or a technical issue? Send a message to the
                        FIXNEAR support team.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SUPPORT FORM */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <SectionHeader
                    title="Contact Support"
                    description="Complete the form below and our admin team will receive your request."
                    icon={MessageSquare}
                  />

                  <form onSubmit={handleSendHelp} className="space-y-6 p-6">
                    <div>
                      <label
                        htmlFor="help-category"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Issue Category <span className="text-red-500">*</span>
                      </label>

                      <select
                        id="help-category"
                        value={helpData.category}
                        onChange={(event) =>
                          setHelpData((previous) => ({
                            ...previous,
                            category: event.target.value,
                          }))
                        }
                        required
                        className={INPUT_CLASS}
                      >
                        <option value="Technical Issue">Technical Issue</option>
                        <option value="Booking Issue">Booking Issue</option>
                        <option value="Payment Issue">Payment Issue</option>
                        <option value="Profile Issue">Profile Issue</option>
                        <option value="Account Issue">Account Issue</option>
                        <option value="Verification Issue">
                          Verification Issue
                        </option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="help-email"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Your Email Address{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <div className="relative">
                        <Mail
                          size={19}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          id="help-email"
                          type="email"
                          autoComplete="email"
                          required
                          maxLength={254}
                          value={helpData.email}
                          onChange={(event) =>
                            setHelpData((previous) => ({
                              ...previous,
                              email: event.target.value,
                            }))
                          }
                          placeholder="you@example.com"
                          className={`${INPUT_CLASS} pl-10`}
                        />
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        Enter an email address where the support team can
                        contact you.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="help-message"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Describe Your Issue{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <textarea
                        id="help-message"
                        required
                        minLength={10}
                        maxLength={5000}
                        rows={6}
                        value={helpData.message}
                        onChange={(event) =>
                          setHelpData((previous) => ({
                            ...previous,
                            message: event.target.value,
                          }))
                        }
                        placeholder="Please describe your issue in detail. Include relevant information to help us resolve it..."
                        className={`${INPUT_CLASS} resize-y`}
                      />

                      <div className="mt-2 flex justify-between gap-3 text-xs text-gray-500">
                        <span>Minimum 10 characters.</span>
                        <span>{helpData.message.length}/5000</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
                      <Shield
                        size={20}
                        className="mt-0.5 flex-shrink-0 text-blue-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Your request matters to us
                        </p>
                        <p className="mt-1 text-sm text-blue-700">
                          Please do not include your password, OTP, payment
                          card details, or other sensitive credentials in your
                          message.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={sendingHelp}
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sendingHelp ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Sending Message...
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            Send to Support
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* SUPPORT INFORMATION */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="mb-3 inline-flex rounded-lg bg-blue-50 p-3 text-blue-600">
                      <Mail size={22} />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      Email Support
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Submit your request using the form and the support team
                      will receive it by email.
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="mb-3 inline-flex rounded-lg bg-purple-50 p-3 text-purple-600">
                      <HelpCircle size={22} />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      Need More Help?
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Choose the category that best matches your issue and
                      provide enough details to help the team investigate.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// SECTION HEADER
const SectionHeader = ({ title, description, icon: Icon }) => (
  <div className="border-b border-gray-200 p-6">
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <Icon size={20} />
        </div>
      )}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-gray-500">{description}</p>
      </div>
    </div>
  </div>
);

// SETTING ROW
const SettingRow = ({
  icon: Icon,
  iconClass,
  title,
  description,
  checked,
  onChange,
}) => (
  <div className="flex items-center justify-between gap-6 p-6">
    <div className="flex items-start gap-4">
      <div className={`rounded-lg p-2 ${iconClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </div>

    <Toggle checked={checked} onChange={onChange} />
  </div>
);

// INFO BOX
const InfoBox = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 p-5">
    <p className="mb-1 text-sm text-gray-500">{label}</p>
    <p className="font-medium text-gray-900">{value || "Not provided"}</p>
  </div>
);

// SECURITY INFO
const SecurityInfo = ({ icon: Icon, iconClass, title, description }) => (
  <div className="flex items-start gap-4">
    <div className={`rounded-lg p-2 ${iconClass}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="font-medium text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

// LOADING MESSAGE
const LoadingMessage = ({ text }) => (
  <div className="flex items-center justify-center gap-3 p-8 text-gray-500">
    <Loader2 size={22} className="animate-spin" />
    <span>{text}</span>
  </div>
);

// TOGGLE
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${
      checked ? "bg-blue-600" : "bg-gray-300"
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
        checked ? "translate-x-5" : "translate-x-0.5"
      }`}
    />
  </button>
);

// PASSWORD INPUT
const PasswordInput = ({
  label,
  name,
  value,
  onChange,
  show,
  onToggle,
}) => (
  <div>
    <label
      htmlFor={name}
      className="mb-2 block text-sm font-medium text-gray-700"
    >
      {label}
    </label>

    <div className="relative">
      <input
        id={name}
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={
          name === "currentPassword" ? "current-password" : "new-password"
        }
        placeholder={`Enter ${label.toLowerCase()}`}
        required
        className={`${INPUT_CLASS} pr-12`}
      />

      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        {show ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  </div>
);

// SAVE BUTTON
const SaveButton = ({ saving, onClick }) => (
  <div className="flex justify-end border-t border-gray-200 p-6">
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save size={18} />
          Save Changes
        </>
      )}
    </button>
  </div>
);

export default ProviderSettings;