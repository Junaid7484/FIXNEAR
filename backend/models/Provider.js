const mongoose = require("mongoose");

// =====================================================
// WORKING DAY SCHEMA
// =====================================================

const workingDaySchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    start: {
      type: String,
      default: "09:00",
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid start time."],
    },
    end: {
      type: String,
      default: "19:00",
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid end time."],
    },
  },
  { _id: false },
);

// =====================================================
// PROVIDER SCHEMA
// =====================================================

const providerSchema = new mongoose.Schema(
  {
    // Link to the provider's user account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Business information
    businessName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // NEW: Provider email
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address.",
      ],
    },

    // Business address
    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{6}$/, "Pincode must contain exactly 6 digits."],
    },

    // Geographic location for nearby searches
    // GeoJSON order: [longitude, latitude]
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: false,
      },
      coordinates: {
        type: [Number],
        required: false,
        validate: {
          validator(value) {
            if (value === undefined) return true;

            return (
              Array.isArray(value) &&
              value.length === 2 &&
              Number.isFinite(value[0]) &&
              Number.isFinite(value[1]) &&
              value[0] >= -180 &&
              value[0] <= 180 &&
              value[1] >= -90 &&
              value[1] <= 90
            );
          },
          message:
            "Coordinates must be [longitude, latitude] with valid values.",
        },
      },
    },

    // Experience
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Profile image
    profileImage: {
      type: String,
      default: "",
      trim: true,
    },

    // Provider documents
    documents: {
      type: [String],
      default: [],
    },

    // Working hours
    workingHours: {
      monday: {
        type: workingDaySchema,
        default: () => ({
          enabled: true,
          start: "09:00",
          end: "19:00",
        }),
      },
      tuesday: {
        type: workingDaySchema,
        default: () => ({
          enabled: true,
          start: "09:00",
          end: "19:00",
        }),
      },
      wednesday: {
        type: workingDaySchema,
        default: () => ({
          enabled: true,
          start: "09:00",
          end: "19:00",
        }),
      },
      thursday: {
        type: workingDaySchema,
        default: () => ({
          enabled: true,
          start: "09:00",
          end: "19:00",
        }),
      },
      friday: {
        type: workingDaySchema,
        default: () => ({
          enabled: true,
          start: "09:00",
          end: "19:00",
        }),
      },
      saturday: {
        type: workingDaySchema,
        default: () => ({
          enabled: true,
          start: "09:00",
          end: "19:00",
        }),
      },
      sunday: {
        type: workingDaySchema,
        default: () => ({
          enabled: false,
          start: "09:00",
          end: "19:00",
        }),
      },
    },

    // Admin approval
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Provider availability
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // Booking concurrency lock.
    // Updated inside MongoDB transactions to serialize
    // simultaneous booking attempts for this provider.
    bookingLockVersion: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },

    // Ratings
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Completed bookings
    completedBookings: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

// =====================================================
// PROVIDER INDEXES
// =====================================================

// Nearby-provider searches
providerSchema.index({
  location: "2dsphere",
});

// Public provider listing and filtering
providerSchema.index({
  isVerified: 1,
  isAvailable: 1,
  createdAt: -1,
  _id: -1,
});

// Admin provider listing
providerSchema.index({
  createdAt: -1,
  _id: -1,
});

// Provider lookup by linked user account
// The user field already has a unique index because
// unique: true is configured in the schema.

const Provider =
  mongoose.models.Provider || mongoose.model("Provider", providerSchema);

module.exports = Provider;
