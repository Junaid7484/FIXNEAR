const express = require("express");

const {
  // Customer / Provider
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,

  // Admin
  getAllNotificationsAdmin,
  getNotificationByIdAdmin,
  markNotificationAsReadAdmin,
  markAllNotificationsAsReadAdmin,
  deleteNotificationAdmin,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// CUSTOMER / PROVIDER NOTIFICATIONS
// ======================================================

// Get my notifications
// GET /api/notifications/my
router.get("/my", protect, getMyNotifications);

// Get unread notification count
// GET /api/notifications/unread-count
router.get("/unread-count", protect, getUnreadCount);

// Mark one notification as read
// PUT /api/notifications/:id/read
router.put("/:id/read", protect, markAsRead);

// Mark all my notifications as read
// PUT /api/notifications/read-all
router.put("/read-all", protect, markAllAsRead);

// Delete my notification
// DELETE /api/notifications/:id
router.delete("/:id", protect, deleteNotification);

// ======================================================
// ADMIN NOTIFICATIONS
// ======================================================

// Get all notifications
// GET /api/notifications/admin/all
router.get("/admin/all", protect, authorize("admin"), getAllNotificationsAdmin);

// Get single notification
// GET /api/notifications/admin/:id
router.get("/admin/:id", protect, authorize("admin"), getNotificationByIdAdmin);

// Mark one notification as read
// PUT /api/notifications/admin/:id/read
router.put(
  "/admin/:id/read",
  protect,
  authorize("admin"),
  markNotificationAsReadAdmin,
);

// Mark all notifications as read
// PUT /api/notifications/admin/read-all
router.put(
  "/admin/read-all",
  protect,
  authorize("admin"),
  markAllNotificationsAsReadAdmin,
);

// Delete notification
// DELETE /api/notifications/admin/:id
router.delete(
  "/admin/:id",
  protect,
  authorize("admin"),
  deleteNotificationAdmin,
);

module.exports = router;
