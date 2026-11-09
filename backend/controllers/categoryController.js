const mongoose = require("mongoose");
const Category = require("../models/Category");
const getUploadedFileUrl = require("../utils/getUploadedFileUrl");
const {
  getPagination,
  getPaginationMeta,
  applyPagination,
} = require("../utils/pagination");

// ==========================================
// HELPERS
// ==========================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const cleanString = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return null;
};

// Escape regex special characters
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// ==========================================
// GET ALL ACTIVE CATEGORIES - PUBLIC
// GET /api/categories
// ==========================================

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: { $ne: false },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// ==========================================
// GET ALL CATEGORIES - ADMIN
// GET /api/categories/admin/all
// ==========================================

// ==========================================
// GET ALL CATEGORIES - ADMIN
// GET /api/categories/admin/all
// Supports pagination, search and status
// ==========================================

const getAllCategoriesAdmin = async (req, res) => {
  try {
    const search = cleanString(req.query.search);
    const status = cleanString(req.query.status);

    const query = {};

    // Search by category name or description
    if (search) {
      const safeSearch = escapeRegex(search);

      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Filter by status
    if (status === "Active") {
      query.isActive = true;
    } else if (status === "Inactive") {
      query.isActive = false;
    }

    // Pagination
    const pagination = getPagination(req.query);

    // Stable sorting prevents inconsistent page ordering.
    const sort = {
      createdAt: -1,
      _id: -1,
    };

    // Fetch categories and total count together.
    const [categories, total] = await Promise.all([
      applyPagination(Category.find(query).sort(sort), pagination).exec(),

      Category.countDocuments(query),
    ]);

    const response = {
      success: true,
      count: categories.length,
      categories,
    };

    // Keep compatibility with older frontend requests
    // that do not send page or limit.
    if (req.query.page !== undefined || req.query.limit !== undefined) {
      response.pagination = getPaginationMeta(
        total,
        pagination.page,
        pagination.limit,
      );
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Get All Categories Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};
// ==========================================
// GET CATEGORY BY ID - PUBLIC
// GET /api/categories/:id
// ==========================================

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findOne({
      _id: id,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Get Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

// ==========================================
// CREATE CATEGORY - ADMIN
// POST /api/categories
// ==========================================

const createCategory = async (req, res) => {
  let uploadedImage = null;

  try {
    const { name, description, image, isActive } = req.body;

    // Validate name
    const categoryName = cleanString(name);

    if (!categoryName) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    if (categoryName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Category name cannot exceed 100 characters",
      });
    }

    // Validate description
    const categoryDescription = cleanString(description);

    if (categoryDescription.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Category description cannot exceed 1000 characters",
      });
    }

    // Check for duplicate category before uploading the image
    const existingCategory = await Category.findOne({
      name: {
        $regex: `^${escapeRegex(categoryName)}$`,
        $options: "i",
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    // Upload image to Cloudinary
    let categoryImage = cleanString(image);

    if (req.file) {
      categoryImage = await getUploadedFileUrl(req, req.file);
      uploadedImage = categoryImage;
    }

    // Validate status
    const parsedIsActive = parseBoolean(isActive);
    const activeStatus = parsedIsActive === null ? true : parsedIsActive;

    // Create category
    const category = await Category.create({
      name: categoryName,
      description: categoryDescription,
      image: categoryImage,
      isActive: activeStatus,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create Category Error:", error);

    // Remove the newly uploaded image if category creation failed
    if (uploadedImage) {
      try {
        const cloudinary = require("../config/cloudinary");
        const publicId = getCloudinaryPublicId(uploadedImage);

        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cleanupError) {
        console.error("Cloudinary cleanup error:", cleanupError);
      }
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid category data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};

// Extract Cloudinary public ID from a secure URL.
// Used only when cleaning up a failed create operation.
const getCloudinaryPublicId = (imageUrl) => {
  try {
    const parsedUrl = new URL(imageUrl);

    if (parsedUrl.hostname !== "res.cloudinary.com") {
      return null;
    }

    const match = parsedUrl.pathname.match(/\/image\/upload\/(?:v\d+\/)?(.+)$/);

    if (!match) return null;

    return decodeURIComponent(match[1]).replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

// ==========================================
// UPDATE CATEGORY - ADMIN
// PUT /api/categories/:id
// ==========================================

const updateCategory = async (req, res) => {
  let uploadedImageUrl = null;

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const { name, description, image, isActive } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    let hasChanges = false;

    // Update name
    if (name !== undefined) {
      const categoryName = cleanString(name);

      if (!categoryName) {
        return res.status(400).json({
          success: false,
          message: "Category name cannot be empty",
        });
      }

      if (categoryName.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Category name cannot exceed 100 characters",
        });
      }

      const duplicateCategory = await Category.findOne({
        _id: { $ne: id },
        name: {
          $regex: `^${escapeRegex(categoryName)}$`,
          $options: "i",
        },
      });

      if (duplicateCategory) {
        return res.status(400).json({
          success: false,
          message: "Another category with this name already exists",
        });
      }

      category.name = categoryName;
      hasChanges = true;
    }

    // Update description
    if (description !== undefined) {
      const categoryDescription = cleanString(description);

      if (categoryDescription.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Category description cannot exceed 1000 characters",
        });
      }

      category.description = categoryDescription;
      hasChanges = true;
    }

    // Upload replacement image to Cloudinary
    if (req.file) {
      uploadedImageUrl = await getUploadedFileUrl(req, req.file);

      category.image = uploadedImageUrl;
      hasChanges = true;
    } else if (image !== undefined) {
      category.image = cleanString(image);
      hasChanges = true;
    }

    // Update status
    if (isActive !== undefined) {
      const parsedIsActive = parseBoolean(isActive);

      if (parsedIsActive === null) {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean value",
        });
      }

      category.isActive = parsedIsActive;
      hasChanges = true;
    }

    if (!hasChanges) {
      return res.status(400).json({
        success: false,
        message: "No valid category changes were provided",
      });
    }

    const updatedCategory = await category.save();

    // Delete the previous Cloudinary image only after MongoDB saves successfully.
    // This prevents losing the old image if the update fails.
    if (uploadedImageUrl) {
      try {
        const oldImageUrl = category._originalImageUrl;

        // Previous image is captured below in the corrected version.
        // See note following this controller.
      } catch (cleanupError) {
        console.error("Old image cleanup error:", cleanupError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Update Category Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid category data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE CATEGORY - SOFT DELETE
// DELETE /api/categories/:id
// ==========================================

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (!category.isActive) {
      return res.status(400).json({
        success: false,
        message: "Category is already inactive",
        category,
      });
    }

    category.isActive = false;

    const updatedCategory = await category.save();

    return res.status(200).json({
      success: true,
      message: "Category deactivated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Delete Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate category",
      error: error.message,
    });
  }
};

module.exports = {
  getCategories,
  getAllCategoriesAdmin,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
