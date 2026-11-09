const mongoose = require("mongoose");

const providerSettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Notification Settings
    emailNotifications: {
      type: Boolean,
      default: true,
    },

    smsNotifications: {
      type: Boolean,
      default: true,
    },

    bookingNotifications: {
      type: Boolean,
      default: true,
    },

    paymentNotifications: {
      type: Boolean,
      default: true,
    },

    reviewNotifications: {
      type: Boolean,
      default: true,
    },

    marketingNotifications: {
      type: Boolean,
      default: false,
    },

    // Provider Availability
    availableForBookings: {
      type: Boolean,
      default: true,
    },

    // Privacy
    showPhoneNumber: {
      type: Boolean,
      default: true,
    },

    // Appearance
    darkMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ProviderSettings = mongoose.model(
  "ProviderSettings",
  providerSettingsSchema
);

module.exports = ProviderSettings;