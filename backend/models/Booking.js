const mongoose = require("mongoose");

// =====================================================
// BOOKING SCHEMA
// =====================================================

const bookingSchema = new mongoose.Schema(
  {
    // CUSTOMER
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // PROVIDER
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },

    // MASTER SERVICE
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    // PROVIDER-SPECIFIC SERVICE
    providerService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderService",
      required: true,
    },

    // AGREED PRICE
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // BOOKING DATE
    bookingDate: {
      type: Date,
      required: true,
    },

    // SERVICE ADDRESS
    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    // CUSTOMER NOTES
    notes: {
      type: String,
      default: "",
      trim: true,
    },

    // BOOKING STATUS
    status: {
      type: String,
      enum: [
        "pending_payment",
        "pending",
        "confirmed",
        "accepted",
        "in-progress",
        "completed",
        "cancelled",
        "rejected",
      ],
      default: "pending",
    },

    // PAYMENT METHOD
    paymentMethod: {
      type: String,
      enum: ["cash", "online"],
      default: "cash",
      required: true,
    },

    // PAYMENT STATUS
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      required: true,
    },

    // RAZORPAY PAYMENT ID
    paymentId: {
      type: String,
      default: null,
    },

    // RAZORPAY ORDER ID
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },

    // PAYMENT SIGNATURE
    razorpaySignature: {
      type: String,
      default: null,
      select: false,
    },

    // PAYMENT TIMESTAMP
    paymentPaidAt: {
      type: Date,
      default: null,
    },

    // ONLINE PAYMENT RESERVATION EXPIRY
    paymentExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    // CANCELLATION REASON
    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// =====================================================
// BOOKING INDEXES
// =====================================================

// 1. Customer booking history and pagination
bookingSchema.index({
  customer: 1,
  createdAt: -1,
  _id: -1,
});

// 2. Provider booking history and pagination
bookingSchema.index({
  provider: 1,
  createdAt: -1,
  _id: -1,
});

// 3. Provider booking conflict checks and status filtering
bookingSchema.index({
  provider: 1,
  status: 1,
  bookingDate: 1,
});

// 4. Admin recent bookings and pagination
bookingSchema.index({
  createdAt: -1,
  _id: -1,
});

// 5. Pending online booking recovery
bookingSchema.index({
  customer: 1,
  providerService: 1,
  service: 1,
  provider: 1,
  paymentMethod: 1,
  paymentStatus: 1,
  status: 1,
  createdAt: -1,
});
// =====================================================
// MODEL
// =====================================================

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
