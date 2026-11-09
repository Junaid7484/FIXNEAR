const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    // CUSTOMER WHO CREATED THE COMPLAINT
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // RELATED BOOKING
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    // PROVIDER INVOLVED IN THE COMPLAINT
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null,
    },

    // COMPLAINT SUBJECT
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    // DETAILED COMPLAINT
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // COMPLAINT CATEGORY
    category: {
      type: String,
      enum: ["booking", "provider", "service", "payment", "other"],
      default: "other",
    },

    // COMPLAINT STATUS
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "rejected"],
      default: "open",
    },

    // RESPONSE FROM ADMIN
    adminResponse: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // WHEN COMPLAINT WAS RESOLVED
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Customer complaint listing and pagination
complaintSchema.index({
  customer: 1,
  createdAt: -1,
  _id: -1,
});

// Admin filtering by status and newest-first pagination
complaintSchema.index({
  status: 1,
  createdAt: -1,
  _id: -1,
});

// Provider-related complaint queries
complaintSchema.index({
  provider: 1,
  createdAt: -1,
});

// Booking-related complaint queries
complaintSchema.index({
  booking: 1,
});

// Admin listing of all complaints, newest first
complaintSchema.index({
  createdAt: -1,
  _id: -1,
});
const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;
