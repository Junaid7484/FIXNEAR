const express = require("express");

const {
  getMySettings,
  updateMySettings,
} = require("../controllers/providerSettingsController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// Get logged-in provider settings
router.get("/", protect, authorize("provider"), getMySettings);

// Update logged-in provider settings
router.put("/", protect, authorize("provider"), updateMySettings);

module.exports = router;
