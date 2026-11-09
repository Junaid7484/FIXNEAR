const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // User who should receive the notification
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Notification title
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Notification message
    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Notification type
    type: {
      type: String,
      enum: ["booking", "review", "payment", "provider", "system", "other"],
      default: "system",
    },

    // Optional related booking
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    // Optional related provider
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null,
    },

    // Optional related complaint
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
    },

    // Whether user has opened/read it
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// User notification listing: newest first
notificationSchema.index({
  user: 1,
  createdAt: -1,
  _id: -1,
});

// Unread notification count for a user
notificationSchema.index({
  user: 1,
  isRead: 1,
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
