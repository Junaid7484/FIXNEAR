const express = require("express");

const {
  getAdminSettings,
  updateAdminSettings,
  changeAdminPassword,
} = require("../controllers/adminSettingsController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// GET settings
router.get("/", protect, authorize("admin"), getAdminSettings);

// UPDATE settings
router.put("/", protect, authorize("admin"), updateAdminSettings);

// CHANGE ADMIN PASSWORD
router.put("/password", protect, authorize("admin"), changeAdminPassword);

module.exports = router;
