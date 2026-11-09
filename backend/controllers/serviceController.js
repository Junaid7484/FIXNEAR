const mongoose = require("mongoose");
const { Readable } = require("stream");
const Service = require("../models/Service");
const cloudinary = require("../config/cloudinary");

const {
  getPagination,
  getPaginationMeta,
  applyPagination,
} = require("../utils/pagination");

// =========================================================
// HELPERS
// =========================================================

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parseBoolean = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return Boolean(value);
};

const validatePrice = (price) => {
  const numericPrice = Number(price);
  return Number.isFinite(numericPrice) && numericPrice > 0;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Upload image buffer directly to Cloudinary.
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "fixnear/services",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);

        if (!result?.secure_url) {
          return reject(new Error("Cloudinary did not return an image URL"));
        }

        resolve(result.secure_url);
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  });

// =========================================================
// GET PUBLIC SERVICES
// GET /api/services
// =========================================================

const getServices = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };

    if (category && category !== "All") {
      filter.category = category.trim();
    }

    if (search?.trim()) {
      const searchText = escapeRegex(search.trim());

      filter.$or = [
        { name: { $regex: searchText, $options: "i" } },
        { description: { $regex: searchText, $options: "i" } },
        { category: { $regex: searchText, $options: "i" } },
      ];
    }

    const pagination = getPagination(req.query);

    let servicesQuery = Service.find(filter).sort({
      createdAt: -1,
      _id: -1,
    });

    servicesQuery = applyPagination(servicesQuery, pagination);

    const [services, total] = await Promise.all([
      servicesQuery,
      pagination.requested
        ? Service.countDocuments(filter)
        : Promise.resolve(null),
    ]);

    const response = {
      success: true,
      count: services.length,
      services,
    };

    if (pagination.requested) {
      response.pagination = getPaginationMeta(total, pagination);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Get Services Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching services",
    });
  }
};

// =========================================================
// GET ALL SERVICES FOR ADMIN
// GET /api/services/admin/all
// =========================================================

const getAllServicesAdmin = async (req, res) => {
  try {
    const { category, search, status } = req.query;
    const filter = {};

    if (category && category !== "All") {
      filter.category = category.trim();
    }

    if (search?.trim()) {
      const searchText = escapeRegex(search.trim());

      filter.$or = [
        { name: { $regex: searchText, $options: "i" } },
        { description: { $regex: searchText, $options: "i" } },
        { category: { $regex: searchText, $options: "i" } },
      ];
    }

    if (status === "Active") filter.isActive = true;
    if (status === "Inactive") filter.isActive = false;

    const pagination = getPagination(req.query);

    let servicesQuery = Service.find(filter).sort({
      createdAt: -1,
      _id: -1,
    });

    servicesQuery = applyPagination(servicesQuery, pagination);

    const [services, total] = await Promise.all([
      servicesQuery,
      pagination.requested
        ? Service.countDocuments(filter)
        : Promise.resolve(null),
    ]);

    const response = {
      success: true,
      count: services.length,
      services,
    };

    if (pagination.requested) {
      response.pagination = getPaginationMeta(total, pagination);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Get All Admin Services Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching admin services",
    });
  }
};

// =========================================================
// GET SINGLE ACTIVE SERVICE
// GET /api/services/:id
// =========================================================

const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    const service = await Service.findOne({
      _id: id,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Get Service Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching service",
    });
  }
};

// =========================================================
// CREATE SERVICE
// POST /api/services
// =========================================================

const createService = async (req, res) => {
  try {
    const { name, description, category, image, price, duration, isActive } =
      req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      price === undefined ||
      price === null ||
      price === "" ||
      typeof duration !== "string" ||
      !duration.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide name, description, category, price and duration",
      });
    }

    if (!validatePrice(price)) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid number greater than 0",
      });
    }

    let imageUrl = typeof image === "string" ? image.trim() : "";

    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    const service = await Service.create({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      image: imageUrl,
      price: Number(price),
      duration: duration.trim(),
      isActive: parseBoolean(isActive, true),
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    console.error("Create Service Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid service data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating service",
    });
  }
};

// =========================================================
// UPDATE SERVICE
// PUT /api/services/:id
// =========================================================

const updateService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    const existingService = await Service.findById(id);

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const { name, description, category, image, price, duration, isActive } =
      req.body;

    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Service name cannot be empty",
        });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty",
        });
      }
      updateData.description = description.trim();
    }

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category cannot be empty",
        });
      }
      updateData.category = category.trim();
    }

    if (price !== undefined) {
      if (price === "" || !validatePrice(price)) {
        return res.status(400).json({
          success: false,
          message: "Price must be a valid number greater than 0",
        });
      }
      updateData.price = Number(price);
    }

    if (duration !== undefined) {
      if (typeof duration !== "string" || !duration.trim()) {
        return res.status(400).json({
          success: false,
          message: "Duration cannot be empty",
        });
      }
      updateData.duration = duration.trim();
    }

    if (isActive !== undefined) {
      updateData.isActive = parseBoolean(isActive);
    }

    if (req.file) {
      updateData.image = await uploadToCloudinary(req.file.buffer);
    } else if (image !== undefined) {
      if (typeof image !== "string") {
        return res.status(400).json({
          success: false,
          message: "Image must be a valid string",
        });
      }
      updateData.image = image.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const service = await Service.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    console.error("Update Service Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid service data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating service",
    });
  }
};

// =========================================================
// SOFT DELETE SERVICE
// DELETE /api/services/:id
// =========================================================

const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    const service = await Service.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true, runValidators: true },
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service deactivated successfully",
      service,
    });
  } catch (error) {
    console.error("Delete Service Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting service",
    });
  }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  getServices,
  getAllServicesAdmin,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
