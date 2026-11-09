const mongoose = require("mongoose");

const Notification = require("../models/Notification");
const User = require("../models/User");

const {
  getPagination,
  getPaginationMeta,
  applyPagination,
} = require("../utils/pagination");

// ======================================================
// CUSTOMER / PROVIDER
// GET MY NOTIFICATIONS
// GET /api/notifications/my
// ======================================================

const getMyNotifications = async (req, res) => {
  try {
    const filter = {
      user: req.user._id,
    };

    const pagination = getPagination(req.query);

    let query = Notification.find(filter)
      .populate("booking")
      .populate("provider")
      .populate("complaint")
      .sort({
        createdAt: -1,
        _id: -1,
      });

    query = applyPagination(query, pagination);

    const notifications = await query;

    const response = {
      success: true,
      count: notifications.length,
      notifications,
    };

    if (pagination.requested) {
      const total = await Notification.countDocuments(filter);

      response.pagination = getPaginationMeta(total, pagination);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Get Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
      error: error.message,
    });
  }
};

// ======================================================
// CUSTOMER / PROVIDER
// GET UNREAD NOTIFICATION COUNT
// GET /api/notifications/unread-count
// ======================================================

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Get Unread Count Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching unread count",
      error: error.message,
    });
  }
};

// ======================================================
// CUSTOMER / PROVIDER
// MARK ONE NOTIFICATION AS READ
// PUT /api/notifications/:id/read
// ======================================================

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;

    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while marking notification as read",
      error: error.message,
    });
  }
};

// ======================================================
// CUSTOMER / PROVIDER
// MARK ALL NOTIFICATIONS AS READ
// PUT /api/notifications/read-all
// ======================================================

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        user: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while marking notifications as read",
      error: error.message,
    });
  }
};

// ======================================================
// CUSTOMER / PROVIDER
// DELETE NOTIFICATION
// DELETE /api/notifications/:id
// ======================================================

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete Notification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting notification",
      error: error.message,
    });
  }
};

// ======================================================
// ADMIN
// GET ALL NOTIFICATIONS
// GET /api/notifications/admin/all
// ======================================================

const getAllNotificationsAdmin = async (req, res) => {
  try {
    const { search = "", status = "all", type = "all" } = req.query;

    const filter = {};

    // --------------------------------------------------
    // Read / Unread filter
    // --------------------------------------------------

    if (status === "read") {
      filter.isRead = true;
    }

    if (status === "unread") {
      filter.isRead = false;
    }

    // --------------------------------------------------
    // Notification type filter
    // --------------------------------------------------

    if (type !== "all") {
      filter.type = type;
    }

    // --------------------------------------------------
    // Search users
    // --------------------------------------------------

    const searchText = search.trim();

    if (searchText) {
      const users = await User.find({
        $or: [
          {
            name: {
              $regex: searchText,
              $options: "i",
            },
          },
          {
            email: {
              $regex: searchText,
              $options: "i",
            },
          },
        ],
      }).select("_id");

      const userIds = users.map((user) => user._id);

      filter.$or = [
        {
          title: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          message: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          user: {
            $in: userIds,
          },
        },
      ];
    }

    // --------------------------------------------------
    // PAGINATION
    // --------------------------------------------------

    const pagination = getPagination(req.query);

    let query = Notification.find(filter)
      .populate("user", "name email phone role")
      .populate("booking")
      .populate("provider")
      .populate("complaint")
      .sort({
        createdAt: -1,
        _id: -1,
      });

    query = applyPagination(query, pagination);

    const notifications = await query;

    const response = {
      success: true,
      count: notifications.length,
      notifications,
    };

    if (pagination.requested) {
      const total = await Notification.countDocuments(filter);

      response.pagination = getPaginationMeta(total, pagination);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Get All Notifications Admin Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching admin notifications",
      error: error.message,
    });
  }
};

// ======================================================
// ADMIN
// GET NOTIFICATION BY ID
// GET /api/notifications/admin/:id
// ======================================================

const getNotificationByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findById(id)
      .populate("user", "name email phone role")
      .populate("booking")
      .populate("provider")
      .populate("complaint");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Get Notification By ID Admin Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching notification",
      error: error.message,
    });
  }
};

// ======================================================
// ADMIN
// MARK ONE NOTIFICATION AS READ
// PUT /api/notifications/admin/:id/read
// ======================================================

const markNotificationAsReadAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;

    await notification.save();

    const updatedNotification = await Notification.findById(id)
      .populate("user", "name email phone role")
      .populate("booking")
      .populate("provider")
      .populate("complaint");

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Admin Mark Notification Read Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while marking notification as read",
      error: error.message,
    });
  }
};

// ======================================================
// ADMIN
// MARK ALL ADMIN NOTIFICATIONS AS READ
// PUT /api/notifications/admin/read-all
// ======================================================

const markAllNotificationsAsReadAdmin = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        user: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "All admin notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Admin Mark All Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while marking admin notifications as read",
      error: error.message,
    });
  }
};

// ======================================================
// ADMIN
// DELETE NOTIFICATION
// DELETE /api/notifications/admin/:id
// ======================================================

const deleteNotificationAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Admin Delete Notification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting notification",
      error: error.message,
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
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
};
