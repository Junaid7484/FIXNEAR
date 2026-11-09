const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const { authorize } = require("../middleware/roleMiddleware");

const {
  // ===================================================
  // Dashboard
  // ===================================================

  getDashboardStats,

  // ===================================================
  // Providers
  // ===================================================

  getAllProviders,
  getAdminProviderById,
  verifyProvider,
  rejectProvider,
  suspendProvider,
  activateProvider,

  // ===================================================
  // Users
  // ===================================================

  getAllUsers,
  getAdminUserById,
  updateUserStatus,
  deleteUser,

  // ===================================================
  // Admin Settings
  // ===================================================

  getAdminSettings,
  updateAdminSettings,
  changeAdminPassword,
} = require("../controllers/adminController");

// =====================================================
// ADMIN DASHBOARD
// =====================================================

// GET /api/admin/dashboard

router.get("/dashboard", protect, authorize("admin"), getDashboardStats);

// =====================================================
// PROVIDER MANAGEMENT
// =====================================================

// GET /api/admin/providers

router.get("/providers", protect, authorize("admin"), getAllProviders);

// GET /api/admin/providers/:id

router.get("/providers/:id", protect, authorize("admin"), getAdminProviderById);

// PUT /api/admin/providers/:id/verify

router.put(
  "/providers/:id/verify",
  protect,
  authorize("admin"),
  verifyProvider,
);

// PUT /api/admin/providers/:id/reject

router.put(
  "/providers/:id/reject",
  protect,
  authorize("admin"),
  rejectProvider,
);

// PUT /api/admin/providers/:id/suspend

router.put(
  "/providers/:id/suspend",
  protect,
  authorize("admin"),
  suspendProvider,
);

// PUT /api/admin/providers/:id/activate

router.put(
  "/providers/:id/activate",
  protect,
  authorize("admin"),
  activateProvider,
);

// =====================================================
// USER MANAGEMENT
// =====================================================

// GET /api/admin/users

router.get("/users", protect, authorize("admin"), getAllUsers);

// GET /api/admin/users/:id

router.get("/users/:id", protect, authorize("admin"), getAdminUserById);

// PUT /api/admin/users/:id/status

router.put("/users/:id/status", protect, authorize("admin"), updateUserStatus);

// DELETE /api/admin/users/:id

router.delete("/users/:id", protect, authorize("admin"), deleteUser);

// =====================================================
// ADMIN SETTINGS
// =====================================================

// GET /api/admin/settings

router.get("/settings", protect, authorize("admin"), getAdminSettings);

// PUT /api/admin/settings

router.put("/settings", protect, authorize("admin"), updateAdminSettings);

// PUT /api/admin/settings/password

router.put(
  "/settings/password",
  protect,
  authorize("admin"),
  changeAdminPassword,
);

module.exports = router;
