import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  ShieldCheck,
  Bell,
  Globe,
  CalendarDays,
  CreditCard,
  Wrench,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Settings,
} from "lucide-react";

import API from "../services/api";

function AdminSettings() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("general");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false);
  const [pendingMaintenanceMode, setPendingMaintenanceMode] = useState(null);

  // =========================================================
  // GENERAL SETTINGS
  // =========================================================

  const [generalSettings, setGeneralSettings] = useState({
    platformName: "FIXNEAR",
    supportEmail: "fixnearja@gmail.com",
    supportPhone: "+91 8340252282",
    currency: "INR",
    timezone: "Asia/Kolkata",
    maintenanceMode: false,
  });

  // =========================================================
  // BOOKING SETTINGS
  // =========================================================

  const [bookingSettings, setBookingSettings] = useState({
    autoAcceptBookings: false,
    allowCancellation: true,
    cancellationHours: 2,
    maxAdvanceDays: 30,
    requireProviderApproval: true,
  });

  // =========================================================
  // NOTIFICATION SETTINGS
  // =========================================================

  const [notificationSettings, setNotificationSettings] = useState({
    newBooking: true,
    providerVerification: true,
    complaints: true,
    newUser: true,
    payment: true,
    systemAlerts: true,
  });

  // =========================================================
  // PAYMENT SETTINGS
  // =========================================================

  const [paymentSettings, setPaymentSettings] = useState({
    onlinePayment: true,
    cashPayment: true,
    providerCommission: 10,
    minimumBookingAmount: 199,
  });

  // =========================================================
  // SECURITY SETTINGS
  // =========================================================

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 60,
    passwordExpiry: 90,
  });

  // =========================================================
  // PASSWORD
  // =========================================================

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // =========================================================
  // MESSAGE
  // =========================================================

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  // =========================================================
  // TABS
  // =========================================================

  const tabs = [
    {
      id: "general",
      label: "General",
      icon: Globe,
    },
    {
      id: "booking",
      label: "Bookings",
      icon: CalendarDays,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
    },
    {
      id: "payment",
      label: "Payments",
      icon: CreditCard,
    },
    {
      id: "security",
      label: "Security",
      icon: ShieldCheck,
    },
  ];

  // =========================================================
  // MESSAGE
  // =========================================================

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  // =========================================================
  // LOAD SETTINGS FROM BACKEND
  // =========================================================

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        const response = await API.get("/admin/settings");

        const settings = response.data.settings;

        if (!settings) {
          return;
        }

        // General
        setGeneralSettings({
          platformName: settings.platformName || "FIXNEAR",
          supportEmail: settings.supportEmail || "fixnearja@gmail.com",
          supportPhone: settings.supportPhone || "+91 8340252282",
          currency: settings.currency || "INR",
          timezone: settings.timezone || "Asia/Kolkata",
          maintenanceMode: settings.maintenanceMode ?? false,
        });

        // Booking
        setBookingSettings({
          autoAcceptBookings: settings.autoAcceptBookings ?? false,
          allowCancellation: settings.allowCancellation ?? true,
          cancellationHours: settings.cancellationHours ?? 2,
          maxAdvanceDays: settings.maxAdvanceDays ?? 30,
          requireProviderApproval: settings.requireProviderApproval ?? true,
        });

        // Notifications
        setNotificationSettings({
          newBooking: settings.newBooking ?? true,
          providerVerification: settings.providerVerification ?? true,
          complaints: settings.complaints ?? true,
          newUser: settings.newUser ?? true,
          payment: settings.payment ?? true,
          systemAlerts: settings.systemAlerts ?? true,
        });

        // Payments
        setPaymentSettings({
          onlinePayment: settings.onlinePayment ?? true,
          cashPayment: settings.cashPayment ?? true,
          providerCommission: settings.providerCommission ?? 10,
          minimumBookingAmount: settings.minimumBookingAmount ?? 199,
        });

        // Security
        setSecuritySettings({
          twoFactorAuth: settings.twoFactorAuth ?? false,
          loginAlerts: settings.loginAlerts ?? true,
          sessionTimeout: settings.sessionTimeout ?? 60,
          passwordExpiry: settings.passwordExpiry ?? 90,
        });
      } catch (error) {
        console.error("Load admin settings error:", error);

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/admin/login");
          return;
        }

        showMessage(
          error.response?.data?.message || "Failed to load admin settings.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [navigate]);

  // =========================================================
  // GENERAL
  // =========================================================

  const requestMaintenanceChange = (nextValue) => {
    setPendingMaintenanceMode(nextValue);
    setMaintenanceConfirmOpen(true);
  };

  const confirmMaintenanceChange = () => {
    if (pendingMaintenanceMode === null) return;
    setGeneralSettings((previous) => ({
      ...previous,
      maintenanceMode: pendingMaintenanceMode,
    }));
    setMaintenanceConfirmOpen(false);
    setPendingMaintenanceMode(null);
    showMessage(
      pendingMaintenanceMode
        ? "Maintenance mode enabled locally. Click Save Changes to apply it."
        : "Maintenance mode disabled locally. Click Save Changes to apply it.",
      "success",
    );
  };

  const handleGeneralChange = (e) => {
    const { name, value, type, checked } = e.target;

    setGeneralSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =========================================================
  // BOOKING
  // =========================================================

  const handleBookingChange = (e) => {
    const { name, value, type, checked } = e.target;

    setBookingSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  // =========================================================
  // NOTIFICATION
  // =========================================================

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;

    setNotificationSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // =========================================================
  // PAYMENT
  // =========================================================

  const handlePaymentChange = (e) => {
    const { name, value, type, checked } = e.target;

    setPaymentSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  // =========================================================
  // SECURITY
  // =========================================================

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSecuritySettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  // =========================================================
  // PASSWORD
  // =========================================================

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // SAVE SETTINGS
  // =========================================================

  const saveSettings = async () => {
    try {
      setSaving(true);

      const payload = {
        ...generalSettings,
        ...bookingSettings,
        ...notificationSettings,
        ...paymentSettings,
        ...securitySettings,
      };

      const response = await API.put("/admin/settings", payload);

      if (response.data.success) {
        showMessage("Admin settings saved successfully.", "success");
      }
    } catch (error) {
      console.error("Save admin settings error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/admin/login");
        return;
      }

      showMessage(
        error.response?.data?.message || "Failed to save admin settings.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  const changePassword = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      showMessage("Please fill all password fields.", "error");

      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage("New password must contain at least 6 characters.", "error");

      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage("New passwords do not match.", "error");

      return;
    }

    try {
      setChangingPassword(true);

      const response = await API.put("/admin/settings/password", passwordData);

      if (response.data.success) {
        showMessage("Admin password changed successfully.", "success");

        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Change password error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/admin/login");
        return;
      }

      showMessage(
        error.response?.data?.message || "Failed to change password.",
        "error",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // =========================================================
  // TOGGLE
  // =========================================================

  const Toggle = ({ checked, onChange, name }) => {
    return (
      <button
        type="button"
        name={name}
        onClick={() =>
          onChange({
            target: {
              name,
              type: "checkbox",
              checked: !checked,
            },
          })
        }
        aria-label={`Toggle ${name}`}
        className={`relative w-12 h-6 rounded-full shrink-0 transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </button>
    );
  };

  // =========================================================
  // PASSWORD INPUT
  // =========================================================

  const PasswordInput = ({
    name,
    value,
    placeholder,
    showPassword,
    setShowPassword,
  }) => {
    return (
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={handlePasswordChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
        >
          {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl px-8 py-7 text-center shadow-sm">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />

          <h2 className="font-semibold text-slate-900">
            Loading Admin Settings
          </h2>

          <p className="text-sm text-slate-500 mt-1">Please wait...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft size={20} />
              </button>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Admin Settings
                </h1>

                <p className="text-sm text-slate-500">
                  Manage FIXNEAR platform settings
                </p>
              </div>
            </div>

            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl font-medium transition"
            >
              <Save size={18} />

              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MESSAGE
      ====================================================== */}

      {message && (
        <div className="fixed top-20 right-4 z-50 max-w-sm">
          <div
            className={`flex items-center gap-3 bg-white border shadow-lg rounded-xl px-4 py-3 ${
              messageType === "error" ? "border-red-200" : "border-green-200"
            }`}
          >
            {messageType === "error" ? (
              <AlertTriangle size={20} className="text-red-600 shrink-0" />
            ) : (
              <CheckCircle size={20} className="text-green-600 shrink-0" />
            )}

            <span className="text-sm font-medium text-slate-700">
              {message}
            </span>
          </div>
        </div>
      )}

      {maintenanceConfirmOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => {
            setMaintenanceConfirmOpen(false);
            setPendingMaintenanceMode(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="maintenance-dialog-title"
            className="w-full max-w-lg rounded-2xl border border-stone-200 bg-[#fffdf8] p-6 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${pendingMaintenanceMode ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}
            >
              {pendingMaintenanceMode ? (
                <Wrench size={23} />
              ) : (
                <CheckCircle size={23} />
              )}
            </div>
            <h2
              id="maintenance-dialog-title"
              className="text-xl font-bold text-stone-900"
            >
              {pendingMaintenanceMode
                ? "Enable maintenance mode?"
                : "Disable maintenance mode?"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              {pendingMaintenanceMode
                ? "After you save this setting, customers should be shown a maintenance notice and blocked from customer-only pages. Admin access remains available. Existing sessions must also be checked by the backend."
                : "After you save this setting, customer access can be restored."}
            </p>
            <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
              <p className="font-semibold">Important</p>
              <p className="mt-1">
                This confirmation changes the setting in this form only. Click{" "}
                <strong>Save Changes</strong> to persist it. Backend maintenance
                middleware is required to enforce access restrictions securely.
              </p>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setMaintenanceConfirmOpen(false);
                  setPendingMaintenanceMode(null);
                }}
                className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMaintenanceChange}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${pendingMaintenanceMode ? "bg-amber-700 hover:bg-amber-800" : "bg-emerald-700 hover:bg-emerald-800"}`}
              >
                {pendingMaintenanceMode
                  ? "Enable Maintenance"
                  : "Disable Maintenance"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="lg:col-span-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-3 lg:sticky lg:top-24">
              <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-100 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Settings size={20} className="text-blue-600" />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    Platform Settings
                  </p>

                  <p className="text-xs text-slate-500">Admin control panel</p>
                </div>
              </div>

              <div className="flex lg:block overflow-x-auto gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 whitespace-nowrap w-full px-4 py-3 rounded-xl text-sm font-medium transition ${
                        activeTab === tab.id
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* =================================================
              CONTENT
          ================================================= */}

          <section className="lg:col-span-9">
            {/* =================================================
                GENERAL
            ================================================= */}

            {activeTab === "general" && (
              <div className="space-y-6">
                <SettingsCard
                  title="General Platform Settings"
                  description="Configure basic FIXNEAR platform information."
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField label="Platform Name">
                      <input
                        name="platformName"
                        value={generalSettings.platformName}
                        onChange={handleGeneralChange}
                        className="input"
                      />
                    </FormField>

                    <FormField label="Support Email">
                      <input
                        type="email"
                        name="supportEmail"
                        value={generalSettings.supportEmail}
                        onChange={handleGeneralChange}
                        className="input"
                      />
                    </FormField>

                    <FormField label="Support Phone">
                      <input
                        name="supportPhone"
                        value={generalSettings.supportPhone}
                        onChange={handleGeneralChange}
                        className="input"
                      />
                    </FormField>

                    <FormField label="Currency">
                      <select
                        name="currency"
                        value={generalSettings.currency}
                        onChange={handleGeneralChange}
                        className="input"
                      >
                        <option value="INR">INR - Indian Rupee</option>

                        <option value="USD">USD - US Dollar</option>

                        <option value="EUR">EUR - Euro</option>
                      </select>
                    </FormField>

                    <FormField label="Timezone">
                      <select
                        name="timezone"
                        value={generalSettings.timezone}
                        onChange={handleGeneralChange}
                        className="input"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata</option>

                        <option value="Asia/Dubai">Asia/Dubai</option>

                        <option value="UTC">UTC</option>
                      </select>
                    </FormField>
                  </div>
                </SettingsCard>

                <SettingsCard
                  title="Maintenance Mode"
                  description="Temporarily restrict customer access during maintenance."
                >
                  <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Wrench size={19} className="text-orange-600" />
                      </div>

                      <div>
                        <p className="font-medium text-slate-900">
                          Maintenance Mode
                        </p>

                        <p className="text-sm text-slate-500">
                          Disable customer access temporarily.
                        </p>
                      </div>
                    </div>

                    <Toggle
                      checked={generalSettings.maintenanceMode}
                      onChange={() =>
                        requestMaintenanceChange(
                          !generalSettings.maintenanceMode,
                        )
                      }
                      name="maintenanceMode"
                    />
                  </div>

                  {generalSettings.maintenanceMode && (
                    <div className="mt-4 flex gap-3 bg-orange-50 border border-orange-200 p-4 rounded-xl">
                      <AlertTriangle
                        size={20}
                        className="text-orange-600 shrink-0"
                      />

                      <p className="text-sm text-orange-800">
                        Maintenance mode is currently enabled. Customers may not
                        be able to access the platform.
                      </p>
                    </div>
                  )}
                </SettingsCard>
              </div>
            )}

            {/* =================================================
                BOOKINGS
            ================================================= */}

            {activeTab === "booking" && (
              <SettingsCard
                title="Booking Settings"
                description="Configure how customer bookings are handled."
              >
                <div className="space-y-5">
                  <SettingToggle
                    title="Auto Accept Bookings"
                    description="Automatically accept eligible bookings."
                    checked={bookingSettings.autoAcceptBookings}
                    onChange={handleBookingChange}
                    name="autoAcceptBookings"
                  />

                  <SettingToggle
                    title="Allow Booking Cancellation"
                    description="Allow customers to cancel bookings."
                    checked={bookingSettings.allowCancellation}
                    onChange={handleBookingChange}
                    name="allowCancellation"
                  />

                  <SettingToggle
                    title="Require Provider Approval"
                    description="Providers must accept bookings before confirmation."
                    checked={bookingSettings.requireProviderApproval}
                    onChange={handleBookingChange}
                    name="requireProviderApproval"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                    <FormField label="Cancellation Window (Hours)">
                      <input
                        type="number"
                        min="0"
                        name="cancellationHours"
                        value={bookingSettings.cancellationHours}
                        onChange={handleBookingChange}
                        className="input"
                      />
                    </FormField>

                    <FormField label="Maximum Advance Booking Days">
                      <input
                        type="number"
                        min="1"
                        name="maxAdvanceDays"
                        value={bookingSettings.maxAdvanceDays}
                        onChange={handleBookingChange}
                        className="input"
                      />
                    </FormField>
                  </div>
                </div>
              </SettingsCard>
            )}

            {/* =================================================
                NOTIFICATIONS
            ================================================= */}

            {activeTab === "notifications" && (
              <SettingsCard
                title="Notification Settings"
                description="Choose which admin alerts should be enabled."
              >
                <div className="space-y-4">
                  <SettingToggle
                    title="New Booking Alerts"
                    description="Receive notifications when a new booking is created."
                    checked={notificationSettings.newBooking}
                    onChange={handleNotificationChange}
                    name="newBooking"
                  />

                  <SettingToggle
                    title="Provider Verification"
                    description="Get notified when providers submit verification applications."
                    checked={notificationSettings.providerVerification}
                    onChange={handleNotificationChange}
                    name="providerVerification"
                  />

                  <SettingToggle
                    title="Complaint Alerts"
                    description="Receive alerts for new and critical complaints."
                    checked={notificationSettings.complaints}
                    onChange={handleNotificationChange}
                    name="complaints"
                  />

                  <SettingToggle
                    title="New User Alerts"
                    description="Receive notifications when new users register."
                    checked={notificationSettings.newUser}
                    onChange={handleNotificationChange}
                    name="newUser"
                  />

                  <SettingToggle
                    title="Payment Alerts"
                    description="Receive notifications for payment activity."
                    checked={notificationSettings.payment}
                    onChange={handleNotificationChange}
                    name="payment"
                  />

                  <SettingToggle
                    title="System Alerts"
                    description="Receive important platform and system notifications."
                    checked={notificationSettings.systemAlerts}
                    onChange={handleNotificationChange}
                    name="systemAlerts"
                  />
                </div>
              </SettingsCard>
            )}

            {/* =================================================
                PAYMENT
            ================================================= */}

            {activeTab === "payment" && (
              <SettingsCard
                title="Payment Settings"
                description="Configure payment methods and platform commission."
              >
                <div className="space-y-5">
                  <SettingToggle
                    title="Online Payments"
                    description="Allow customers to pay online."
                    checked={paymentSettings.onlinePayment}
                    onChange={handlePaymentChange}
                    name="onlinePayment"
                  />

                  <SettingToggle
                    title="Cash Payments"
                    description="Allow customers to pay providers in cash."
                    checked={paymentSettings.cashPayment}
                    onChange={handlePaymentChange}
                    name="cashPayment"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                    <FormField label="Provider Commission (%)">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        name="providerCommission"
                        value={paymentSettings.providerCommission}
                        onChange={handlePaymentChange}
                        className="input"
                      />
                    </FormField>

                    <FormField label="Minimum Booking Amount (₹)">
                      <input
                        type="number"
                        min="0"
                        name="minimumBookingAmount"
                        value={paymentSettings.minimumBookingAmount}
                        onChange={handlePaymentChange}
                        className="input"
                      />
                    </FormField>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800">
                      These settings are stored in the FIXNEAR backend. Actual
                      payment gateway integration will be implemented during the
                      Payments phase.
                    </p>
                  </div>
                </div>
              </SettingsCard>
            )}

            {/* =================================================
                SECURITY
            ================================================= */}

            {activeTab === "security" && (
              <div className="space-y-6">
                <SettingsCard
                  title="Security Settings"
                  description="Manage administrator account security."
                >
                  <div className="space-y-5">
                    <SettingToggle
                      title="Two-Factor Authentication"
                      description="Require an additional verification step during login."
                      checked={securitySettings.twoFactorAuth}
                      onChange={handleSecurityChange}
                      name="twoFactorAuth"
                    />

                    <SettingToggle
                      title="Login Alerts"
                      description="Notify the admin when a new login occurs."
                      checked={securitySettings.loginAlerts}
                      onChange={handleSecurityChange}
                      name="loginAlerts"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                      <FormField label="Session Timeout (Minutes)">
                        <input
                          type="number"
                          min="1"
                          name="sessionTimeout"
                          value={securitySettings.sessionTimeout}
                          onChange={handleSecurityChange}
                          className="input"
                        />
                      </FormField>

                      <FormField label="Password Expiry (Days)">
                        <input
                          type="number"
                          min="1"
                          name="passwordExpiry"
                          value={securitySettings.passwordExpiry}
                          onChange={handleSecurityChange}
                          className="input"
                        />
                      </FormField>
                    </div>
                  </div>
                </SettingsCard>

                {/* CHANGE PASSWORD */}

                <SettingsCard
                  title="Change Admin Password"
                  description="Update the password used to access the admin panel."
                >
                  <div className="space-y-5">
                    <FormField label="Current Password">
                      <PasswordInput
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        placeholder="Enter current password"
                        showPassword={showCurrentPassword}
                        setShowPassword={setShowCurrentPassword}
                      />
                    </FormField>

                    <FormField label="New Password">
                      <PasswordInput
                        name="newPassword"
                        value={passwordData.newPassword}
                        placeholder="Enter new password"
                        showPassword={showNewPassword}
                        setShowPassword={setShowNewPassword}
                      />
                    </FormField>

                    <FormField label="Confirm New Password">
                      <PasswordInput
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        placeholder="Confirm new password"
                        showPassword={showConfirmPassword}
                        setShowPassword={setShowConfirmPassword}
                      />
                    </FormField>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex gap-3">
                        <AlertTriangle
                          size={20}
                          className="text-yellow-600 shrink-0"
                        />

                        <p className="text-sm text-yellow-800">
                          Your password is securely verified against your
                          current admin account before it is changed.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={changePassword}
                      disabled={changingPassword}
                      className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white px-5 py-3 rounded-xl font-medium transition"
                    >
                      <Lock size={18} />

                      {changingPassword
                        ? "Changing Password..."
                        : "Change Password"}
                    </button>
                  </div>
                </SettingsCard>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// =========================================================
// SETTINGS CARD
// =========================================================

function SettingsCard({ title, description, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>

        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>

      {children}
    </div>
  );
}

// =========================================================
// FORM FIELD
// =========================================================

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>

      {children}
    </div>
  );
}

// =========================================================
// SETTING TOGGLE
// =========================================================

function SettingToggle({ title, description, checked, onChange, name }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl">
      <div>
        <p className="font-medium text-slate-900">{title}</p>

        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>

      <button
        type="button"
        onClick={() =>
          onChange({
            target: {
              name,
              type: "checkbox",
              checked: !checked,
            },
          })
        }
        aria-label={`Toggle ${name}`}
        className={`relative w-12 h-6 rounded-full shrink-0 transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

// =========================================================
// EXPORT
// =========================================================

export default AdminSettings;
