import { useEffect, useState } from "react";
import { Wrench, ShieldCheck, RefreshCw, Clock, Sparkles } from "lucide-react";

export default function MaintenanceNotice({ children }) {
  const [status, setStatus] = useState("checking");
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkMaintenance() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/maintenance-status",
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Could not verify maintenance status");
        }

        const data = await response.json();

        if (!cancelled) {
          setStatus(data.maintenanceMode ? "maintenance" : "available");
        }
      } catch (error) {
        console.error("Maintenance status check failed:", error);

        if (!cancelled) {
          setStatus("error");
        }
      } finally {
        if (!cancelled) {
          setRetrying(false);
        }
      }
    }

    checkMaintenance();

    return () => {
      cancelled = true;
    };
  }, [retrying]);

  const handleRetry = () => {
    setStatus("checking");
    setRetrying(true);
  };

  // LOADING SCREEN
  if (status === "checking") {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-5 text-white">
        {/* Background decoration */}
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
          <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-400/20 border-t-blue-400" />
            <div className="absolute inset-3 animate-spin rounded-full border-4 border-indigo-400/20 border-b-indigo-400 [animation-direction:reverse] [animation-duration:2s]" />
            <Wrench className="h-8 w-8 animate-pulse text-blue-300" />
          </div>

          <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
            <Sparkles className="h-4 w-4" />
            FixNear
          </div>

          <h1 className="mb-3 text-2xl font-bold sm:text-3xl">
            Checking service status
          </h1>

          <p className="mb-8 leading-7 text-slate-300">
            We're making sure everything is ready for you. Just a moment...
          </p>

          <div className="mx-auto mb-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-indigo-400" />
          </div>

          <p className="text-xs tracking-wide text-slate-400">
            CONNECTING TO FIXNEAR
          </p>
        </div>
      </div>
    );
  }

  // MAINTENANCE / ERROR SCREEN
  if (status === "maintenance" || status === "error") {
    const isMaintenance = status === "maintenance";

    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-5 py-12 text-white">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.07] p-7 text-center shadow-2xl backdrop-blur-xl sm:p-12">
          <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full border border-blue-300/20 bg-blue-400/10 shadow-lg shadow-blue-950/30">
            {isMaintenance ? (
              <Wrench className="h-11 w-11 animate-pulse text-blue-300" />
            ) : (
              <ShieldCheck className="h-11 w-11 text-amber-300" />
            )}
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-blue-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            {isMaintenance ? "Scheduled maintenance" : "Connection issue"}
          </div>

          <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {isMaintenance ? (
              <>
                We'll be back
                <span className="block bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
                  soon!
                </span>
              </>
            ) : (
              "Unable to check status"
            )}
          </h1>

          <p className="mx-auto mb-8 max-w-md leading-7 text-slate-300">
            {isMaintenance
              ? "We're making FixNear better for you. Our service is temporarily unavailable while we work on improvements. Please check back shortly."
              : "We couldn't connect to the service status endpoint. Please check your connection and try again."}
          </p>

          <div className="mb-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <Clock className="mb-3 h-5 w-5 text-blue-300" />
              <p className="mb-1 font-semibold">Thanks for waiting</p>
              <p className="text-sm leading-6 text-slate-400">
                Your patience means a lot to us.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <ShieldCheck className="mb-3 h-5 w-5 text-indigo-300" />
              <p className="mb-1 font-semibold">Your account is safe</p>
              <p className="text-sm leading-6 text-slate-400">
                We'll be ready when service returns.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 font-bold shadow-lg shadow-blue-950/40 transition duration-200 hover:scale-[1.02] hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] sm:w-auto"
          >
            <RefreshCw className="h-5 w-5" />
            Check Again
          </button>

          <p className="mt-8 text-xs tracking-wide text-slate-500">
            MADE WITH CARE · FIXNEAR
          </p>
        </div>
      </div>
    );
  }

  // SERVICE AVAILABLE
  return children;
}
