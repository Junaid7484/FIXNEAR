const ProviderSettings = require("../models/ProviderSettings");
const Provider = require("../models/Provider");

// ========================================
// GET MY SETTINGS
// ========================================

const getMySettings = async (req, res) => {
  try {
    let settings = await ProviderSettings.findOne({
      user: req.user._id,
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await ProviderSettings.create({
        user: req.user._id,
      });
    }

    // Get provider profile
    const provider = await Provider.findOne({
      user: req.user._id,
    });

    // Keep availability synchronized
    if (provider && settings.availableForBookings !== provider.isAvailable) {
      settings.availableForBookings = provider.isAvailable;
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get Provider Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch provider settings.",
      error: error.message,
    });
  }
};

// ========================================
// UPDATE MY SETTINGS
// ========================================

const updateMySettings = async (req, res) => {
  try {
    const {
      emailNotifications,
      smsNotifications,
      bookingNotifications,
      paymentNotifications,
      reviewNotifications,
      marketingNotifications,
      availableForBookings,
      showPhoneNumber,
      darkMode,
    } = req.body;

    // ========================================
    // FIND SETTINGS
    // ========================================

    let settings = await ProviderSettings.findOne({
      user: req.user._id,
    });

    // Create settings if they don't exist
    if (!settings) {
      settings = new ProviderSettings({
        user: req.user._id,
      });
    }

    // ========================================
    // UPDATE SETTINGS
    // ========================================

    if (emailNotifications !== undefined) {
      settings.emailNotifications = emailNotifications;
    }

    if (smsNotifications !== undefined) {
      settings.smsNotifications = smsNotifications;
    }

    if (bookingNotifications !== undefined) {
      settings.bookingNotifications = bookingNotifications;
    }

    if (paymentNotifications !== undefined) {
      settings.paymentNotifications = paymentNotifications;
    }

    if (reviewNotifications !== undefined) {
      settings.reviewNotifications = reviewNotifications;
    }

    if (marketingNotifications !== undefined) {
      settings.marketingNotifications = marketingNotifications;
    }

    if (availableForBookings !== undefined) {
      settings.availableForBookings = availableForBookings;
    }

    if (showPhoneNumber !== undefined) {
      settings.showPhoneNumber = showPhoneNumber;
    }

    if (darkMode !== undefined) {
      settings.darkMode = darkMode;
    }

    // ========================================
    // SAVE SETTINGS
    // ========================================

    const updatedSettings = await settings.save();

    // ========================================
    // UPDATE PROVIDER AVAILABILITY
    // ========================================

    if (availableForBookings !== undefined) {
      const provider = await Provider.findOne({
        user: req.user._id,
      });

      if (provider) {
        provider.isAvailable = availableForBookings;

        await provider.save();
      }
    }

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully.",
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Update Provider Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update provider settings.",
      error: error.message,
    });
  }
};

// ========================================
// EXPORT
// ========================================

module.exports = {
  getMySettings,
  updateMySettings,
};
