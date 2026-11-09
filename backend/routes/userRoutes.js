const express = require("express");

const {
  getMyProfile,
  updateMyProfile,

  // Admin
  getAllUsers,
  getUserById,
  updateUserStatus,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// =========================================================
// LOGGED-IN USER PROFILE
// =========================================================

// GET MY PROFILE
// GET /api/users/profile
router.get("/profile", protect, getMyProfile);

// UPDATE MY PROFILE
// PUT /api/users/profile
router.put("/profile", protect, upload.single("profileImage"), updateMyProfile);

// =========================================================
// ADMIN USER MANAGEMENT
// =========================================================

// GET ALL USERS
// GET /api/users
router.get("/", protect, authorize("admin"), getAllUsers);

// GET USER BY ID
// GET /api/users/:id
router.get("/:id", protect, authorize("admin"), getUserById);

// ACTIVATE / DEACTIVATE USER
// PUT /api/users/:id/status
router.put("/:id/status", protect, authorize("admin"), updateUserStatus);

module.exports = router;
