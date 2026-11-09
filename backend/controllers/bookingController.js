const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Booking = require("../models/Booking");
const Provider = require("../models/Provider");
const Service = require("../models/Service");
const ProviderService = require("../models/ProviderService");
const { createNotification } = require("../utils/notificationHelper");

const {
  withProviderBookingLock,
  findBookingConflict,
  activatePaidBooking,
} = require("../utils/bookingConcurrency");
const {
  getPagination,
  getPaginationMeta,
  applyPagination,
} = require("../utils/pagination");

// =====================================================
// RAZORPAY CONFIGURATION
// =====================================================

const ONLINE_PAYMENT_WINDOW_MINUTES = 15;

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const convertTimeToMinutes = (time) => {
  if (!time || typeof time !== "string") return null;

  const [hours, minutes] = time.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

const getDayName = (date) => {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return days[date.getDay()];
};

const formatDayName = (day) =>
  day ? day.charAt(0).toUpperCase() + day.slice(1) : "";

const getBookingEndDate = (startDate, duration) => {
  const start = new Date(startDate);
  const minutes = Number(duration);

  if (
    Number.isNaN(start.getTime()) ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw new Error("Invalid booking date or service duration.");
  }

  const end = new Date(start.getTime() + minutes * 60 * 1000);

  if (Number.isNaN(end.getTime())) {
    throw new Error("Could not calculate booking end date.");
  }

  return end;
};

const getRazorpayAmount = (price) => {
  const amount = Number(price);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid booking amount.");
  }

  const paise = Math.round(amount * 100);

  if (!Number.isSafeInteger(paise) || paise <= 0) {
    throw new Error("Invalid booking amount.");
  }

  return paise;
};

const populateBooking = async (booking) => {
  await booking.populate([
    { path: "customer", select: "-password" },
    { path: "provider" },
    { path: "service" },
    { path: "providerService" },
  ]);

  return booking;
};

const sendServerError = (res, message, error) => {
  console.error(`${message}:`, error);

  return res.status(500).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};

// =====================================================
// CREATE BOOKING - CUSTOMER
// POST /api/bookings
// =====================================================

const createBooking = async (req, res) => {
  try {
    const {
      provider,
      service,
      providerService,
      bookingDate,
      address,
      city,
      state,
      notes,
      paymentMethod = "cash",
    } = req.body;

    if (!["cash", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Payment method must be cash or online.",
      });
    }

    if (
      !provider ||
      !service ||
      !providerService ||
      !bookingDate ||
      !address?.trim() ||
      !city?.trim() ||
      !state?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided.",
      });
    }

    if (
      !isValidObjectId(provider) ||
      !isValidObjectId(service) ||
      !isValidObjectId(providerService)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider, service or provider service ID.",
      });
    }

    const selectedDate = new Date(bookingDate);

    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking date.",
      });
    }

    selectedDate.setSeconds(0, 0);

    if (selectedDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Booking date and time must be in the future.",
      });
    }

    const paymentExpiresAt =
      paymentMethod === "online"
        ? new Date(Date.now() + ONLINE_PAYMENT_WINDOW_MINUTES * 60 * 1000)
        : null;

    // All slot checks and booking writes for this provider run under
    // the same transaction lock. This prevents two customers from
    // reserving the same slot at the same time.
    const result = await withProviderBookingLock(provider, async (session) => {
      const providerData = await Provider.findOne({
        _id: provider,
        isVerified: true,
        isAvailable: true,
      }).session(session);

      if (!providerData) {
        const error = new Error("Provider is not available for booking.");
        error.statusCode = 404;
        throw error;
      }

      const serviceData = await Service.findOne({
        _id: service,
        isActive: true,
      }).session(session);

      if (!serviceData) {
        const error = new Error("Service not found or inactive.");
        error.statusCode = 404;
        throw error;
      }

      const providerServiceData = await ProviderService.findOne({
        _id: providerService,
        provider: providerData._id,
        service: serviceData._id,
        isActive: true,
      }).session(session);

      if (!providerServiceData) {
        const error = new Error("Provider service not found or inactive.");
        error.statusCode = 404;
        throw error;
      }

      const duration = Number(providerServiceData.duration || 60);

      if (!Number.isFinite(duration) || duration < 15) {
        const error = new Error("Provider service has an invalid duration.");
        error.statusCode = 400;
        throw error;
      }

      const selectedDay = getDayName(selectedDate);
      const daySchedule = providerData.workingHours?.[selectedDay];

      if (!daySchedule) {
        const error = new Error(
          `Working hours are not configured for ${formatDayName(selectedDay)}.`,
        );
        error.statusCode = 400;
        throw error;
      }

      if (daySchedule.enabled !== true) {
        const error = new Error(
          `Provider is not available on ${formatDayName(selectedDay)}.`,
        );
        error.statusCode = 400;
        throw error;
      }

      const startMinutes = convertTimeToMinutes(daySchedule.start);
      const endMinutes = convertTimeToMinutes(daySchedule.end);

      if (
        startMinutes === null ||
        endMinutes === null ||
        startMinutes >= endMinutes
      ) {
        const error = new Error(
          `Provider has invalid working hours for ${formatDayName(selectedDay)}.`,
        );
        error.statusCode = 400;
        throw error;
      }

      const bookingStartMinutes =
        selectedDate.getHours() * 60 + selectedDate.getMinutes();

      if (
        bookingStartMinutes < startMinutes ||
        bookingStartMinutes >= endMinutes
      ) {
        const error = new Error(
          `Booking time must be between ${daySchedule.start} and ${daySchedule.end} on ${formatDayName(selectedDay)}.`,
        );
        error.statusCode = 400;
        throw error;
      }

      if (bookingStartMinutes + duration > endMinutes) {
        const error = new Error(
          `This service takes ${duration} minutes and would extend beyond the provider's working hours.`,
        );
        error.statusCode = 400;
        throw error;
      }

      const now = new Date();

      // Expire abandoned online reservations without an order.
      await Booking.updateMany(
        {
          provider: providerData._id,
          status: "pending_payment",
          paymentStatus: "pending",
          paymentExpiresAt: { $lte: now },
          $or: [
            { razorpayOrderId: null },
            { razorpayOrderId: { $exists: false } },
          ],
        },
        {
          $set: {
            status: "cancelled",
            paymentStatus: "failed",
            cancellationReason: "Online payment window expired.",
          },
        },
        { session },
      );

      const bookingEndDate = getBookingEndDate(selectedDate, duration);

      const conflict = await findBookingConflict({
        providerId: providerData._id,
        bookingDate: selectedDate,
        bookingEndDate,
        duration,
        session,
      });

      if (conflict) {
        const error = new Error(
          "This time slot overlaps with an existing booking.",
        );
        error.statusCode = 409;
        error.conflict = {
          bookingDate: conflict.bookingDate,
          duration: conflict.duration,
        };
        throw error;
      }

      const [booking] = await Booking.create(
        [
          {
            customer: req.user._id,
            provider: providerData._id,
            service: serviceData._id,
            providerService: providerServiceData._id,
            price: providerServiceData.price,
            bookingDate: selectedDate,
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            notes: typeof notes === "string" ? notes.trim() : "",
            status: paymentMethod === "online" ? "pending_payment" : "pending",
            paymentMethod,
            paymentStatus: "pending",
            paymentExpiresAt,
          },
        ],
        { session },
      );

      // Cash booking and counter update commit together.
      // Online bookings are counted only after payment succeeds.
      if (paymentMethod === "cash") {
        await ProviderService.updateOne(
          { _id: providerServiceData._id },
          { $inc: { bookingCount: 1 } },
          { session },
        );
      }

      return {
        bookingId: booking._id,
        providerUserId: providerData.user,
        paymentMethod,
      };
    });

    // Notifications are deliberately outside the transaction.
    // A transaction callback may be retried by MongoDB.
    if (result.paymentMethod === "cash") {
      try {
        await createNotification({
          user: result.providerUserId,
          title: "New Booking Request",
          message: "You have received a new cash service booking request.",
          type: "booking",
          booking: result.bookingId,
        });
      } catch (notificationError) {
        console.error(
          "Booking notification failed:",
          notificationError.message,
        );
      }
    }

    const booking = await Booking.findById(result.bookingId);
    await populateBooking(booking);

    return res.status(201).json({
      success: true,
      message:
        paymentMethod === "online"
          ? "Booking reservation created. Complete online payment within 15 minutes."
          : "Booking created successfully. Payment method: Cash.",
      booking,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        ...(error.conflict ? { conflict: error.conflict } : {}),
      });
    }

    return sendServerError(res, "Failed to create booking", error);
  }
};
// =====================================================
// GET MY BOOKINGS - CUSTOMER
// GET /api/bookings/my
// =====================================================

const getMyBookings = async (req, res) => {
  try {
    const filter = {
      customer: req.user._id,
    };

    const pagination = getPagination(req.query, 10, 100);

    const total = await Booking.countDocuments(filter);

    let bookingsQuery = Booking.find(filter)
      .populate("provider")
      .populate("service")
      .populate("providerService")
      .sort({ createdAt: -1, _id: -1 });

    bookingsQuery = applyPagination(bookingsQuery, pagination);

    const bookings = await bookingsQuery;

    return res.status(200).json({
      success: true,
      count: total,
      bookings,
      pagination: getPaginationMeta(total, pagination),
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch bookings", error);
  }
};

// =====================================================
// GET BOOKING BY ID
// GET /api/bookings/:id
// =====================================================

const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await Booking.findById(id)
      .populate("customer", "-password")
      .populate("provider")
      .populate("service")
      .populate("providerService");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const isCustomer =
      booking.customer?._id?.toString() === req.user._id.toString();

    const isProvider =
      booking.provider?.user?.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this booking.",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch booking", error);
  }
};

// =====================================================
// GET PROVIDER BOOKINGS
// =====================================================

const getProviderBookings = async (req, res) => {
  try {
    const provider = await Provider.findOne({
      user: req.user._id,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found.",
      });
    }

    const filter = {
      provider: provider._id,
      status: { $ne: "pending_payment" },
    };

    const pagination = getPagination(req.query, 10, 100);

    const total = await Booking.countDocuments(filter);

    let bookingsQuery = Booking.find(filter)
      .populate("customer", "-password")
      .populate("service")
      .populate("providerService")
      .sort({ createdAt: -1, _id: -1 });

    bookingsQuery = applyPagination(bookingsQuery, pagination);

    const bookings = await bookingsQuery;

    return res.status(200).json({
      success: true,
      count: total,
      bookings,
      pagination: getPaginationMeta(total, pagination),
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch provider bookings", error);
  }
};

// =====================================================
// GET PROVIDER BOOKING STATS
// =====================================================

const getProviderBookingStats = async (req, res) => {
  try {
    const provider = await Provider.findOne({
      user: req.user._id,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found.",
      });
    }

    const providerId = provider._id;

    const visibleBookingFilter = {
      provider: providerId,
      status: { $ne: "pending_payment" },
    };

    const [
      total,
      pending,
      accepted,
      confirmed,
      inProgress,
      completed,
      rejected,
      cancelled,
    ] = await Promise.all([
      Booking.countDocuments(visibleBookingFilter),
      Booking.countDocuments({ provider: providerId, status: "pending" }),
      Booking.countDocuments({ provider: providerId, status: "accepted" }),
      Booking.countDocuments({ provider: providerId, status: "confirmed" }),
      Booking.countDocuments({ provider: providerId, status: "in-progress" }),
      Booking.countDocuments({ provider: providerId, status: "completed" }),
      Booking.countDocuments({ provider: providerId, status: "rejected" }),
      Booking.countDocuments({ provider: providerId, status: "cancelled" }),
    ]);

    const earningsResult = await Booking.aggregate([
      {
        $match: {
          provider: providerId,
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$price" },
        },
      },
    ]);

    const totalEarnings =
      earningsResult.length > 0 ? earningsResult[0].totalEarnings : 0;

    return res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        accepted,
        confirmed,
        inProgress,
        completed,
        rejected,
        cancelled,
        totalEarnings,
      },
    });
  } catch (error) {
    console.error("Provider booking statistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking statistics.",
    });
  }
};

// =====================================================
// ACCEPT BOOKING - PROVIDER
// =====================================================

const acceptBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const provider = await Provider.findOne({ user: req.user._id });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found.",
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      provider: provider._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (
      booking.paymentMethod === "online" &&
      booking.paymentStatus !== "paid"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Online payment must be verified before accepting this booking.",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be accepted.",
      });
    }

    booking.status = "accepted";
    await booking.save();

    await createNotification({
      user: booking.customer,
      title: "Booking Accepted",
      message: "Your booking has been accepted by the provider.",
      type: "booking_status",
      booking: booking._id,
    });

    await populateBooking(booking);

    return res.status(200).json({
      success: true,
      message: "Booking accepted successfully.",
      booking,
    });
  } catch (error) {
    return sendServerError(res, "Failed to accept booking", error);
  }
};

// =====================================================
// REJECT BOOKING - PROVIDER
// =====================================================

const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const provider = await Provider.findOne({ user: req.user._id });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found.",
      });
    }

    const result = await withProviderBookingLock(
      provider._id,
      async (session) => {
        const booking = await Booking.findOne({
          _id: id,
          provider: provider._id,
        }).session(session);

        if (!booking) {
          const error = new Error("Booking not found.");
          error.statusCode = 404;
          throw error;
        }

        if (
          booking.paymentMethod === "online" &&
          booking.paymentStatus === "paid"
        ) {
          const error = new Error(
            "This online booking has been paid. A refund must be handled before rejection.",
          );
          error.statusCode = 409;
          throw error;
        }

        if (booking.status !== "pending") {
          const error = new Error("Only pending bookings can be rejected.");
          error.statusCode = 400;
          throw error;
        }

        booking.status = "rejected";
        booking.cancellationReason =
          typeof reason === "string" ? reason.trim().slice(0, 500) : "";

        await booking.save({ session });

        return {
          bookingId: booking._id,
          customerId: booking.customer,
        };
      },
    );

    try {
      await createNotification({
        user: result.customerId,
        title: "Booking Rejected",
        message: reason
          ? `Your booking was rejected by the provider. Reason: ${reason}`
          : "Your booking was rejected by the provider.",
        type: "booking_status",
        booking: result.bookingId,
      });
    } catch (notificationError) {
      console.error("Rejection notification failed:", notificationError);
    }

    const booking = await Booking.findById(result.bookingId);
    await populateBooking(booking);

    return res.status(200).json({
      success: true,
      message: "Booking rejected successfully.",
      booking,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return sendServerError(res, "Failed to reject booking", error);
  }
};

// =====================================================
// UPDATE BOOKING STATUS - PROVIDER
// =====================================================

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["confirmed", "in-progress", "completed"];

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status.",
      });
    }

    const provider = await Provider.findOne({ user: req.user._id });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found.",
      });
    }

    const result = await withProviderBookingLock(
      provider._id,
      async (session) => {
        const booking = await Booking.findOne({
          _id: id,
          provider: provider._id,
        }).session(session);

        if (!booking) {
          const error = new Error("Booking not found.");
          error.statusCode = 404;
          throw error;
        }

        if (
          booking.paymentMethod === "online" &&
          booking.paymentStatus !== "paid"
        ) {
          const error = new Error(
            "Online payment must be verified before updating this booking.",
          );
          error.statusCode = 409;
          throw error;
        }

        if (status === "confirmed" && booking.status !== "accepted") {
          const error = new Error("Only accepted bookings can be confirmed.");
          error.statusCode = 400;
          throw error;
        }

        if (status === "in-progress" && booking.status !== "confirmed") {
          const error = new Error("Only confirmed bookings can be started.");
          error.statusCode = 400;
          throw error;
        }

        if (status === "completed" && booking.status !== "in-progress") {
          const error = new Error(
            "Only in-progress bookings can be completed.",
          );
          error.statusCode = 400;
          throw error;
        }

        const previousStatus = booking.status;
        booking.status = status;
        await booking.save({ session });

        if (status === "completed" && previousStatus !== "completed") {
          await Provider.updateOne(
            { _id: provider._id },
            { $inc: { completedBookings: 1 } },
            { session },
          );
        }

        return {
          bookingId: booking._id,
          customerId: booking.customer,
          previousStatus,
        };
      },
    );

    const notifications = {
      confirmed: {
        title: "Booking Confirmed",
        message: "Your booking has been confirmed by the provider.",
        type: "booking_status",
      },
      "in-progress": {
        title: "Service Started",
        message: "Your provider has started working on your service.",
        type: "booking_status",
      },
      completed: {
        title: "Service Completed",
        message:
          "Your service has been completed. Please leave a review for the provider.",
        type: "review",
      },
    };

    if (result.previousStatus !== status) {
      try {
        await createNotification({
          user: result.customerId,
          ...notifications[status],
          booking: result.bookingId,
        });
      } catch (notificationError) {
        console.error("Status notification failed:", notificationError);
      }
    }

    const booking = await Booking.findById(result.bookingId);
    await populateBooking(booking);

    return res.status(200).json({
      success: true,
      message: `Booking marked as ${status}.`,
      booking,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return sendServerError(res, "Failed to update booking status", error);
  }
};
// =====================================================
// CANCEL BOOKING - CUSTOMER
// =====================================================

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const existing = await Booking.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const result = await withProviderBookingLock(
      existing.provider,
      async (session) => {
        const booking = await Booking.findOne({
          _id: id,
          customer: req.user._id,
        }).session(session);

        if (!booking) {
          const error = new Error("Booking not found.");
          error.statusCode = 404;
          throw error;
        }

        if (["completed", "rejected", "cancelled"].includes(booking.status)) {
          const error = new Error("This booking cannot be cancelled.");
          error.statusCode = 400;
          throw error;
        }

        if (booking.paymentStatus === "paid") {
          const error = new Error(
            "This booking has a recorded payment. Process a refund before cancelling it.",
          );
          error.statusCode = 400;
          throw error;
        }

        booking.status = "cancelled";
        booking.cancellationReason =
          typeof reason === "string" ? reason.trim().slice(0, 500) : "";

        if (
          booking.paymentMethod === "online" &&
          booking.paymentStatus === "pending"
        ) {
          booking.paymentStatus = "failed";
        }

        await booking.save({ session });

        const provider = await Provider.findById(booking.provider).session(
          session,
        );

        return {
          bookingId: booking._id,
          providerUserId: provider?.user,
        };
      },
    );

    if (result.providerUserId) {
      try {
        await createNotification({
          user: result.providerUserId,
          title: "Booking Cancelled",
          message: reason
            ? `A customer cancelled the booking. Reason: ${reason}`
            : "A customer has cancelled the booking.",
          type: "booking_status",
          booking: result.bookingId,
        });
      } catch (notificationError) {
        console.error("Cancellation notification failed:", notificationError);
      }
    }

    const booking = await Booking.findById(result.bookingId);
    await populateBooking(booking);

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
      booking,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return sendServerError(res, "Failed to cancel booking", error);
  }
};

// =====================================================
// GET ALL BOOKINGS - ADMIN
// =====================================================

const getAllBookings = async (req, res) => {
  try {
    const filter = {};

    const pagination = getPagination(req.query, 10, 100);

    const total = await Booking.countDocuments(filter);

    let bookingsQuery = Booking.find(filter)
      .populate("customer", "-password")
      .populate("provider")
      .populate("service")
      .populate("providerService")
      .sort({ createdAt: -1, _id: -1 });

    bookingsQuery = applyPagination(bookingsQuery, pagination);

    const bookings = await bookingsQuery;

    return res.status(200).json({
      success: true,
      count: total,
      bookings,
      pagination: getPaginationMeta(total, pagination),
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch all bookings", error);
  }
};

// =====================================================
// ADMIN UPDATE BOOKING STATUS
// =====================================================

const adminUpdateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "accepted",
      "rejected",
      "confirmed",
      "in-progress",
      "completed",
      "cancelled",
    ];

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status.",
      });
    }

    const existing = await Booking.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const result = await withProviderBookingLock(
      existing.provider,
      async (session) => {
        const booking = await Booking.findById(id).session(session);

        if (!booking) {
          const error = new Error("Booking not found.");
          error.statusCode = 404;
          throw error;
        }

        if (
          booking.paymentMethod === "online" &&
          booking.paymentStatus !== "paid"
        ) {
          const error = new Error(
            "Unpaid online reservations cannot be moved to an active booking status.",
          );
          error.statusCode = 409;
          throw error;
        }

        if (
          booking.paymentStatus === "paid" &&
          ["cancelled", "rejected"].includes(status)
        ) {
          const error = new Error(
            "A paid booking cannot be cancelled or rejected without handling its refund.",
          );
          error.statusCode = 400;
          throw error;
        }

        const previousStatus = booking.status;
        booking.status = status;
        await booking.save({ session });

        if (status === "completed" && previousStatus !== "completed") {
          await Provider.updateOne(
            { _id: booking.provider },
            { $inc: { completedBookings: 1 } },
            { session },
          );
        }

        const provider = await Provider.findById(booking.provider).session(
          session,
        );

        return {
          bookingId: booking._id,
          customerId: booking.customer,
          providerUserId: provider?.user,
          previousStatus,
        };
      },
    );

    if (result.previousStatus !== status) {
      try {
        await createNotification({
          user: result.customerId,
          title: "Booking Status Updated",
          message: `Your booking status has been changed to ${status}.`,
          type: "booking_status",
          booking: result.bookingId,
        });

        if (result.providerUserId) {
          await createNotification({
            user: result.providerUserId,
            title: "Booking Status Updated",
            message: `A booking status has been changed to ${status} by admin.`,
            type: "booking_status",
            booking: result.bookingId,
          });
        }
      } catch (notificationError) {
        console.error("Admin status notification failed:", notificationError);
      }
    }

    const booking = await Booking.findById(result.bookingId);
    await populateBooking(booking);

    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully.",
      booking,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return sendServerError(res, "Failed to update booking status", error);
  }
};

// =====================================================
// ADMIN CANCEL BOOKING
// =====================================================

const adminCancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const existing = await Booking.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const result = await withProviderBookingLock(
      existing.provider,
      async (session) => {
        const booking = await Booking.findById(id).session(session);

        if (!booking) {
          const error = new Error("Booking not found.");
          error.statusCode = 404;
          throw error;
        }

        if (["completed", "cancelled"].includes(booking.status)) {
          const error = new Error("This booking cannot be cancelled.");
          error.statusCode = 400;
          throw error;
        }

        if (booking.paymentStatus === "paid") {
          const error = new Error(
            "A paid booking cannot be cancelled until its refund is handled.",
          );
          error.statusCode = 400;
          throw error;
        }

        const previousStatus = booking.status;
        booking.status = "cancelled";
        booking.cancellationReason =
          typeof reason === "string" ? reason.trim().slice(0, 500) : "";

        if (
          booking.paymentMethod === "online" &&
          booking.paymentStatus === "pending"
        ) {
          booking.paymentStatus = "failed";
        }

        await booking.save({ session });

        const provider = await Provider.findById(booking.provider).session(
          session,
        );

        return {
          bookingId: booking._id,
          customerId: booking.customer,
          providerUserId: provider?.user,
          previousStatus,
        };
      },
    );

    if (result.previousStatus !== "cancelled") {
      try {
        await createNotification({
          user: result.customerId,
          title: "Booking Cancelled",
          message: reason
            ? `Your booking has been cancelled by admin. Reason: ${reason}`
            : "Your booking has been cancelled by admin.",
          type: "booking_status",
          booking: result.bookingId,
        });

        if (result.providerUserId) {
          await createNotification({
            user: result.providerUserId,
            title: "Booking Cancelled",
            message: reason
              ? `A booking has been cancelled by admin. Reason: ${reason}`
              : "A booking has been cancelled by admin.",
            type: "booking_status",
            booking: result.bookingId,
          });
        }
      } catch (notificationError) {
        console.error(
          "Admin cancellation notification failed:",
          notificationError,
        );
      }
    }

    const booking = await Booking.findById(result.bookingId);
    await populateBooking(booking);

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
      booking,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return sendServerError(res, "Failed to cancel booking", error);
  }
};

// =====================================================
// MARK CASH PAYMENT RECEIVED - PROVIDER
// PATCH /api/bookings/:id/payment/collect
// =====================================================

const markCashPaymentReceived = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const provider = await Provider.findOne({ user: req.user._id });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found.",
      });
    }

    const result = await withProviderBookingLock(
      provider._id,
      async (session) => {
        const booking = await Booking.findOne({
          _id: id,
          provider: provider._id,
        }).session(session);

        if (!booking) {
          const error = new Error("Booking not found.");
          error.statusCode = 404;
          throw error;
        }

        if (booking.paymentMethod !== "cash") {
          const error = new Error("Only cash payments can be recorded here.");
          error.statusCode = 400;
          throw error;
        }

        if (booking.status !== "completed") {
          const error = new Error(
            "Complete the service before recording payment.",
          );
          error.statusCode = 400;
          throw error;
        }

        if (booking.paymentStatus === "paid") {
          const error = new Error("Payment has already been recorded.");
          error.statusCode = 400;
          throw error;
        }

        booking.paymentStatus = "paid";
        booking.paymentPaidAt = new Date();
        await booking.save({ session });

        return {
          bookingId: booking._id,
          customerId: booking.customer,
          price: booking.price,
        };
      },
    );

    try {
      await createNotification({
        user: result.customerId,
        title: "Cash Payment Received",
        message: `Your cash payment of ${result.price} has been recorded.`,
        type: "booking_status",
        booking: result.bookingId,
      });
    } catch (notificationError) {
      console.error("Cash payment notification failed:", notificationError);
    }

    const booking = await Booking.findById(result.bookingId);

    return res.status(200).json({
      success: true,
      message: "Cash payment recorded successfully.",
      booking,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return sendServerError(res, "Failed to record cash payment", error);
  }
};
// =====================================================
// CREATE RAZORPAY ORDER - CUSTOMER
// POST /api/bookings/:id/payment/order
// =====================================================

const createRazorpayOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Online payment is not configured on the server.",
      });
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.paymentMethod !== "online") {
      return res.status(400).json({
        success: false,
        message: "This booking is not configured for online payment.",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(409).json({
        success: false,
        message: "This booking has already been paid.",
      });
    }

    if (booking.status !== "pending_payment") {
      return res.status(409).json({
        success: false,
        message: "This booking is no longer awaiting online payment.",
      });
    }

    if (booking.paymentExpiresAt && booking.paymentExpiresAt <= new Date()) {
      if (!booking.razorpayOrderId) {
        await withProviderBookingLock(booking.provider, async (session) => {
          await Booking.updateOne(
            {
              _id: booking._id,
              status: "pending_payment",
              paymentStatus: "pending",
              razorpayOrderId: { $in: [null, undefined] },
            },
            {
              $set: {
                status: "cancelled",
                paymentStatus: "failed",
                cancellationReason: "Online payment window expired.",
              },
            },
            { session },
          );
        });
      }

      return res.status(410).json({
        success: false,
        message:
          "The payment window has expired. Please create a new booking. If you already completed payment, use the payment verification flow or contact support.",
      });
    }

    const amount = getRazorpayAmount(booking.price);

    if (booking.razorpayOrderId) {
      try {
        const existingOrder = await razorpay.orders.fetch(
          booking.razorpayOrderId,
        );

        if (
          existingOrder &&
          Number(existingOrder.amount) === amount &&
          existingOrder.currency === "INR"
        ) {
          if (existingOrder.status === "created") {
            return res.status(200).json({
              success: true,
              message: "Existing Razorpay order reused.",
              keyId: process.env.RAZORPAY_KEY_ID,
              order: {
                id: existingOrder.id,
                amount: existingOrder.amount,
                currency: existingOrder.currency,
              },
              bookingId: booking._id,
            });
          }

          return res.status(409).json({
            success: false,
            message:
              "A previous payment attempt exists for this booking. Verify its status before creating another payment order.",
          });
        }
      } catch (fetchError) {
        console.error(
          "Could not verify existing Razorpay order:",
          fetchError.message,
        );

        return res.status(503).json({
          success: false,
          message:
            "Unable to verify the previous payment order. Please retry shortly.",
        });
      }
    }

    // Razorpay API calls must remain outside MongoDB transactions.
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `booking_${booking._id}`,
      notes: {
        bookingId: booking._id.toString(),
        customerId: req.user._id.toString(),
      },
    });

    // Save the order ID only if the reservation is still awaiting payment.
    const savedBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        customer: req.user._id,
        status: "pending_payment",
        paymentStatus: "pending",
        $or: [
          { razorpayOrderId: null },
          { razorpayOrderId: { $exists: false } },
        ],
      },
      {
        $set: { razorpayOrderId: order.id },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!savedBooking) {
      // The order exists at Razorpay, but this request lost the race to
      // another request or the booking state changed. Do not activate it.
      return res.status(409).json({
        success: false,
        message:
          "The booking payment state changed. Refresh the booking before retrying.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Razorpay order created successfully.",
      keyId: process.env.RAZORPAY_KEY_ID,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      bookingId: savedBooking._id,
    });
  } catch (error) {
    return sendServerError(res, "Failed to create online payment order", error);
  }
};

// =====================================================
// VERIFY RAZORPAY PAYMENT - CUSTOMER
// POST /api/bookings/:id/payment/verify
// =====================================================

const verifyRazorpayPayment = async (req, res) => {
  try {
    if (!razorpay || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        success: false,
        message: "Online payment is not configured on the server.",
      });
    }

    const { id } = req.params;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string" ||
      !razorpay_order_id.trim() ||
      !razorpay_payment_id.trim() ||
      !/^[a-f0-9]{64}$/i.test(razorpay_signature)
    ) {
      return res.status(400).json({
        success: false,
        message: "Required Razorpay payment details are invalid or missing.",
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.paymentMethod !== "online") {
      return res.status(400).json({
        success: false,
        message: "This booking is not configured for online payment.",
      });
    }

    if (booking.paymentStatus === "paid") {
      if (booking.paymentId === razorpay_payment_id) {
        await populateBooking(booking);

        return res.status(200).json({
          success: true,
          message: "Payment has already been verified.",
          booking,
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "A different payment has already been recorded for this booking.",
      });
    }

    if (booking.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order does not match this booking.",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const receivedBuffer = Buffer.from(razorpay_signature, "hex");
    const generatedBuffer = Buffer.from(generatedSignature, "hex");

    if (
      receivedBuffer.length !== generatedBuffer.length ||
      !crypto.timingSafeEqual(receivedBuffer, generatedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature.",
      });
    }

    // Verify the payment directly with Razorpay before changing the database.
    const [payment, order] = await Promise.all([
      razorpay.payments.fetch(razorpay_payment_id),
      razorpay.orders.fetch(razorpay_order_id),
    ]);

    const expectedAmount = getRazorpayAmount(booking.price);

    if (
      payment.order_id !== razorpay_order_id ||
      Number(payment.amount) !== expectedAmount ||
      payment.currency !== "INR" ||
      payment.status !== "captured" ||
      Number(order.amount) !== expectedAmount ||
      order.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay payment amount, currency, order or capture status is invalid.",
      });
    }

    // The helper serializes activation against all other slot changes
    // for this provider and increments bookingCount in the same transaction.
    const activation = await activatePaidBooking({
      bookingId: booking._id,
      customerId: req.user._id,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      paidAt: new Date(),
    });

    if (activation.status === "refund_required") {
      try {
        const refund = await razorpay.payments.refund(razorpay_payment_id, {
          amount: expectedAmount,
          notes: {
            bookingId: booking._id.toString(),
            reason: activation.reason || "Booking slot unavailable",
          },
        });

        await Booking.updateOne(
          {
            _id: booking._id,
            paymentId: razorpay_payment_id,
            paymentStatus: "paid",
          },
          {
            $set: {
              status: "cancelled",
              paymentStatus: "refunded",
              cancellationReason: "Slot became unavailable; refund requested.",
            },
          },
        );

        return res.status(409).json({
          success: false,
          message:
            "The slot is no longer available. A refund has been requested.",
          refundId: refund.id,
        });
      } catch (refundError) {
        console.error("Automatic refund request failed:", refundError);

        return res.status(409).json({
          success: false,
          message:
            "Payment was captured but the booking could not be activated. Please contact support for a refund.",
          supportRequired: true,
        });
      }
    }

    if (
      activation.status !== "activated" &&
      activation.status !== "already_paid"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Booking payment state changed. Refresh and check your booking.",
      });
    }

    const activatedBooking =
      activation.booking || (await Booking.findById(booking._id));

    if (activation.status === "activated") {
      try {
        const provider = await Provider.findById(booking.provider).select(
          "user",
        );

        if (provider?.user) {
          await createNotification({
            user: provider.user,
            title: "New Paid Booking Request",
            message:
              "A customer has completed online payment for a new booking request.",
            type: "booking",
            booking: activatedBooking._id,
          });
        }

        await createNotification({
          user: booking.customer,
          title: "Online Payment Successful",
          message: `Your online payment of ${booking.price} was successful and your booking request has been submitted.`,
          type: "booking_status",
          booking: activatedBooking._id,
        });
      } catch (notificationError) {
        console.error(
          "Payment notification failed:",
          notificationError.message,
        );
      }
    }

    await populateBooking(activatedBooking);

    return res.status(200).json({
      success: true,
      message:
        activation.status === "already_paid"
          ? "Payment has already been verified."
          : "Payment verified successfully. Your booking request is now active.",
      booking: activatedBooking,
    });
  } catch (error) {
    return sendServerError(res, "Failed to verify online payment", error);
  }
};
// =====================================================
// RAZORPAY WEBHOOK
// POST /api/bookings/razorpay/webhook
// =====================================================

const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!webhookSecret) {
      console.error("Razorpay webhook secret is not configured.");
      return res.status(500).json({ success: false });
    }

    if (!Buffer.isBuffer(req.body) || !signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook request.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    const received = Buffer.from(signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature.",
      });
    }

    const event = JSON.parse(req.body.toString("utf8"));

    // -------------------------------------------------
    // PAYMENT CAPTURED
    // -------------------------------------------------

    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;

      if (!payment?.id || !payment?.order_id) {
        return res.status(400).json({
          success: false,
          message: "Payment details are missing.",
        });
      }

      const booking = await Booking.findOne({
        razorpayOrderId: payment.order_id,
        paymentMethod: "online",
      });

      if (!booking) {
        console.error("Webhook received for unknown order:", payment.order_id);
        return res.status(200).json({ success: true });
      }

      const expectedAmount = getRazorpayAmount(booking.price);

      if (
        Number(payment.amount) !== expectedAmount ||
        payment.currency !== "INR" ||
        payment.status !== "captured"
      ) {
        console.error(
          "Webhook payment details do not match booking:",
          booking._id,
        );

        return res.status(400).json({
          success: false,
          message: "Payment details do not match the booking.",
        });
      }

      if (
        booking.paymentStatus === "paid" &&
        booking.paymentId === payment.id
      ) {
        return res.status(200).json({ success: true });
      }

      const activation = await activatePaidBooking({
        bookingId: booking._id,
        orderId: payment.order_id,
        paymentId: payment.id,
        signature: null,
        paidAt: new Date(),
      });

      if (activation.status === "refund_required") {
        try {
          if (!razorpay) {
            throw new Error("Razorpay is not configured.");
          }

          const refund = await razorpay.payments.refund(payment.id, {
            amount: expectedAmount,
            notes: {
              bookingId: booking._id.toString(),
              reason: activation.reason || "Booking slot unavailable",
            },
          });

          console.log("Refund requested for captured payment:", refund.id);
        } catch (refundError) {
          console.error(
            "Automatic webhook refund request failed:",
            refundError.message,
          );
          // Payment remains recorded as paid and cancelled. Support can
          // reconcile it, and the refund webhook updates it when processed.
        }

        return res.status(200).json({ success: true });
      }

      if (
        activation.status !== "activated" &&
        activation.status !== "already_paid"
      ) {
        console.warn(
          "Booking state changed during webhook processing:",
          booking._id,
        );
        return res.status(200).json({ success: true });
      }

      if (activation.status === "activated") {
        const activatedBooking =
          activation.booking || (await Booking.findById(booking._id));

        try {
          const provider = await Provider.findById(
            activatedBooking.provider,
          ).select("user");

          if (provider?.user) {
            await createNotification({
              user: provider.user,
              title: "New Paid Booking Request",
              message:
                "A customer has completed online payment for a new booking request.",
              type: "booking",
              booking: activatedBooking._id,
            });
          }

          await createNotification({
            user: activatedBooking.customer,
            title: "Online Payment Successful",
            message: `Your online payment of ${activatedBooking.price} was successful.`,
            type: "booking_status",
            booking: activatedBooking._id,
          });
        } catch (notificationError) {
          console.error(
            "Webhook notification failed:",
            notificationError.message,
          );
        }
      }

      return res.status(200).json({ success: true });
    }

    // -------------------------------------------------
    // PAYMENT FAILED
    // -------------------------------------------------

    if (event.event === "payment.failed") {
      const payment = event.payload?.payment?.entity;

      // Do not cancel the booking here. Another payment attempt
      // against the same order may still succeed.
      console.log("Razorpay payment attempt failed:", payment?.id || "unknown");

      return res.status(200).json({ success: true });
    }

    // -------------------------------------------------
    // REFUND PROCESSED
    // -------------------------------------------------

    if (event.event === "refund.processed") {
      const refund = event.payload?.refund?.entity;

      if (!refund?.payment_id) {
        return res.status(200).json({ success: true });
      }

      const booking = await Booking.findOne({
        paymentId: refund.payment_id,
        paymentMethod: "online",
      });

      if (!booking) {
        return res.status(200).json({ success: true });
      }

      const expectedAmount = getRazorpayAmount(booking.price);

      // This project currently supports full refunds only.
      if (Number(refund.amount) < expectedAmount) {
        console.warn(
          "Partial refund received; manual reconciliation required:",
          refund.id,
        );

        return res.status(200).json({ success: true });
      }

      await Booking.updateOne(
        {
          _id: booking._id,
          paymentId: refund.payment_id,
          paymentStatus: "paid",
        },
        {
          $set: {
            paymentStatus: "refunded",
            status: booking.status === "completed" ? "completed" : "cancelled",
            cancellationReason:
              booking.cancellationReason || "Payment refund processed.",
          },
        },
      );

      return res.status(200).json({ success: true });
    }

    // Acknowledge other events.
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Razorpay webhook processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed.",
    });
  }
};

// =====================================================
// GET PENDING PAYMENT BOOKING
// =====================================================

const getPendingPaymentBooking = async (req, res) => {
  try {
    const { providerServiceId, serviceId, providerId } = req.query;

    if (
      !mongoose.Types.ObjectId.isValid(providerServiceId || "") ||
      !mongoose.Types.ObjectId.isValid(serviceId || "") ||
      !mongoose.Types.ObjectId.isValid(providerId || "")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking details.",
      });
    }

    const booking = await Booking.findOne({
      customer: req.user._id,
      providerService: providerServiceId,
      service: serviceId,
      provider: providerId,
      paymentMethod: "online",
      paymentStatus: "pending",
      status: "pending_payment",
      paymentExpiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate("service", "name title")
      .populate("provider", "businessName name")
      .populate("providerService", "price duration");

    return res.status(200).json({
      success: true,
      pendingBooking: booking || null,
      message: booking
        ? "Unpaid booking found."
        : "No active unpaid booking found.",
    });
  } catch (error) {
    console.error("Pending payment recovery error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to recover pending payment.",
    });
  }
};

// =====================================================
// EXPORT ALL CONTROLLERS
// =====================================================

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  getProviderBookings,
  getProviderBookingStats,
  acceptBooking,
  rejectBooking,
  updateBookingStatus,
  cancelBooking,
  getAllBookings,
  adminUpdateBookingStatus,
  adminCancelBooking,
  markCashPaymentReceived,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  getPendingPaymentBooking,
};
