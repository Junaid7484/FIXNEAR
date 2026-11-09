  const mongoose = require("mongoose");

  const reviewSchema = new mongoose.Schema(
    {
      // Customer who wrote the review
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      // Provider being reviewed
      provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Provider",
        required: true,
      },

      // One booking can have only one review
      booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
        unique: true,
      },

      // Related service
      service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
      },

      // Rating from 1 to 5
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
          validator: Number.isInteger,
          message: "Rating must be a whole number between 1 and 5",
        },
      },

      // Written review
      comment: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 1000,
      },

      // Review visibility
      isVisible: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    },
  );

  // Provider reviews: filter + newest-first pagination
  reviewSchema.index({
    provider: 1,
    isVisible: 1,
    createdAt: -1,
    _id: -1,
  });

  // Customer reviews: filter + newest-first pagination
  reviewSchema.index({
    customer: 1,
    createdAt: -1,
    _id: -1,
  });

  const Review = mongoose.model("Review", reviewSchema);

  module.exports = Review;
