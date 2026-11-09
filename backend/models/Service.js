const mongoose = require("mongoose");

// =====================================================
// SERVICE SCHEMA
// =====================================================

const serviceSchema = new mongoose.Schema(
  {
    // SERVICE NAME
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // SERVICE DESCRIPTION
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // CATEGORY
    category: {
      type: String,
      required: true,
      trim: true,
    },

    // SERVICE IMAGE
    image: {
      type: String,
      default: "",
      trim: true,
    },

    // BASE / STARTING PRICE
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // SERVICE DURATION
    duration: {
      type: String,
      required: true,
      trim: true,
    },

    // SERVICE STATUS
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Public service listing: active services, newest first
serviceSchema.index({
  isActive: 1,
  createdAt: -1,
  _id: -1,
});

// Public service listing: active services by category
serviceSchema.index({
  isActive: 1,
  category: 1,
  createdAt: -1,
  _id: -1,
});

// Admin service listing: all services, newest first
serviceSchema.index({
  createdAt: -1,
  _id: -1,
});

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
