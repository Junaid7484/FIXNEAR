const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema(
  {
    // General settings
    platformName: {
      type: String,
      default: "FIXNEAR",
      trim: true,
    },
    supportEmail: {
      type: String,
      default: "support@fixnear.com",
      trim: true,
    },
    supportPhone: {
      type: String,
      default: "+91 98765 43210",
      trim: true,
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR"],
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    // Booking settings
    autoAcceptBookings: { type: Boolean, default: false },
    allowCancellation: { type: Boolean, default: true },
    cancellationHours: { type: Number, default: 2, min: 0 },
    maxAdvanceDays: { type: Number, default: 30, min: 1 },
    requireProviderApproval: { type: Boolean, default: true },

    // Notification settings
    newBooking: { type: Boolean, default: true },
    providerVerification: { type: Boolean, default: true },
    complaints: { type: Boolean, default: true },
    newUser: { type: Boolean, default: true },
    payment: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true },

    // Payment settings
    onlinePayment: { type: Boolean, default: true },
    cashPayment: { type: Boolean, default: true },
    providerCommission: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    minimumBookingAmount: {
      type: Number,
      default: 199,
      min: 0,
    },

    // Security settings
    twoFactorAuth: { type: Boolean, default: false },
    loginAlerts: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 60, min: 1 },
    passwordExpiry: { type: Number, default: 90, min: 1 },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("AdminSettings", adminSettingsSchema);
