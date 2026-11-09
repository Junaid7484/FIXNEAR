const mongoose = require("mongoose");
const ProviderService = require("../models/ProviderService");
const Provider = require("../models/Provider");
const Service = require("../models/Service");
const getUploadedFileUrl = require("../utils/getUploadedFileUrl");

// ========================================
// GET MY SERVICES
// ========================================

const getMyServices = async (req, res) => {
  try {
    const provider = await Provider.findOne({
      user: req.user._id,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    const services = await ProviderService.find({
      provider: provider._id,
    })
      .populate("service")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Get Provider Services Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching provider services",
      error: error.message,
    });
  }
};

// ========================================
// ADD SERVICE
// ========================================

const addProviderService = async (req, res) => {
  try {
    console.log("\n========== ADD PROVIDER SERVICE ==========");

    console.log("USER:", req.user);
    console.log("BODY:", req.body);

    const { service, price, description, duration } = req.body;
    const image = req.file ? getUploadedFileUrl(req, req.file) : "";

    // Check request data
    if (!service || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide service and price",
      });
    }

    // Check service ID
    if (!mongoose.Types.ObjectId.isValid(service)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    // Check price
    if (Number(price) < 0 || Number.isNaN(Number(price))) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid price",
      });
    }

    // Find provider profile
    const provider = await Provider.findOne({
      user: req.user._id,
    });

    console.log("PROVIDER:", provider);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message:
          "Provider profile not found. Please complete provider registration first.",
      });
    }

    // Find master service
    const masterService = await Service.findOne({
      _id: service,
      isActive: true,
    });

    console.log("MASTER SERVICE:", masterService);

    if (!masterService) {
      return res.status(404).json({
        success: false,
        message: "Service not found or inactive",
      });
    }

    // Check duplicate
    const existingService = await ProviderService.findOne({
      provider: provider._id,
      service: service,
    });

    console.log("EXISTING PROVIDER SERVICE:", existingService);

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: "You already offer this service",
      });
    }

    // Create provider service
    const providerService = await ProviderService.create({
      provider: provider._id,
      service: service,
      price: Number(price),
      description: description || "",
      image,
      duration:
        duration !== undefined && duration !== "" ? Number(duration) : 60,
    });

    console.log("CREATED PROVIDER SERVICE:", providerService);

    // Populate service
    const populatedService = await ProviderService.findById(
      providerService._id,
    ).populate("service");

    console.log("FINAL PROVIDER SERVICE:", populatedService);

    console.log("========================================\n");

    return res.status(201).json({
      success: true,
      message: "Service added successfully",
      providerService: populatedService,
    });
  } catch (error) {
    console.error("\n========== ADD SERVICE ERROR ==========");
    console.error(error);
    console.error("======================================\n");

    return res.status(500).json({
      success: false,
      message: "Server error while adding service",
      error: error.message,
    });
  }
};

// ========================================
// UPDATE MY SERVICE
// ========================================

const updateProviderService = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, description, isActive, duration } = req.body;
    const image = req.file ? getUploadedFileUrl(req, req.file) : undefined;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider service ID",
      });
    }

    // Find provider
    const provider = await Provider.findOne({
      user: req.user._id,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    // Find provider service
    const providerService = await ProviderService.findOne({
      _id: id,
      provider: provider._id,
    });

    if (!providerService) {
      return res.status(404).json({
        success: false,
        message: "Provider service not found",
      });
    }

    // Update price
    if (price !== undefined) {
      if (Number(price) < 0 || Number.isNaN(Number(price))) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid price",
        });
      }

      providerService.price = Number(price);
    }

    // Update description
    if (description !== undefined) {
      providerService.description = description;
    }

    // Update image
    if (image !== undefined) {
      providerService.image = image;
    }

    // Update duration
    if (duration !== undefined) {
      const numericDuration = Number(duration);
      if (!Number.isFinite(numericDuration) || numericDuration < 15) {
        return res.status(400).json({
          success: false,
          message: "Duration must be at least 15 minutes.",
        });
      }
      providerService.duration = numericDuration;
    }

    // Update active status
    if (isActive !== undefined) {
      providerService.isActive =
        isActive === true ||
        isActive === "true" ||
        isActive === 1 ||
        isActive === "1";
    }

    await providerService.save();

    const updatedService = await ProviderService.findById(
      providerService._id,
    ).populate("service");

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      providerService: updatedService,
    });
  } catch (error) {
    console.error("Update Provider Service Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating service",
      error: error.message,
    });
  }
};

// ========================================
// DELETE MY SERVICE
// ========================================

const deleteProviderService = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider service ID",
      });
    }

    // Find provider
    const provider = await Provider.findOne({
      user: req.user._id,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found",
      });
    }

    // Find provider service
    const providerService = await ProviderService.findOne({
      _id: id,
      provider: provider._id,
    });

    if (!providerService) {
      return res.status(404).json({
        success: false,
        message: "Provider service not found",
      });
    }

    // Deactivate instead of permanently deleting
    providerService.isActive = false;

    await providerService.save();

    return res.status(200).json({
      success: true,
      message: "Service removed successfully",
      providerService,
    });
  } catch (error) {
    console.error("Delete Provider Service Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while removing service",
      error: error.message,
    });
  }
};

// ========================================
// GET ALL PROVIDERS BY SERVICE
// ========================================

const getProvidersByService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    // 1. Validate service ID
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    // 2. Find the master service
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // 3. Find ALL matching records first, including inactive ones
    const allProviderServices = await ProviderService.find({
      service: service._id,
    })
      .populate({
        path: "provider",
        populate: {
          path: "user",
          select: "name email phone profileImage",
        },
      })
      .populate({
        path: "service",
        select: "name category description image price duration isActive",
      })
      .sort({ createdAt: -1 });

    // 4. Log database results before filtering
    console.log("\n========== PROVIDERS BY SERVICE ==========");
    console.log("Service name:", service.name);
    console.log("Service ID:", serviceId);
    console.log("Total matching records:", allProviderServices.length);
    console.log(
      "Active records:",
      allProviderServices.filter((item) => item.isActive === true).length,
    );
    console.log(
      "Inactive records:",
      allProviderServices.filter((item) => item.isActive !== true).length,
    );

    allProviderServices.forEach((item, index) => {
      console.log(`Provider service ${index + 1}:`, {
        providerServiceId: item._id,
        providerId: item.provider?._id || item.provider || null,
        providerName: item.provider?.user?.name || "User not populated",
        serviceId: item.service?._id || item.service || null,
        isActive: item.isActive,
        price: item.price,
      });
    });

    // 5. Return only active records with valid references
    const providers = allProviderServices.filter(
      (item) =>
        item.isActive === true &&
        item.provider &&
        typeof item.provider === "object" &&
        item.service &&
        typeof item.service === "object",
    );

    console.log("Valid active provider services:", providers.length);
    console.log("==========================================\n");

    return res.status(200).json({
      success: true,
      service: {
        _id: service._id,
        name: service.name,
      },
      count: providers.length,
      providers,
    });
  } catch (error) {
    console.error("Get Providers By Service Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load providers for this service.",
    });
  }
};

// ========================================
// GET PUBLIC PROVIDER SERVICES
// ========================================

const getPublicProviderServices = async (req, res) => {
  try {
    const { providerId } = req.params;

    console.log("\n========== GET PUBLIC PROVIDER SERVICES ==========");
    console.log("Provider ID:", providerId);

    // Check provider ID
    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: "Provider ID is required.",
      });
    }

    // Check valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      console.log("Invalid Provider ID:", providerId);

      return res.status(400).json({
        success: false,
        message: "Invalid provider ID.",
      });
    }

    // Check provider exists
    const provider = await Provider.findById(providerId);

    if (!provider) {
      console.log("Provider not found:", providerId);

      return res.status(404).json({
        success: false,
        message: "Provider not found.",
      });
    }

    // Get active services offered by this provider
    const providerServices = await ProviderService.find({
      provider: providerId,
      isActive: true,
    })
      .populate("service", "name category description image")
      .sort({ createdAt: -1 });

    console.log("Services found:", providerServices.length);

    console.log("===============================================\n");

    return res.status(200).json({
      success: true,
      count: providerServices.length,
      services: providerServices,
    });
  } catch (error) {
    console.error("\n========== GET PUBLIC PROVIDER SERVICES ERROR ==========");
    console.error(error);
    console.error("========================================================\n");

    return res.status(500).json({
      success: false,
      message: "Failed to fetch provider services.",
      error: error.message,
    });
  }
};

// ========================================
// EXPORT ALL CONTROLLERS
// ========================================

module.exports = {
  getProvidersByService,
  getMyServices,
  addProviderService,
  updateProviderService,
  deleteProviderService,
  getPublicProviderServices,
};
