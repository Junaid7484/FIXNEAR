const mongoose = require("mongoose");

const Favorite = require("../models/Favorite");
const Provider = require("../models/Provider");
const ProviderService = require("../models/ProviderService");

const {
  getPagination,
  getPaginationMeta,
  applyPagination,
} = require("../utils/pagination");

// ======================================================
// ADD SERVICE + PROVIDER TO FAVORITES
// POST /favorites
// ======================================================

const addFavorite = async (req, res) => {
  try {
    const { provider, providerService } = req.body;

    // Check required IDs
    if (!provider || !providerService) {
      return res.status(400).json({
        success: false,
        message: "Provider and provider service are required",
      });
    }

    // Validate Provider ObjectId
    if (!mongoose.Types.ObjectId.isValid(provider)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });
    }

    // Validate ProviderService ObjectId
    if (!mongoose.Types.ObjectId.isValid(providerService)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider service ID",
      });
    }

    // Check provider exists
    const providerData = await Provider.findById(provider);

    if (!providerData) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // Check provider service exists
    const providerServiceData = await ProviderService.findById(providerService);

    if (!providerServiceData) {
      return res.status(404).json({
        success: false,
        message: "Provider service not found",
      });
    }

    // Make sure this service belongs to this provider
    if (
      providerServiceData.provider &&
      providerServiceData.provider.toString() !== provider.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "This service does not belong to the selected provider",
      });
    }

    // Check if this exact service is already favorite
    const existingFavorite = await Favorite.findOne({
      customer: req.user._id,
      provider,
      providerService,
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: "Service is already in your favorites",
        isFavorite: true,
      });
    }

    // Create favorite
    const favorite = await Favorite.create({
      customer: req.user._id,
      provider,
      providerService,
    });

    // Populate provider + service information
    const populatedFavorite = await Favorite.findById(favorite._id)
      .populate({
        path: "provider",
        select:
          "businessName phone address city state pincode experience profileImage isVerified isAvailable rating totalReviews completedBookings",
        populate: {
          path: "user",
          select: "name email phone profileImage",
        },
      })
      .populate({
        path: "providerService",
      });

    return res.status(201).json({
      success: true,
      message: "Service added to favorites",
      isFavorite: true,
      favorite: populatedFavorite,
    });
  } catch (error) {
    console.error("Add Favorite Error:", error);

    // Duplicate key protection
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Service is already in your favorites",
        isFavorite: true,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while adding favorite",
      error: error.message,
    });
  }
};

// ======================================================
// GET CUSTOMER'S FAVORITES
// GET /favorites/my
// ======================================================

const getMyFavorites = async (req, res) => {
  try {
    const filter = {
      customer: req.user._id,
    };

    const pagination = getPagination(req.query);

    let query = Favorite.find(filter)
      .populate({
        path: "provider",
        select:
          "businessName phone address city state pincode experience profileImage isVerified isAvailable rating totalReviews completedBookings",
        populate: {
          path: "user",
          select: "name email phone profileImage",
        },
      })
      .populate({
        path: "providerService",
      })
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .lean();

    // Apply pagination when page or limit is supplied
    query = applyPagination(query, pagination);

    const favorites = await query;

    // Remove favorites where provider or service no longer exists
    const validFavorites = favorites.filter(
      (favorite) => favorite.provider && favorite.providerService,
    );

    const response = {
      success: true,
      count: validFavorites.length,
      favorites: validFavorites,
    };

    if (pagination.requested) {
      const total = await Favorite.countDocuments(filter);

      response.pagination = getPaginationMeta(total, pagination);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Get Favorites Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching favorites",
      error: error.message,
    });
  }
};

// ======================================================
// CHECK IF SERVICE IS FAVORITED
// GET /favorites/check/:providerId/:providerServiceId
// ======================================================

const checkFavorite = async (req, res) => {
  try {
    const { providerId, providerServiceId } = req.params;

    // Validate provider ID
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });
    }

    // Validate provider service ID
    if (!mongoose.Types.ObjectId.isValid(providerServiceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider service ID",
      });
    }

    // Check favorite
    const favorite = await Favorite.findOne({
      customer: req.user._id,
      provider: providerId,
      providerService: providerServiceId,
    });

    return res.status(200).json({
      success: true,
      isFavorite: !!favorite,
    });
  } catch (error) {
    console.error("Check Favorite Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while checking favorite",
      error: error.message,
    });
  }
};

// ======================================================
// REMOVE SERVICE FROM FAVORITES
// DELETE /favorites/:providerId/:providerServiceId
// ======================================================

const removeFavorite = async (req, res) => {
  try {
    const { providerId, providerServiceId } = req.params;

    // Validate provider ID
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });
    }

    // Validate provider service ID
    if (!mongoose.Types.ObjectId.isValid(providerServiceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider service ID",
      });
    }

    // Remove exact provider service favorite
    const favorite = await Favorite.findOneAndDelete({
      customer: req.user._id,
      provider: providerId,
      providerService: providerServiceId,
    });

    // Favorite not found
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Service is not in your favorites",
        isFavorite: false,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service removed from favorites",
      isFavorite: false,
    });
  } catch (error) {
    console.error("Remove Favorite Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while removing favorite",
      error: error.message,
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  addFavorite,
  getMyFavorites,
  checkFavorite,
  removeFavorite,
};
