const express = require("express");

const {
  getServices,
  getAllServicesAdmin,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/serviceController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// =========================================================
// PUBLIC
// =========================================================

// GET /api/services
// Get all active services
router.get("/", getServices);

// =========================================================
// ADMIN
// IMPORTANT:
// /admin/all MUST COME BEFORE /:id
// =========================================================

// GET /api/services/admin/all
// Get all services including inactive services
router.get("/admin/all", protect, authorize("admin"), getAllServicesAdmin);

// GET /api/services/:id
// Get one active service
router.get("/:id", getServiceById);

// POST /api/services
// Create service
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("image"),
  createService,
);

// PUT /api/services/:id
// Update service / activate / deactivate
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("image"),
  updateService,
);

// DELETE /api/services/:id
// Soft delete = deactivate service
router.delete("/:id", protect, authorize("admin"), deleteService);

module.exports = router;
