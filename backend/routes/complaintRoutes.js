const express = require("express");

const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  updateComplaint,
} = require("../controllers/complaintController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// =========================================================
// CUSTOMER
// =========================================================

// Create a new complaint
// POST /complaints
router.post("/", protect, authorize("customer"), createComplaint);

// Get logged-in customer's complaints
// GET /complaints/my
router.get("/my", protect, authorize("customer"), getMyComplaints);

// =========================================================
// ADMIN
// =========================================================

// Get all complaints
// GET /complaints
router.get("/", protect, authorize("admin"), getAllComplaints);

// Update complaint status / admin response
// PUT /complaints/:id
router.put("/:id", protect, authorize("admin"), updateComplaint);

// =========================================================
// CUSTOMER + ADMIN
// =========================================================

// Get complaint details
// GET /complaints/:id
router.get("/:id", protect, authorize("customer", "admin"), getComplaintById);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;
