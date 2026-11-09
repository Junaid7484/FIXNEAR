
const mongoose = require("mongoose");

const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");

const {
  getPagination,
  getPaginationMeta,
  applyPagination,
} = require("../utils/pagination");

// =====================================================
// HELPER: RECALCULATE PROVIDER RATING
// =====================================================

const recalculateProviderRating = async (providerId) => {
  const providerReviews = await Review.find({
    provider: providerId,
    isVisible: true,
  }).select("rating");

  const totalReviews = providerReviews.length;

  const totalRating = providerReviews.reduce(
    (sum, review) => sum + Number(review.rating),
    0
  );

  const averageRating =
    totalReviews > 0
      ? Number((totalRating / totalReviews).toFixed(1))
      : 0;

  await Provider.findByIdAndUpdate(providerId, {
    rating: averageRating,
    totalReviews: totalReviews,
  });

  return {
    rating: averageRating,
    totalReviews,
  };
};

// =====================================================
// CREATE REVIEW
// =====================================================

const createReview = async (req, res) => {
  try {
    const { booking, rating, comment } = req.body;

    // BASIC VALIDATION
    if (!booking || rating === undefined || !comment) {
      return res.status(400).json({
        success: false,
        message: "Please provide booking, rating and comment",
      });
    }

    // VALIDATE BOOKING ID
    if (!mongoose.Types.ObjectId.isValid(booking)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    // VALIDATE RATING
    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a whole number between 1 and 5",
      });
    }

    // VALIDATE COMMENT
    const trimmedComment = String(comment).trim();

    if (trimmedComment.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Review comment must contain at least 3 characters",
      });
    }

    if (trimmedComment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Review comment cannot exceed 1000 characters",
      });
    }

    // FIND CUSTOMER'S BOOKING
    const bookingData = await Booking.findOne({
      _id: booking,
      customer: req.user._id,
    });

    if (!bookingData) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or you do not own this booking",
      });
    }

    // ONLY COMPLETED BOOKINGS CAN BE REVIEWED
    if (bookingData.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed bookings can be reviewed",
      });
    }

    // CHECK EXISTING REVIEW
    const existingReview = await Review.findOne({
      booking: bookingData._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "This booking has already been reviewed",
      });
    }

    // CREATE REVIEW
    const review = await Review.create({
      customer: req.user._id,
      provider: bookingData.provider,
      booking: bookingData._id,
      service: bookingData.service,
      rating: numericRating,
      comment: trimmedComment,
    });

    // UPDATE PROVIDER RATING
    const providerRating = await recalculateProviderRating(
      bookingData.provider
    );

    // POPULATE REVIEW
    const populatedReview = await Review.findById(review._id)
      .populate("customer", "name email profileImage")
      .populate("provider")
      .populate("service", "name category")
      .populate("booking");

    // RESPONSE
    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      review: populatedReview,
      providerRating: providerRating.rating,
      totalReviews: providerRating.totalReviews,
    });
  } catch (error) {
    console.error("Create Review Error:", error);

    // HANDLE DUPLICATE BOOKING REVIEW
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This booking has already been reviewed",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating review",
      error: error.message,
    });
  }
};

// =====================================================
// GET REVIEWS FOR PROVIDER
// =====================================================

const getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;

    // VALIDATE PROVIDER ID
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });
    }

    // CHECK PROVIDER EXISTS
    const provider = await Provider.findById(providerId).select(
      "rating totalReviews"
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // REVIEW FILTER
    const filter = {
      provider: providerId,
      isVisible: true,
    };

    // PAGINATION
    const pagination = getPagination(req.query);

    // GET REVIEWS
    let reviewsQuery = Review.find(filter)
      .populate("customer", "name profileImage")
      .populate("service", "name category")
      .populate("booking")
      .sort({ createdAt: -1, _id: -1 });

    reviewsQuery = applyPagination(reviewsQuery, pagination);

    const reviews = await reviewsQuery;

    // COUNT TOTAL MATCHING REVIEWS WHEN PAGINATION IS REQUESTED
    let paginationMeta = null;

    if (pagination.requested) {
      const total = await Review.countDocuments(filter);
      paginationMeta = getPaginationMeta(total, pagination);
    }

    // RESPONSE
    return res.status(200).json({
      success: true,
      count: reviews.length,
      rating: provider.rating || 0,
      totalReviews: provider.totalReviews || 0,
      reviews,
      ...(paginationMeta && { pagination: paginationMeta }),
    });
  } catch (error) {
    console.error("Get Provider Reviews Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching provider reviews",
      error: error.message,
    });
  }
};

// =====================================================
// GET MY REVIEWS
// =====================================================

const getMyReviews = async (req, res) => {
  try {
    // REVIEW FILTER
    const filter = {
      customer: req.user._id,
    };

    // PAGINATION
    const pagination = getPagination(req.query);

    // GET REVIEWS
    let reviewsQuery = Review.find(filter)
      .populate("provider")
      .populate("service", "name category")
      .populate("booking")
      .sort({ createdAt: -1, _id: -1 });

    reviewsQuery = applyPagination(reviewsQuery, pagination);

    const reviews = await reviewsQuery;

    // COUNT TOTAL MATCHING REVIEWS WHEN PAGINATION IS REQUESTED
    let paginationMeta = null;

    if (pagination.requested) {
      const total = await Review.countDocuments(filter);
      paginationMeta = getPaginationMeta(total, pagination);
    }

    // RESPONSE
    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
      ...(paginationMeta && { pagination: paginationMeta }),
    });
  } catch (error) {
    console.error("Get My Reviews Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching your reviews",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE MY REVIEW
// =====================================================

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    // VALIDATE REVIEW ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    // FIND REVIEW
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // CHECK REVIEW OWNER
    if (review.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own review",
      });
    }

    // SAVE PROVIDER ID BEFORE DELETE
    const providerId = review.provider;

    // DELETE REVIEW
    await Review.findByIdAndDelete(id);

    // RECALCULATE PROVIDER RATING
    const providerRating = await recalculateProviderRating(providerId);

    // RESPONSE
    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
      providerRating: providerRating.rating,
      totalReviews: providerRating.totalReviews,
    });
  } catch (error) {
    console.error("Delete Review Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting review",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
  createReview,
  getProviderReviews,
  getMyReviews,
  deleteReview,
};
