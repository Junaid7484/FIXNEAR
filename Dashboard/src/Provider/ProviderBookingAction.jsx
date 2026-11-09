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
  MessageSquare,
  Phone,
  User,
  X,
  XCircle,
} from "lucide-react";

function ProviderBookingAction() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  // Demo booking data
  const bookings = [
    {
      _id: "booking-1001",
      customerName: "Aman Kumar",
      customerPhone: "+91 98765 11111",
      serviceName: "Fan Installation & Repair",
      date: "2026-09-28",
      time: "10:00 AM",
      location: "Tilka Manjhi, Bhagalpur",
      price: 299,
      status: "pending",
      description: "Ceiling fan is making noise and needs installation/repair.",
    },
    {
      _id: "booking-1007",
      customerName: "Pooja Kumari",
      customerPhone: "+91 98765 77777",
      serviceName: "Fan Installation & Repair",
      date: "2026-09-30",
      time: "12:00 PM",
      location: "Barari, Bhagalpur",
      price: 299,
      status: "pending",
      description: "New ceiling fan needs to be installed in the bedroom.",
    },
  ];

  const booking = bookings.find((item) => item._id === id);

  const rejectionReasons = [
    "I am not available at this time",
    "Location is too far",
    "Service is outside my expertise",
    "Already have another booking",
    "Customer requested an unavailable service",
    "Other reason",
  ];

  const handleAccept = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setAction("accepted");
    }, 1200);
  };

  const handleReject = () => {
    if (!rejectReason) {
      alert("Please select a reason for rejecting this booking.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setAction("rejected");
    }, 1200);
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md w-full">
          <XCircle size={52} className="text-red-500 mx-auto" />

          <h2 className="text-2xl font-bold text-slate-900 mt-5">
            Booking Not Found
          </h2>

          <p className="text-slate-500 mt-2">
            The booking you are trying to manage does not exist.
          </p>

          <button
            onClick={() => navigate("/provider/bookings")}
            className="mt-6 bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 text-center shadow-sm">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
                action === "accepted" ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {action === "accepted" ? (
                <CheckCircle2 size={42} className="text-green-600" />
              ) : (
                <XCircle size={42} className="text-red-600" />
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-6">
              {action === "accepted" ? "Booking Accepted" : "Booking Rejected"}
            </h1>

            <p className="text-slate-500 mt-3">
              {action === "accepted"
                ? "The customer will be notified that you accepted this booking."
                : "The customer will be notified that this booking was rejected."}
            </p>

            <div className="bg-slate-50 rounded-2xl p-5 mt-7 text-left">
              <p className="text-xs text-slate-400 uppercase font-semibold">
                Booking ID
              </p>

              <p className="font-bold text-slate-900 mt-1">{booking._id}</p>

              <div className="grid sm:grid-cols-2 gap-4 mt-5">
                <div>
                  <p className="text-xs text-slate-400">Customer</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {booking.customerName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Service</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {booking.serviceName}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/provider/bookings")}
              className="w-full mt-7 bg-slate-900 hover:bg-blue-600 text-white py-3.5 rounded-xl font-semibold transition-colors"
            >
              Back to Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:py-10">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
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
              <p className="text-sm text-slate-500">Booking ID</p>

              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                {booking._id}
              </h1>

              <span className="inline-flex mt-3 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                Pending Approval
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100">
                <Phone size={19} />
              </button>

              <button className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100">
                <MessageSquare size={19} />
              </button>
            </div>
          </div>
        </div>

        {/* Booking information */}
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Customer */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Customer Information
              </h2>

              <div className="flex items-center gap-4 mt-5">
                <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <User size={25} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    {booking.customerName}
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    {booking.customerPhone}
                  </p>
                </div>
              </div>
            </div>

            {/* Service */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Service Details
              </h2>

              <h3 className="text-xl font-bold text-blue-600 mt-5">
                {booking.serviceName}
              </h3>

              <p className="text-slate-500 mt-3 leading-6">
                {booking.description}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-3">
                  <CalendarDays size={20} className="text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="font-semibold text-slate-800">
                      {booking.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-400">Time</p>
                    <p className="font-semibold text-slate-800">
                      {booking.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin size={20} className="text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="font-semibold text-slate-800">
                      {booking.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <IndianRupee size={20} className="text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-400">Service Amount</p>
                    <p className="font-semibold text-slate-800">
                      ₹{booking.price}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action panel */}
          <div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-slate-900">
                Booking Decision
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Review the booking details before accepting or rejecting it.
              </p>

              {/* Accept */}
              <button
                onClick={() => setAction("accept")}
                className="w-full mt-6 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-semibold transition-colors"
              >
                <Check size={19} />
                Accept Booking
              </button>

              {/* Reject */}
              <button
                onClick={() => setAction("reject")}
                className="w-full mt-3 flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 py-3.5 rounded-xl font-semibold transition-colors"
              >
                <X size={19} />
                Reject Booking
              </button>

              {/* Accept confirmation */}
              {action === "accept" && (
                <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <h3 className="font-bold text-green-800">
                    Accept this booking?
                  </h3>

                  <p className="text-sm text-green-700 mt-2">
                    You are confirming that you can provide this service at the
                    scheduled time.
                  </p>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setAction(null)}
                      className="flex-1 border border-slate-300 bg-white text-slate-700 py-2.5 rounded-lg font-medium"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleAccept}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold disabled:opacity-60"
                    >
                      {loading ? "Accepting..." : "Confirm"}
                    </button>
                  </div>
                </div>
              )}

              {/* Reject confirmation */}
              {action === "reject" && (
                <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <h3 className="font-bold text-red-800">
                    Reject this booking
                  </h3>

                  <p className="text-sm text-red-700 mt-2">
                    Please select a reason.
                  </p>

                  <select
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full mt-4 border border-red-200 rounded-lg px-3 py-2.5 bg-white text-sm outline-none focus:ring-2 focus:ring-red-200"
                  >
                    <option value="">Select reason</option>

                    {rejectionReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Additional note (optional)"
                    rows="3"
                    className="w-full mt-3 border border-red-200 rounded-lg px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-red-200"
                  />

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setAction(null);
                        setRejectReason("");
                        setRejectNote("");
                      }}
                      className="flex-1 border border-slate-300 bg-white text-slate-700 py-2.5 rounded-lg font-medium"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleReject}
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold disabled:opacity-60"
                    >
                      {loading ? "Rejecting..." : "Confirm Reject"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProviderBookingAction;
