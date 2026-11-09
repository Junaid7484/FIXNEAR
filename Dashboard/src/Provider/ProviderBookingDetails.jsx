import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BookingMessagePopup from "../components/BookingMessagePopup";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  MessageCircle,
  Phone,
  User,
  Wrench,
  XCircle,
  Zap,
  Loader2,
  RefreshCw,
  Mail,
  FileText,
} from "lucide-react";
import API from "../services/api";

function ProviderBookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isMessageOpen, setIsMessageOpen] = useState(false);

  // Get the logged-in provider's ID for chat message alignment.
  const currentUserId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const provider = JSON.parse(localStorage.getItem("provider") || "null");

      return (
        user?._id ||
        user?.id ||
        user?.user?._id ||
        provider?.user?._id ||
        provider?.user?.id ||
        provider?._id ||
        provider?.id ||
        ""
      );
    } catch {
      return "";
    }
  }, []);

  // =========================================================
  // UNAUTHORIZED HANDLER
  // =========================================================
  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("provider");
    navigate("/login");
  }, [navigate]);

  // =========================================================
  // FETCH BOOKING
  // =========================================================
  const fetchBooking = useCallback(async () => {
    if (!id) {
      setError("Invalid booking ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await API.get(`/bookings/${id}`);

      if (response.data?.success) {
        setBooking(response.data.booking);
      } else {
        setBooking(null);
        setError(response.data?.message || "Unable to load booking details.");
      }
    } catch (err) {
      console.error("Provider Booking Details Error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load booking details. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [id, navigate, handleUnauthorized]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // =========================================================
  // ACCEPT BOOKING
  // =========================================================
  const handleAccept = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to accept this booking?",
    );

    if (!confirmed) return;

    try {
      setActionLoading("accept");
      setError("");

      const response = await API.put(`/bookings/provider/${id}/accept`);

      if (response.data?.success) {
        setBooking(response.data.booking);
      } else {
        alert(response.data?.message || "Unable to accept booking.");
      }
    } catch (err) {
      console.error("Accept Booking Error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      alert(err.response?.data?.message || "Unable to accept booking.");
    } finally {
      setActionLoading("");
    }
  };

  // =========================================================
  // OPEN REJECT MODAL
  // =========================================================
  const openRejectModal = () => {
    if (actionLoading) return;

    setRejectReason("");
    setShowReject(true);
  };

  // =========================================================
  // CLOSE REJECT MODAL
  // =========================================================
  const closeRejectModal = () => {
    if (actionLoading === "reject") return;

    setShowReject(false);
    setRejectReason("");
  };

  // =========================================================
  // REJECT BOOKING
  // =========================================================
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please select a rejection reason.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to reject this booking?",
    );

    if (!confirmed) return;

    try {
      setActionLoading("reject");
      setError("");

      const response = await API.put(`/bookings/provider/${id}/reject`, {
        reason: rejectReason,
      });

      if (response.data?.success) {
        setBooking(response.data.booking);
        setShowReject(false);
        setRejectReason("");
        setIsMessageOpen(false);
      } else {
        alert(response.data?.message || "Unable to reject booking.");
      }
    } catch (err) {
      console.error("Reject Booking Error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      alert(err.response?.data?.message || "Unable to reject booking.");
    } finally {
      setActionLoading("");
    }
  };

  // =========================================================
  // UPDATE BOOKING STATUS
  // =========================================================
  const handleStatusUpdate = async (newStatus) => {
    const statusMessages = {
      confirmed: "Are you sure you want to confirm this booking?",
      "in-progress": "Are you sure you want to start this service?",
      completed: "Are you sure the service has been completed?",
    };

    const message =
      statusMessages[newStatus] ||
      "Are you sure you want to update this booking?";

    const confirmed = window.confirm(message);

    if (!confirmed) return;

    try {
      setActionLoading(newStatus);
      setError("");

      const response = await API.put(`/bookings/provider/${id}/status`, {
        status: newStatus,
      });

      if (response.data?.success) {
        setBooking(response.data.booking);

        if (
          ["completed", "rejected", "cancelled"].includes(
            response.data.booking?.status,
          )
        ) {
          setIsMessageOpen(false);
        }
      } else {
        alert(response.data?.message || "Unable to update booking status.");
      }
    } catch (err) {
      console.error("Status Update Error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      alert(err.response?.data?.message || "Unable to update booking status.");
    } finally {
      setActionLoading("");
    }
  };

  // =========================================================
  // MARK CASH PAYMENT AS RECEIVED
  // =========================================================

  const handleMarkCashReceived = async () => {
    if (!booking || actionLoading) return;

    const confirmed = window.confirm(
      `Confirm that you have received ₹${Number(
        booking.price || 0,
      ).toLocaleString("en-IN")} in cash from the customer?`,
    );

    if (!confirmed) return;

    try {
      setActionLoading("payment");
      setError("");

      const response = await API.patch(`/bookings/${id}/payment/collect`);

      if (response.data?.success) {
        setBooking((previousBooking) => ({
          ...previousBooking,
          ...(response.data.booking || {}),
          paymentStatus: response.data.booking?.paymentStatus || "paid",
        }));

        alert("Cash payment recorded successfully.");
      } else {
        alert(response.data?.message || "Unable to record cash payment.");
      }
    } catch (err) {
      console.error("Cash Payment Error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      alert(
        err.response?.data?.message ||
          "Unable to record cash payment. Please try again.",
      );
    } finally {
      setActionLoading("");
    }
  };

  // =========================================================
  // STATUS HELPERS
  // =========================================================
  const getStatus = (status) => {
    const statusMap = {
      pending: {
        label: "Pending",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock,
      },
      accepted: {
        label: "Accepted",
        className: "bg-blue-50 text-blue-700 border-blue-200",
        icon: CheckCircle2,
      },
      confirmed: {
        label: "Confirmed",
        className: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: CheckCircle2,
      },
      "in-progress": {
        label: "In Progress",
        className: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Zap,
      },
      completed: {
        label: "Completed",
        className: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle2,
      },
      rejected: {
        label: "Rejected",
        className: "bg-slate-100 text-slate-600 border-slate-200",
        icon: XCircle,
      },
      cancelled: {
        label: "Cancelled",
        className: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
      },
    };

    return (
      statusMap[status] || {
        label: status || "Unknown",
        className: "bg-slate-100 text-slate-600 border-slate-200",
        icon: Clock,
      }
    );
  };

  // =========================================================
  // DATE FORMAT
  // =========================================================
  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // =========================================================
  // TIME FORMAT
  // =========================================================
  const formatTime = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // BOOKING INFORMATION
  // =========================================================
  const bookingInfo = useMemo(() => {
    if (!booking) return null;

    const customerName =
      booking.customer?.name || booking.customer?.fullName || "Customer";

    const customerPhone =
      booking.customer?.phone || booking.customer?.mobile || "";

    const customerEmail = booking.customer?.email || "Not available";

    const serviceName =
      booking.service?.name || booking.service?.title || "Service";

    const bookingPrice = Number(booking.price || 0);
    const bookingAddress = booking.address || "Address not available";
    const bookingCity = booking.city || "";
    const bookingState = booking.state || "";

    const isTerminalStatus = ["completed", "rejected", "cancelled"].includes(
      booking.status,
    );

    return {
      customerName,
      customerPhone,
      customerEmail,
      serviceName,
      bookingPrice,
      bookingAddress,
      bookingCity,
      bookingState,
      isTerminalStatus,
    };
  }, [booking]);

  // =========================================================
  // OPEN GOOGLE MAPS
  // =========================================================
  const openLocation = () => {
    if (!bookingInfo) return;

    const address = [
      bookingInfo.bookingAddress === "Address not available"
        ? ""
        : bookingInfo.bookingAddress,
      bookingInfo.bookingCity,
      bookingInfo.bookingState,
    ]
      .filter(Boolean)
      .join(", ");

    if (!address) {
      alert("Service location is not available.");
      return;
    }

    const query = encodeURIComponent(address);

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 size={42} className="animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-500">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR / NOT FOUND
  // =========================================================
  if (error || !booking || !bookingInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center">
            <Wrench size={34} className="text-slate-400" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mt-6">
            Booking Not Found
          </h1>

          <p className="text-slate-500 mt-2">
            {error || "The booking you are looking for does not exist."}
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={fetchBooking}
              className="inline-flex items-center gap-2 border border-slate-200 bg-white px-5 py-3 rounded-xl font-semibold hover:bg-slate-50 transition"
            >
              <RefreshCw size={17} />
              Retry
            </button>

            <Link
              to="/provider/bookings"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold hover:bg-slate-800 transition"
            >
              <ArrowLeft size={17} />
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // CURRENT BOOKING DATA
  // =========================================================
  const status = getStatus(booking.status);
  const StatusIcon = status.icon;

  const {
    customerName,
    customerPhone,
    customerEmail,
    serviceName,
    bookingPrice,
    bookingAddress,
    bookingCity,
    bookingState,
    isTerminalStatus,
  } = bookingInfo;

  // =========================================================
  // PAGE
  // =========================================================
  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/provider/bookings"
              className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition"
            >
              <ArrowLeft size={17} />
              Back to Bookings
            </Link>

            <button
              type="button"
              onClick={fetchBooking}
              disabled={loading || Boolean(actionLoading)}
              className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white disabled:opacity-50 transition"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mt-6">
            <div>
              <p className="text-blue-400 text-sm font-semibold">
                Booking Details
              </p>

              <h1 className="text-2xl sm:text-3xl font-bold mt-1">
                {serviceName}
              </h1>

              <p className="text-slate-400 text-sm mt-2 break-all">
                Booking ID: {booking._id}
              </p>
            </div>

            <span
              className={`inline-flex self-start items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${status.className}`}
            >
              <StatusIcon size={17} />
              {status.label}
            </span>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-6">
            {/* CUSTOMER */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Customer Information
              </h2>

              <div className="flex flex-col sm:flex-row sm:items-center gap-5 mt-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <User size={30} className="text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-900">
                    {customerName}
                  </h3>

                  <div className="flex flex-col gap-1 mt-2">
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Mail size={14} />
                      {customerEmail}
                    </p>

                    {customerPhone && (
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <Phone size={14} />
                        {customerPhone}
                      </p>
                    )}
                  </div>
                </div>

                {customerPhone && (
                  <a
                    href={`tel:${customerPhone}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 text-green-700 font-semibold text-sm hover:bg-green-100 transition"
                  >
                    <Phone size={16} />
                    Call
                  </a>
                )}
              </div>
            </section>

            {/* SERVICE */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Wrench size={20} className="text-blue-600" />
                </div>

                <h2 className="text-lg font-bold text-slate-900">
                  Service Details
                </h2>
              </div>

              <div className="mt-6">
                <p className="text-sm text-slate-500">Requested Service</p>

                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {serviceName}
                </h3>

                {booking.service?.category && (
                  <p className="text-sm text-blue-600 mt-1">
                    {booking.service.category}
                  </p>
                )}
              </div>

              {booking.providerService?.description && (
                <div className="mt-5">
                  <p className="text-sm text-slate-500">Service Description</p>

                  <div className="bg-slate-50 rounded-xl p-4 mt-2">
                    <p className="text-sm text-slate-700 leading-6">
                      {booking.providerService.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-5">
                <p className="text-sm text-slate-500">Customer Notes</p>

                <div className="bg-slate-50 rounded-xl p-4 mt-2">
                  <div className="flex gap-3">
                    <FileText
                      size={18}
                      className="text-slate-400 mt-0.5 shrink-0"
                    />

                    <p className="text-sm text-slate-700 leading-6">
                      {booking.notes?.trim()
                        ? booking.notes
                        : "No additional notes provided by the customer."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SCHEDULE */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Schedule</h2>

              <div className="grid sm:grid-cols-2 gap-4 mt-5">
                <div className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <CalendarDays size={18} />
                    <span className="text-sm font-semibold">Service Date</span>
                  </div>

                  <p className="text-lg font-bold text-slate-900 mt-2">
                    {formatDate(booking.bookingDate)}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Clock size={18} />
                    <span className="text-sm font-semibold">Service Time</span>
                  </div>

                  <p className="text-lg font-bold text-slate-900 mt-2">
                    {formatTime(booking.bookingDate)}
                  </p>
                </div>
              </div>
            </section>

            {/* LOCATION */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Service Location
              </h2>

              <div className="mt-5 bg-slate-50 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-red-500" />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {bookingAddress}
                    </p>

                    {(bookingCity || bookingState) && (
                      <p className="text-sm text-slate-500 mt-1">
                        {bookingCity}
                        {bookingCity && bookingState ? ", " : ""}
                        {bookingState}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openLocation}
                  className="mt-4 w-full border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600 py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={16} />
                    Open Location
                  </span>
                </button>
              </div>
            </section>

            {/* TIMELINE */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Booking Timeline
              </h2>

              <div className="mt-6">
                <TimelineItem
                  title="Booking Created"
                  description="Customer created this service booking."
                  date={formatDate(booking.createdAt)}
                  completed
                />

                {booking.status === "rejected" ? (
                  <TimelineItem
                    title="Booking Rejected"
                    description="This booking was rejected by the provider."
                    date="Rejected"
                    completed
                    danger
                    last
                  />
                ) : booking.status === "cancelled" ? (
                  <TimelineItem
                    title="Booking Cancelled"
                    description="This booking has been cancelled."
                    date="Cancelled"
                    completed
                    danger
                    last
                  />
                ) : (
                  <>
                    <TimelineItem
                      title="Booking Accepted"
                      description={
                        booking.status === "pending"
                          ? "Waiting for you to accept this booking."
                          : "You accepted the customer's booking."
                      }
                      date={
                        booking.status === "pending" ? "Pending" : "Accepted"
                      }
                      completed={booking.status !== "pending"}
                      current={booking.status === "pending"}
                    />

                    <TimelineItem
                      title="Booking Confirmed"
                      description="The booking has been confirmed."
                      date={
                        ["confirmed", "in-progress", "completed"].includes(
                          booking.status,
                        )
                          ? "Confirmed"
                          : "Pending"
                      }
                      completed={[
                        "confirmed",
                        "in-progress",
                        "completed",
                      ].includes(booking.status)}
                      current={booking.status === "accepted"}
                    />

                    <TimelineItem
                      title="Service Started"
                      description="Service is currently being performed."
                      date={
                        ["in-progress", "completed"].includes(booking.status)
                          ? "Started"
                          : "Pending"
                      }
                      completed={["in-progress", "completed"].includes(
                        booking.status,
                      )}
                      current={booking.status === "confirmed"}
                    />

                    <TimelineItem
                      title="Service Completed"
                      description="The service has been completed successfully."
                      date={
                        booking.status === "completed" ? "Completed" : "Pending"
                      }
                      completed={booking.status === "completed"}
                      current={booking.status === "in-progress"}
                      last
                    />
                  </>
                )}
              </div>
            </section>

            {/* REJECTION / CANCELLATION REASON */}
            {(booking.status === "rejected" ||
              booking.status === "cancelled") &&
              booking.cancellationReason && (
                <section className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <XCircle
                      size={22}
                      className="text-red-600 mt-0.5 shrink-0"
                    />

                    <div>
                      <h2 className="font-bold text-red-800">
                        {booking.status === "rejected"
                          ? "Rejection Reason"
                          : "Cancellation Reason"}
                      </h2>

                      <p className="text-sm text-red-700 mt-2 leading-6">
                        {booking.cancellationReason}
                      </p>
                    </div>
                  </div>
                </section>
              )}
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-6">
            {/* PAYMENT */}

            {/* =================================================
                PAYMENT
            ================================================== */}

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-slate-900">Payment Summary</h2>

              <div className="flex justify-between mt-5 text-sm">
                <span className="text-slate-500">Service Amount</span>

                <span className="font-semibold text-slate-900">
                  ₹{bookingPrice.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="border-t border-slate-100 my-4" />

              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">Total</span>

                <span className="flex items-center font-bold text-xl text-slate-900">
                  <IndianRupee size={18} />
                  {bookingPrice.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Payment method</span>

                <span className="text-sm font-semibold text-slate-800">
                  {booking.paymentMethod === "cash"
                    ? "Cash"
                    : booking.paymentMethod === "online"
                      ? "Online"
                      : "Not specified"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Payment status</span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    booking.paymentStatus === "paid"
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {booking.paymentStatus === "paid"
                    ? "Paid"
                    : booking.paymentStatus === "failed"
                      ? "Failed"
                      : booking.paymentStatus === "refunded"
                        ? "Refunded"
                        : "Pending"}
                </span>
              </div>

              {booking.paymentMethod === "cash" &&
                booking.status === "completed" &&
                booking.paymentStatus !== "paid" && (
                  <button
                    type="button"
                    onClick={handleMarkCashReceived}
                    disabled={Boolean(actionLoading)}
                    className="w-full mt-5 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold disabled:opacity-60 transition"
                  >
                    {actionLoading === "payment" ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <IndianRupee size={18} />
                    )}

                    {actionLoading === "payment"
                      ? "Recording Payment..."
                      : "Mark Cash Received"}
                  </button>
                )}

              {booking.paymentStatus === "paid" && (
                <div className="mt-5 flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 py-3 rounded-xl text-sm font-semibold">
                  <CheckCircle2 size={18} />
                  Payment Received
                </div>
              )}

              <p className="text-xs text-slate-400 mt-4 leading-5">
                Confirm payment only after the customer has actually paid the
                amount in cash.
              </p>
            </section>

            {/* ACTIONS */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-slate-900">Booking Actions</h2>

              <div className="space-y-3 mt-5">
                {/* PENDING */}
                {booking.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={handleAccept}
                      disabled={Boolean(actionLoading)}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold disabled:opacity-60 transition"
                    >
                      {actionLoading === "accept" ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
                      Accept Booking
                    </button>

                    <button
                      type="button"
                      onClick={openRejectModal}
                      disabled={Boolean(actionLoading)}
                      className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-xl font-semibold disabled:opacity-60 transition"
                    >
                      <XCircle size={18} />
                      Reject Booking
                    </button>
                  </>
                )}

                {/* ACCEPTED */}
                {booking.status === "accepted" && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate("confirmed")}
                    disabled={Boolean(actionLoading)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold disabled:opacity-60 transition"
                  >
                    {actionLoading === "confirmed" ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    Confirm Booking
                  </button>
                )}

                {/* CONFIRMED */}
                {booking.status === "confirmed" && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate("in-progress")}
                    disabled={Boolean(actionLoading)}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold disabled:opacity-60 transition"
                  >
                    {actionLoading === "in-progress" ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Zap size={18} />
                    )}
                    Start Service
                  </button>
                )}

                {/* IN PROGRESS */}
                {booking.status === "in-progress" && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate("completed")}
                    disabled={Boolean(actionLoading)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold disabled:opacity-60 transition"
                  >
                    {actionLoading === "completed" ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    Complete Service
                  </button>
                )}

                {/* COMPLETED */}
                {booking.status === "completed" && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <CheckCircle2
                      className="mx-auto text-green-600"
                      size={28}
                    />
                    <p className="font-semibold text-green-800 mt-2">
                      Service Completed
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      This booking has been successfully completed.
                    </p>
                  </div>
                )}

                {/* REJECTED */}
                {booking.status === "rejected" && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <XCircle className="mx-auto text-slate-500" size={28} />
                    <p className="font-semibold text-slate-700 mt-2">
                      Booking Rejected
                    </p>
                  </div>
                )}

                {/* CANCELLED */}
                {booking.status === "cancelled" && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <XCircle className="mx-auto text-red-600" size={28} />
                    <p className="font-semibold text-red-800 mt-2">
                      Booking Cancelled
                    </p>
                  </div>
                )}

                {/* MESSAGE CUSTOMER — OPENS CHAT POPUP */}
                {!isTerminalStatus && (
                  <button
                    type="button"
                    onClick={() => setIsMessageOpen(true)}
                    className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 py-3 rounded-xl font-semibold transition"
                  >
                    <MessageCircle size={18} />
                    Message Customer
                  </button>
                )}
              </div>
            </section>

            {/* PROVIDER INFO */}
            <section className="bg-slate-900 text-white rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
                <Wrench size={21} />
              </div>

              <h3 className="font-bold mt-4">FIXNEAR Provider</h3>

              <p className="text-sm text-slate-400 mt-2 leading-6">
                Keep customer details private and only use them for fulfilling
                this service booking.
              </p>
            </section>
          </aside>
        </div>
      </main>

      {/* =====================================================
          BOOKING MESSAGE POPUP
      ====================================================== */}
      {!isTerminalStatus && (
        <BookingMessagePopup
          open={isMessageOpen}
          onClose={() => setIsMessageOpen(false)}
          bookingId={booking._id}
          currentUserId={currentUserId}
          otherPersonName={customerName}
        />
      )}

      {/* =====================================================
          REJECT MODAL
      ====================================================== */}
      {showReject && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle size={24} className="text-red-600" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 mt-5">
                Reject Booking?
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Please select a reason for rejecting this booking.
              </p>

              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={actionLoading === "reject"}
                className="w-full mt-5 px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-slate-100"
              >
                <option value="">Select a reason</option>
                <option value="Not available at requested time">
                  Not available at requested time
                </option>
                <option value="Location is outside service area">
                  Location is outside service area
                </option>
                <option value="Already booked for another service">
                  Already booked for another service
                </option>
                <option value="Other reason">Other reason</option>
              </select>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  disabled={actionLoading === "reject"}
                  className="flex-1 border border-slate-200 py-3 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition"
                >
                  Keep Booking
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  disabled={actionLoading === "reject" || !rejectReason}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2 transition"
                >
                  {actionLoading === "reject" ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <XCircle size={18} />
                  )}
                  Reject Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// TIMELINE ITEM
// =========================================================
function TimelineItem({
  title,
  description,
  date,
  completed,
  current,
  danger = false,
  last = false,
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            danger
              ? "bg-red-100 text-red-600"
              : completed
                ? "bg-green-100 text-green-600"
                : current
                  ? "bg-blue-100 text-blue-600"
                  : "bg-slate-100 text-slate-400"
          }`}
        >
          {danger ? (
            <XCircle size={18} />
          ) : completed ? (
            <CheckCircle2 size={18} />
          ) : (
            <Clock size={17} />
          )}
        </div>

        {!last && <div className="w-px flex-1 bg-slate-200 mt-2" />}
      </div>

      <div className="pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">{title}</h3>

          {current && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-semibold">
              Current
            </span>
          )}
        </div>

        <p className="text-sm text-slate-500 mt-1">{description}</p>

        <p
          className={`text-xs mt-2 ${
            danger ? "text-red-500" : "text-slate-400"
          }`}
        >
          {date}
        </p>
      </div>
    </div>
  );
}

export default ProviderBookingDetails;
