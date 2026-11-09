const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// ==========================================
// INDEXES
// ==========================================

// Supports newest-first admin category listing.
categorySchema.index({
  createdAt: -1,
  _id: -1,
});

// Supports active category listing and newest-first sorting.
categorySchema.index({
  isActive: 1,
  createdAt: -1,
  _id: -1,
});

// The unique index on name is already created by unique: true.

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
