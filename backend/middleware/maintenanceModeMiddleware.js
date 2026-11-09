const AdminSettings = require("../models/AdminSettings");

async function maintenanceModeMiddleware(req, res, next) {
  try {
    // This bypass works only when authentication middleware
    // has already populated req.user.
    const role = String(req.user?.role || "").toLowerCase();

    // Only customer requests should be blocked.
    // Admin and provider routes remain available.
    if (role !== "customer") {
      return next();
    }

    const settings = await AdminSettings.findOne().lean();
    const maintenanceMode = settings?.maintenanceMode ?? false;

    if (!maintenanceMode) {
      return next();
    }

    return res.status(503).json({
      success: false,
      maintenanceMode: true,
      message: "FixNear is under maintenance. Please try again later.",
    });
  } catch (error) {
    console.error("Maintenance middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify maintenance status.",
    });
  }
}

module.exports = maintenanceModeMiddleware;
