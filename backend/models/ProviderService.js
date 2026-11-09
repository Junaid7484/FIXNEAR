const mongoose = require("mongoose");

const providerServiceSchema = new mongoose.Schema(
  {
    // Provider offering the service
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },

    // Master service, such as plumbing or electrical work
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    // Provider-specific price
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Provider-specific description
    description: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    // Duration in minutes
    duration: {
      type: Number,
      required: true,
      min: 15,
      default: 60,
    },

    // Whether the provider offers this service
    isActive: {
      type: Boolean,
      default: true,
    },

    // Number of bookings
    bookingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate services for the same provider
providerServiceSchema.index(
  {
    provider: 1,
    service: 1,
  },
  {
    unique: true,
  },
);

// Active services offered by a provider
providerServiceSchema.index({
  provider: 1,
  isActive: 1,
});

const ProviderService = mongoose.model(
  "ProviderService",
  providerServiceSchema,
);

module.exports = ProviderService;
