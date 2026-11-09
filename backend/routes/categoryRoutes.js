const express = require("express");

const {
  getCategories,
  getAllCategoriesAdmin,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// ------------------------------------------
// GET ALL ACTIVE CATEGORIES
// GET /api/categories
// ------------------------------------------

router.get("/", getCategories);

// ------------------------------------------
// GET ALL CATEGORIES - ADMIN
// IMPORTANT:
// This route MUST come before /:id
// ------------------------------------------

router.get("/admin/all", protect, authorize("admin"), getAllCategoriesAdmin);

// ------------------------------------------
// GET SINGLE ACTIVE CATEGORY
// GET /api/categories/:id
// ------------------------------------------

router.get("/:id", getCategoryById);

// ==========================================
// ADMIN ROUTES
// ==========================================

// ------------------------------------------
// CREATE CATEGORY
// POST /api/categories
// ------------------------------------------

router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("image"),
  createCategory,
);

// ------------------------------------------
// UPDATE CATEGORY
// PUT /api/categories/:id
// ------------------------------------------

router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("image"),
  updateCategory,
);

// ------------------------------------------
// DEACTIVATE CATEGORY
// DELETE /api/categories/:id
// ------------------------------------------

router.delete("/:id", protect, authorize("admin"), deleteCategory);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
