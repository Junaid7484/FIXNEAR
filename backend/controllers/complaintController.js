const mongoose = require("mongoose");

const Complaint = require("../models/Complaint");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");

const { createNotification } = require("../utils/notificationHelper");

const {
  getPagination,
  getPaginationMeta,
  applyPagination,
} = require("../utils/pagination");

// =========================================================
// SAFE NOTIFICATION HELPER
// Notification failure should NOT break complaint operation
// =========================================================

const safeCreateNotification = async (data) => {
  try {
    if (!data?.user) {
      return null;
    }

    return await createNotification(data);
  } catch (error) {
    console.error("Complaint Notification Error:", error);
    return null;
  }
};

// =========================================================
// CREATE COMPLAINT
// CUSTOMER
// POST /api/complaints
// =========================================================

const createComplaint = async (req, res) => {
  try {
    const { booking, provider, subject, description, category } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: "Complaint subject is required",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Complaint description is required",
      });
    }

    const allowedCategories = [
      "booking",
      "provider",
      "service",
      "payment",
      "other",
    ];

    const complaintCategory = category || "other";

    if (!allowedCategories.includes(complaintCategory)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint category",
      });
    }

    if (booking && !mongoose.Types.ObjectId.isValid(booking)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    if (provider && !mongoose.Types.ObjectId.isValid(provider)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });
    }

    let bookingData = null;
    let providerData = null;
    let finalProviderId = provider || null;

    // =======================================================
    // CHECK BOOKING
    // =======================================================

    if (booking) {
      bookingData = await Booking.findById(booking);

      if (!bookingData) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      if (bookingData.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only complain about your own booking",
        });
      }

      if (bookingData.provider) {
        finalProviderId = bookingData.provider;
      }

      if (
        provider &&
        bookingData.provider &&
        provider.toString() !== bookingData.provider.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: "The selected provider does not belong to this booking",
        });
      }
    }

    // =======================================================
    // CHECK PROVIDER
    // =======================================================

    if (finalProviderId) {
      providerData = await Provider.findById(finalProviderId);

      if (!providerData) {
        return res.status(404).json({
          success: false,
          message: "Provider not found",
        });
      }
    }

    // =======================================================
    // CREATE COMPLAINT
    // =======================================================

    const complaint = await Complaint.create({
      customer: req.user._id,
      booking: booking || null,
      provider: finalProviderId,
      subject: subject.trim(),
      description: description.trim(),
      category: complaintCategory,
      status: "open",
    });

    // =======================================================
    // NOTIFY PROVIDER
    // =======================================================

    if (providerData?.user) {
      await safeCreateNotification({
        user: providerData.user,
        title: "New Complaint Submitted",
        message:
          "A customer has submitted a complaint related to your service.",
        type: "system",
        booking: booking || null,
        complaint: complaint._id,
      });
    }

    // =======================================================
    // POPULATE COMPLAINT
    // =======================================================

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("customer", "name email phone")
      .populate("booking")
      .populate("provider");

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint: populatedComplaint,
    });
  } catch (error) {
    console.error("Create Complaint Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating complaint",
      error: error.message,
    });
  }
};

// =========================================================
// GET MY COMPLAINTS
// CUSTOMER
// GET /api/complaints/my
// =========================================================

const getMyComplaints = async (req, res) => {
  try {
    const filter = {
      customer: req.user._id,
    };

    const pagination = getPagination(req.query);

    let query = Complaint.find(filter)
      .populate("booking")
      .populate("provider")
      .sort({
        createdAt: -1,
        _id: -1,
      });

    // Apply pagination only when page or limit is supplied.
    // Existing requests without pagination parameters
    // continue to return all complaints.
    query = applyPagination(query, pagination);

    const complaints = await query;

    const response = {
      success: true,
      count: complaints.length,
      complaints,
    };

    if (pagination.requested) {
      const total = await Complaint.countDocuments(filter);

      response.pagination = getPaginationMeta(total, pagination);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Get My Complaints Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching complaints",
      error: error.message,
    });
  }
};

// =========================================================
// GET COMPLAINT BY ID
// CUSTOMER / ADMIN
// GET /api/complaints/:id
// =========================================================

const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID",
      });
    }

    const complaint = await Complaint.findById(id)
      .populate("customer", "name email phone")
      .populate("booking")
      .populate("provider");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (
      req.user.role === "customer" &&
      complaint.customer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this complaint",
      });
    }

    return res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error) {
    console.error("Get Complaint Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching complaint",
      error: error.message,
    });
  }
};

// =========================================================
// GET ALL COMPLAINTS
// ADMIN
// GET /api/complaints
// =========================================================

const getAllComplaints = async (req, res) => {
  try {
    const filter = {};

    const pagination = getPagination(req.query);

    let query = Complaint.find(filter)
      .populate("customer", "name email phone")
      .populate("booking")
      .populate("provider")
      .sort({
        createdAt: -1,
        _id: -1,
      });

    // Apply pagination only when page or limit is supplied.
    query = applyPagination(query, pagination);

    const complaints = await query;

    const response = {
      success: true,
      count: complaints.length,
      complaints,
    };

    if (pagination.requested) {
      const total = await Complaint.countDocuments(filter);

      response.pagination = getPaginationMeta(total, pagination);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Get All Complaints Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching complaints",
      error: error.message,
    });
  }
};

// =========================================================
// UPDATE COMPLAINT
// ADMIN
// PUT /api/complaints/:id
// =========================================================

const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID",
      });
    }

    const allowedStatuses = ["open", "in-progress", "resolved", "rejected"];

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint status",
      });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const previousStatus = complaint.status;
    const previousAdminResponse = complaint.adminResponse;

    if (status !== undefined) {
      complaint.status = status;
    }

    if (adminResponse !== undefined) {
      complaint.adminResponse = adminResponse.trim();
    }

    if (status === "resolved") {
      complaint.resolvedAt = new Date();
    } else if (status && status !== "resolved") {
      complaint.resolvedAt = null;
    }

    await complaint.save();

    const statusChanged = status !== undefined && previousStatus !== status;

    const responseChanged =
      adminResponse !== undefined &&
      previousAdminResponse !== complaint.adminResponse;

    // =======================================================
    // NOTIFY CUSTOMER
    // =======================================================

    if (statusChanged || responseChanged) {
      let notificationTitle = "Complaint Updated";

      let notificationMessage = "Your complaint has been updated by the admin.";

      if (statusChanged) {
        if (status === "in-progress") {
          notificationTitle = "Complaint Under Review";
          notificationMessage =
            "Your complaint is now being reviewed by the admin.";
        } else if (status === "resolved") {
          notificationTitle = "Complaint Resolved";
          notificationMessage =
            "Your complaint has been resolved by the admin.";
        } else if (status === "rejected") {
          notificationTitle = "Complaint Rejected";
          notificationMessage =
            "Your complaint has been rejected by the admin.";
        } else if (status === "open") {
          notificationTitle = "Complaint Reopened";
          notificationMessage = "Your complaint has been reopened.";
        }
      }

      if (responseChanged && complaint.adminResponse) {
        notificationMessage += ` Admin response: ${complaint.adminResponse}`;
      }

      await safeCreateNotification({
        user: complaint.customer,
        title: notificationTitle,
        message: notificationMessage,
        type: "system",
        booking: complaint.booking || null,
        complaint: complaint._id,
      });
    }

    // =======================================================
    // POPULATE UPDATED COMPLAINT
    // =======================================================

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate("customer", "name email phone")
      .populate("booking")
      .populate("provider");

    return res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("Update Complaint Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating complaint",
      error: error.message,
    });
  }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  updateComplaint,
};
