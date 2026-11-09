import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock3, Save, CheckCircle2, Loader2 } from "lucide-react";
import API from "../services/api";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const createDefaultHours = () => {
  const hours = {};

  DAYS.forEach((day) => {
    hours[day] = {
      enabled: day !== "Sunday",
      start: "09:00",
      end: "18:00",
    };
  });

  return hours;
};

function ProviderWorkingHours() {
  const [workingHours, setWorkingHours] = useState(createDefaultHours());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // FETCH WORKING HOURS
  // ==========================================

  const fetchWorkingHours = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await API.get("/providers/my/working-hours");

      if (response.data.success) {
        const serverHours = response.data.workingHours;

        setWorkingHours((previous) => ({
          ...previous,
          ...serverHours,
        }));
      }
    } catch (err) {
      console.error("Fetch Working Hours Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("provider");

        window.location.href = "/login";
        return;
      }

      setError(
        err.response?.data?.message || "Failed to load your working hours.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkingHours();
  }, []);

  // ==========================================
  // TOGGLE DAY
  // ==========================================

  const handleDayToggle = (day) => {
    setWorkingHours((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        enabled: !previous[day].enabled,
      },
    }));
  };

  // ==========================================
  // CHANGE TIME
  // ==========================================

  const handleTimeChange = (day, field, value) => {
    setWorkingHours((previous) => ({
      ...previous,
      [day]: {
        ...previous[day],
        [field]: value,
      },
    }));
  };

  // ==========================================
  // SAVE
  // ==========================================

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess("");
      setError("");

      const response = await API.put("/providers/my/working-hours", {
        workingHours,
      });

      if (response.data.success) {
        setWorkingHours(response.data.workingHours);
        setSuccess("Working hours updated successfully.");

        setTimeout(() => {
          setSuccess("");
        }, 3000);
      }
    } catch (err) {
      console.error("Save Working Hours Error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("provider");

        window.location.href = "/login";
        return;
      }

      setError(
        err.response?.data?.message || "Failed to update working hours.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin" size={24} />
          <span>Loading working hours...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Clock3 size={22} className="text-blue-600" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Working Hours
                </h1>

                <p className="text-sm text-slate-500">
                  Set your weekly availability
                </p>
              </div>
            </div>

            <Link
              to="/provider/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
            >
              <ArrowLeft size={17} />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* SUCCESS */}
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            <CheckCircle2 size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* INFO */}
        <div className="mb-6 rounded-2xl bg-white border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">
            Set your availability
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Customers will use these hours to know when you are available for
            bookings.
          </p>
        </div>

        {/* DAYS */}
        <div className="space-y-4">
          {DAYS.map((day) => {
            const hours = workingHours[day];

            return (
              <div
                key={day}
                className="bg-white border border-slate-200 rounded-2xl p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* DAY */}
                  <div className="flex items-center gap-4 min-w-[180px]">
                    <button
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`relative w-12 h-7 rounded-full transition ${
                        hours.enabled ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition ${
                          hours.enabled ? "left-6" : "left-1"
                        }`}
                      />
                    </button>

                    <div>
                      <h3 className="font-semibold text-slate-900">{day}</h3>

                      <p className="text-xs text-slate-500">
                        {hours.enabled ? "Available" : "Closed"}
                      </p>
                    </div>
                  </div>

                  {/* TIME */}
                  {hours.enabled ? (
                    <div className="flex items-center gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          Start
                        </label>

                        <input
                          type="time"
                          value={hours.start || ""}
                          onChange={(e) =>
                            handleTimeChange(day, "start", e.target.value)
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>

                      <span className="mt-5 text-slate-400">→</span>

                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          End
                        </label>

                        <input
                          type="time"
                          value={hours.end || ""}
                          onChange={(e) =>
                            handleTimeChange(day, "end", e.target.value)
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 lg:mr-20">
                      Not available
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* SAVE */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Working Hours
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

export default ProviderWorkingHours;
