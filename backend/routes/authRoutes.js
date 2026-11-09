const express = require("express");

const {
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// ========================================
// PUBLIC ROUTES
// ========================================

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Password reset (public routes; protected by the existing auth rate limiter)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ========================================
// PROTECTED ROUTES
// ========================================

// Any logged-in user
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You are authenticated!",
    user: req.user,
  });
});

// ========================================
// CHANGE PASSWORD
// ========================================

router.put("/change-password", protect, changePassword);

// ========================================
// CUSTOMER TEST ROUTE
// ========================================

router.get("/customer-test", protect, authorize("customer"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Customer access granted!",
    user: req.user,
  });
});

// ========================================
// PROVIDER TEST ROUTE
// ========================================

router.get("/provider-test", protect, authorize("provider"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Provider access granted!",
    user: req.user,
  });
});

// ========================================
// ADMIN TEST ROUTE
// ========================================

router.get("/admin-test", protect, authorize("admin"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin access granted!",
    user: req.user,
  });
});

module.exports = router;
