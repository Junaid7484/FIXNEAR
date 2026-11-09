const express = require("express");

const {
  createBooking,
  getMyBookings,
  getBookingById,
  getProviderBookings,
  getProviderBookingStats,
  acceptBooking,
  rejectBooking,
  updateBookingStatus,
  cancelBooking,
  getAllBookings,
  adminUpdateBookingStatus,
  adminCancelBooking,
  markCashPaymentReceived,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPendingPaymentBooking,
} = require("../controllers/bookingController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const maintenanceModeMiddleware = require("../middleware/maintenanceModeMiddleware");

const router = express.Router();

// =====================================================
// CUSTOMER ROUTES
// =====================================================

router.post(
  "/",
  protect,
  authorize("customer"),
  maintenanceModeMiddleware,
  createBooking,
);

router.get(
  "/my",
  protect,
  authorize("customer"),
  maintenanceModeMiddleware,
  getMyBookings,
);

router.put(
  "/:id/cancel",
  protect,
  authorize("customer"),
  maintenanceModeMiddleware,
  cancelBooking,
);

// Razorpay: create order for an existing booking
router.post(
  "/:id/payment/order",
  protect,
  authorize("customer"),
  maintenanceModeMiddleware,
  createRazorpayOrder,
);

// Razorpay: verify payment signature
router.post(
  "/:id/payment/verify",
  protect,
  authorize("customer"),
  maintenanceModeMiddleware,
  verifyRazorpayPayment,
);

// =====================================================
// PROVIDER ROUTES
// =====================================================

router.get("/provider/my", protect, authorize("provider"), getProviderBookings);

router.get(
  "/provider/stats",
  protect,
  authorize("provider"),
  getProviderBookingStats,
);

router.put(
  "/provider/:id/accept",
  protect,
  authorize("provider"),
  acceptBooking,
);

router.put(
  "/provider/:id/reject",
  protect,
  authorize("provider"),
  rejectBooking,
);

router.put(
  "/provider/:id/status",
  protect,
  authorize("provider"),
  updateBookingStatus,
);

// Cash payment collection only
router.patch(
  "/:id/payment/collect",
  protect,
  authorize("provider"),
  markCashPaymentReceived,
);

// =====================================================
// ADMIN ROUTES
// =====================================================

router.get("/", protect, authorize("admin"), getAllBookings);

router.put(
  "/admin/:id/status",
  protect,
  authorize("admin"),
  adminUpdateBookingStatus,
);

router.put(
  "/admin/:id/cancel",
  protect,
  authorize("admin"),
  adminCancelBooking,
);
router.get(
  "/pending-payment",
  protect,
  authorize("customer"),
  getPendingPaymentBooking,
);

// =====================================================
// SINGLE BOOKING — KEEP LAST
// =====================================================

router.get("/:id", protect, maintenanceModeMiddleware, getBookingById);

module.exports = router;
