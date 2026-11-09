const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");
const ProviderService = require("../models/ProviderService");

const ACTIVE_STATUSES = ["pending", "accepted", "confirmed", "in-progress"];

const getEnd = (start, duration) => {
  const startDate = new Date(start);
  const minutes = Number(duration);

  if (
    Number.isNaN(startDate.getTime()) ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw new Error("Invalid booking date or service duration.");
  }

  return new Date(startDate.getTime() + minutes * 60 * 1000);
};

/**
 * Serializes booking writes for one provider.
 * Requires MongoDB replica-set or sharded-cluster transaction support.
 */
const withProviderBookingLock = async (providerId, callback) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(
      async () => {
        // Concurrent operations for the same provider conflict on this write.
        const lock = await Provider.updateOne(
          { _id: providerId },
          { $inc: { bookingLockVersion: 1 } },
          { session },
        );

        if (!lock.matchedCount) {
          const error = new Error("Provider not found.");
          error.statusCode = 404;
          throw error;
        }

        result = await callback(session);
      },
      {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
        readPreference: "primary",
      },
    );

    return result;
  } finally {
    await session.endSession();
  }
};

// =====================================================
// FIND OVERLAPPING BOOKING
// =====================================================

const findBookingConflict = async ({
  providerId,
  bookingDate,
  bookingEndDate,
  session,
  excludeBookingId,
}) => {
  const startDate = new Date(bookingDate);
  const endDate = new Date(bookingEndDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Invalid booking start or end date.");
  }

  if (endDate <= startDate) {
    throw new Error("Booking end time must be after booking start time.");
  }

  const now = new Date();

  const query = {
    provider: providerId,
    bookingDate: { $lt: endDate },
    $or: [
      {
        status: {
          $in: ACTIVE_STATUSES,
        },
      },
      {
        status: "pending_payment",
        paymentStatus: "pending",
        paymentExpiresAt: { $gt: now },
      },
    ],
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const existingBookings = await Booking.find(query)
    .populate("providerService")
    .session(session);

  for (const existingBooking of existingBookings) {
    const existingStart = new Date(existingBooking.bookingDate);

    const existingDuration = Number(
      existingBooking.providerService?.duration || 60,
    );

    if (
      Number.isNaN(existingStart.getTime()) ||
      !Number.isFinite(existingDuration) ||
      existingDuration <= 0
    ) {
      continue;
    }

    const existingEnd = getEnd(existingStart, existingDuration);

    if (existingStart < endDate && existingEnd > startDate) {
      return {
        bookingId: existingBooking._id,
        bookingDate: existingStart,
        duration: existingDuration,
      };
    }
  }

  return null;
};
/**
 * Atomically activates a captured online payment.
 * If the reservation was cancelled or the slot is no longer available,
 * the payment is recorded and the caller must request a refund.
 */
const activatePaidBooking = async ({
  bookingId,
  paymentId,
  orderId,
  signature,
}) => {
  const initial = await Booking.findById(bookingId).select("provider");

  if (!initial) {
    return { state: "not_found" };
  }

  return withProviderBookingLock(initial.provider, async (session) => {
    const booking = await Booking.findById(bookingId).session(session);

    if (!booking) {
      return { state: "not_found" };
    }

    if (booking.paymentStatus === "paid") {
      if (booking.paymentId === paymentId) {
        return { state: "already_paid", booking };
      }

      return { state: "payment_mismatch" };
    }

    if (
      booking.paymentMethod !== "online" ||
      booking.razorpayOrderId !== orderId
    ) {
      return { state: "order_mismatch" };
    }

    const wasCancelled = booking.status === "cancelled";

    const isExpectedPending =
      booking.status === "pending_payment" &&
      booking.paymentStatus === "pending";

    const isLateCapture = wasCancelled && booking.paymentStatus === "failed";

    if (!isExpectedPending && !isLateCapture) {
      return { state: "state_changed" };
    }

    if (isLateCapture) {
      booking.paymentStatus = "paid";
      booking.paymentId = paymentId;
      booking.paymentPaidAt = new Date();
      booking.paymentExpiresAt = null;

      booking.cancellationReason =
        booking.cancellationReason ||
        "Payment captured after booking cancellation; refund required.";

      if (signature) {
        booking.razorpaySignature = signature;
      }

      await booking.save({ session });

      return { state: "refund_required", booking };
    }

    const providerService = await ProviderService.findById(
      booking.providerService,
    ).session(session);

    const duration = Number(providerService?.duration || 60);

    const bookingStart = new Date(booking.bookingDate);

    if (Number.isNaN(bookingStart.getTime())) {
      throw new Error("Booking has an invalid booking date.");
    }

    const bookingEndDate = getEnd(bookingStart, duration);

    const conflict = await findBookingConflict({
      providerId: booking.provider,
      bookingDate: bookingStart,
      bookingEndDate,
      session,
      excludeBookingId: booking._id,
    });

    if (conflict) {
      booking.status = "cancelled";
      booking.paymentStatus = "paid";
      booking.paymentId = paymentId;
      booking.paymentPaidAt = new Date();
      booking.paymentExpiresAt = null;

      booking.cancellationReason =
        "Payment captured, but the booking slot was unavailable. Refund required.";

      if (signature) {
        booking.razorpaySignature = signature;
      }

      await booking.save({ session });

      return { state: "refund_required", booking, conflict };
    }

    booking.status = "pending";
    booking.paymentStatus = "paid";
    booking.paymentId = paymentId;
    booking.paymentPaidAt = new Date();
    booking.paymentExpiresAt = null;

    if (signature) {
      booking.razorpaySignature = signature;
    }

    await booking.save({ session });

    await ProviderService.updateOne(
      { _id: booking.providerService },
      { $inc: { bookingCount: 1 } },
      { session },
    );

    return { state: "activated", booking };
  });
};

module.exports = {
  withProviderBookingLock,
  findBookingConflict,
  activatePaidBooking,
};
