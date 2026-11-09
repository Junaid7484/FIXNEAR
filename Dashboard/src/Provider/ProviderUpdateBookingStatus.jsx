import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  Navigation,
  Play,
  User,
  Wrench,
} from "lucide-react";

function ProviderUpdateBookingStatus() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentStatus, setCurrentStatus] = useState("accepted");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Demo booking data
  const bookings = [
    {
      _id: "booking-1002",
      customerName: "Rohit Singh",
      customerPhone: "+91 98765 22222",
      serviceName: "Switch & Socket Repair",
      date: "2026-09-27",
      time: "02:00 PM",
      location: "Adampur, Bhagalpur",
      price: 199,
      status: "accepted",
      description: "Customer needs repair of a damaged electrical socket.",
    },
    {
      _id: "booking-1003",
      customerName: "Neha Kumari",
      customerPhone: "+91 98765 33333",
      serviceName: "Electrical Wiring",
      date: "2026-09-26",
      time: "11:00 AM",
      location: "Kachahri Road, Bhagalpur",
      price: 799,
      status: "on_the_way",
      description:
        "Partial electrical wiring work required for a newly renovated room.",
    },
  ];

  const booking = bookings.find((item) => item._id === id);

  const statusSteps = [
    {
      key: "accepted",
      label: "Accepted",
      description: "Booking has been accepted",
      icon: Check,
    },
    {
      key: "on_the_way",
      label: "On The Way",
      description: "Provider is travelling to customer",
      icon: Navigation,
    },
    {
      key: "in_progress",
      label: "In Progress",
      description: "Service work has started",
      icon: Wrench,
    },
    {
      key: "completed",
      label: "Completed",
      description: "Service has been completed",
      icon: CheckCircle2,
    },
  ];

  const statusOrder = ["accepted", "on_the_way", "in_progress", "completed"];

  const currentIndex = statusOrder.indexOf(currentStatus);

  const handleUpdateStatus = (nextStatus) => {
    setLoading(true);

    setTimeout(() => {
      setCurrentStatus(nextStatus);
      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 1800);
    }, 1000);
  };

  const getNextStatus = () => {
    if (currentIndex === -1) return null;

    return statusOrder[currentIndex + 1] || null;
  };

  const nextStatus = getNextStatus();

  const getNextButtonText = () => {
    switch (nextStatus) {
      case "on_the_way":
        return "Start Journey";

      case "in_progress":
        return "Start Service";

      case "completed":
        return "Complete Service";

      default:
        return "Update Status";
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-slate-900">
            Booking Not Found
          </h2>

          <p className="text-slate-500 mt-2">
            The booking you are trying to update does not exist.
          </p>

          <button
            onClick={() => navigate("/provider/bookings")}
            className="mt-6 bg-slate-900 hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:py-10">
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(`/provider/bookings/${booking._id}`)}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium mb-6"
        >
          <ArrowLeft size={18} />
          Back to Booking Details
        </button>

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-sm text-slate-500">Update Booking</p>

              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                {booking._id}
              </h1>

              <p className="text-slate-500 mt-2">
                Manage the service progress from your provider dashboard.
              </p>
            </div>

            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-xl">
              <p className="text-xs font-medium">Current Status</p>

              <p className="font-bold mt-1">
                {statusSteps.find((step) => step.key === currentStatus)?.label}
              </p>
            </div>
          </div>
        </div>

        {/* Success message */}
        {success && (
          <div className="mt-5 bg-green-50 border border-green-200 text-green-700 rounded-xl px-5 py-4 flex items-center gap-3">
            <CheckCircle2 size={20} />
            <span className="font-medium">
              Booking status updated successfully.
            </span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking information */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Booking Information
              </h2>

              <div className="grid sm:grid-cols-2 gap-5 mt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <User size={19} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Customer</p>

                    <p className="font-semibold text-slate-800">
                      {booking.customerName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Wrench size={19} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Service</p>

                    <p className="font-semibold text-slate-800">
                      {booking.serviceName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CalendarDays size={19} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Schedule</p>

                    <p className="font-semibold text-slate-800">
                      {booking.date}
                    </p>

                    <p className="text-sm text-slate-500">{booking.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <IndianRupee size={19} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Amount</p>

                    <p className="font-semibold text-slate-800">
                      ₹{booking.price}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3">
                <MapPin size={20} className="text-blue-600 mt-0.5" />

                <div>
                  <p className="text-xs text-slate-400">Service Location</p>

                  <p className="font-semibold text-slate-800 mt-1">
                    {booking.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Status timeline */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Service Progress
              </h2>

              <div className="mt-7">
                {statusSteps.map((step, index) => {
                  const StepIcon = step.icon;

                  const stepIndex = statusOrder.indexOf(step.key);

                  const completed = stepIndex <= currentIndex;

                  const isCurrent = step.key === currentStatus;

                  return (
                    <div key={step.key} className="relative flex gap-4">
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`absolute left-5 top-10 w-0.5 h-16 ${
                            stepIndex < currentIndex
                              ? "bg-green-500"
                              : "bg-slate-200"
                          }`}
                        ></div>
                      )}

                      <div
                        className={`relative z-10 w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
                          completed
                            ? "bg-green-100 text-green-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <StepIcon size={19} />
                      </div>

                      <div className="pb-8">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`font-bold ${
                              isCurrent ? "text-blue-600" : "text-slate-900"
                            }`}
                          >
                            {step.label}
                          </h3>

                          {isCurrent && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                              Current
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-500 mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Update panel */}
          <div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-slate-900">
                Update Status
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Move the booking to the next stage as you complete each step.
              </p>

              {nextStatus ? (
                <>
                  <div className="mt-6 bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400 uppercase font-semibold">
                      Next Status
                    </p>

                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {
                        statusSteps.find((step) => step.key === nextStatus)
                          ?.label
                      }
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      {
                        statusSteps.find((step) => step.key === nextStatus)
                          ?.description
                      }
                    </p>
                  </div>

                  <button
                    onClick={() => handleUpdateStatus(nextStatus)}
                    disabled={loading}
                    className="w-full mt-5 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Play size={18} />
                        {getNextButtonText()}
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                  <CheckCircle2 size={40} className="text-green-600 mx-auto" />

                  <h3 className="font-bold text-green-800 mt-3">
                    Service Completed
                  </h3>

                  <p className="text-sm text-green-700 mt-1">
                    This booking has reached its final status.
                  </p>
                </div>
              )}

              <button
                onClick={() => navigate(`/provider/bookings/${booking._id}`)}
                className="w-full mt-3 border border-slate-300 text-slate-700 hover:bg-slate-50 py-3 rounded-xl font-semibold transition-colors"
              >
                View Booking Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProviderUpdateBookingStatus;
