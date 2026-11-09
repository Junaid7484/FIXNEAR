const express = require("express");

const {
  registerProvider,
  loginProvider,
  getProviders,
  getProviderById,
  createProvider,
  getMyProviderProfile,
  updateMyProviderProfile,
  getMyWorkingHours,
  updateMyWorkingHours,
  verifyProvider,
  rejectProvider,
  suspendProvider,
  activateProvider,
  deleteMyProviderAccount,
  getNearbyProviders, // ADD THIS
} = require("../controllers/providerController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  sendProviderHelpMessage,
} = require("../controllers/providerHelpController");

const router = express.Router();

// =====================================================
// PUBLIC ROUTES
// =====================================================

router.post("/register", upload.single("profileImage"), registerProvider);

router.post("/login", loginProvider);

// Nearby providers and their services
// IMPORTANT: Place before /:id
router.get("/nearby", getNearbyProviders);

router.get("/", getProviders);

// =====================================================
// PROVIDER PROFILE
// =====================================================

router.get("/my/profile", protect, authorize("provider"), getMyProviderProfile);

router.post(
  "/profile",
  protect,
  authorize("provider"),
  upload.single("profileImage"),
  createProvider,
);

router.put(
  "/my/profile",
  protect,
  authorize("provider"),
  upload.single("profileImage"),
  updateMyProviderProfile,
);

// =====================================================
// ACCOUNT DELETION AND HELP
// =====================================================

router.delete(
  "/my/account",
  protect,
  authorize("provider"),
  deleteMyProviderAccount,
);

router.post("/help", protect, authorize("provider"), sendProviderHelpMessage);

// =====================================================
// WORKING HOURS
// =====================================================

router.get(
  "/my/working-hours",
  protect,
  authorize("provider"),
  getMyWorkingHours,
);

router.put(
  "/my/working-hours",
  protect,
  authorize("provider"),
  updateMyWorkingHours,
);

// =====================================================
// ADMIN PROVIDER MANAGEMENT
// =====================================================

router.put("/:id/verify", protect, authorize("admin"), verifyProvider);
router.put("/:id/reject", protect, authorize("admin"), rejectProvider);
router.put("/:id/suspend", protect, authorize("admin"), suspendProvider);
router.put("/:id/activate", protect, authorize("admin"), activateProvider);

// Keep this route last
router.get("/:id", getProviderById);

module.exports = router;
