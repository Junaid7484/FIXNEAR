const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    // Customer who added the favorite
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Provider of the service
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },

    // Specific service provided by the provider
    providerService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderService",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate favorites for the same customer and service
favoriteSchema.index(
  {
    customer: 1,
    provider: 1,
    providerService: 1,
  },
  {
    unique: true,
  },
);

// Customer favorites listing and pagination
favoriteSchema.index({
  customer: 1,
  createdAt: -1,
  _id: -1,
});

const Favorite = mongoose.model("Favorite", favoriteSchema);

module.exports = Favorite;
