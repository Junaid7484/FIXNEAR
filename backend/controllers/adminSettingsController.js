const mongoose = require("mongoose");
const AdminSettings = require("../models/AdminSettings");
const User = require("../models/User");

// =====================================================
// GET ADMIN SETTINGS
// GET /api/admin/settings
// =====================================================

const getAdminSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();

    if (!settings) {
      settings = await AdminSettings.create({});
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin settings.",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE ADMIN SETTINGS
// PUT /api/admin/settings
// =====================================================

const updateAdminSettings = async (req, res) => {
  try {
    const allowedFields = [
      "platformName",
      "supportEmail",
      "supportPhone",
      "currency",
      "timezone",
      "maintenanceMode",

      "autoAcceptBookings",
      "allowCancellation",
      "cancellationHours",
      "maxAdvanceDays",
      "requireProviderApproval",

      "newBooking",
      "providerVerification",
      "complaints",
      "newUser",
      "payment",
      "systemAlerts",

      "onlinePayment",
      "cashPayment",
      "providerCommission",
      "minimumBookingAmount",

      "twoFactorAuth",
      "loginAlerts",
      "sessionTimeout",
      "passwordExpiry",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    let settings = await AdminSettings.findOne();

    if (!settings) {
      settings = await AdminSettings.create(updateData);
    } else {
      Object.assign(settings, updateData);
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: "Admin settings updated successfully.",
      settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update admin settings.",
      error: error.message,
    });
  }
};

// =====================================================
// CHANGE ADMIN PASSWORD
// PUT /api/admin/settings/password
// =====================================================

const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please fill all password fields.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 6 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match.",
      });
    }

    const admin = await User.findById(req.user._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    const passwordMatches = await admin.comparePassword(currentPassword);

    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    admin.password = newPassword;

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Admin password changed successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to change admin password.",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminSettings,
  updateAdminSettings,
  changeAdminPassword,
};
