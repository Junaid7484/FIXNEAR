const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    // Optional customer location.
    // GeoJSON coordinates must be [longitude, latitude].
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },

      coordinates: {
        type: [Number],
        default: undefined,

        validate: {
          validator: function (coordinates) {
            if (coordinates == null) return true;

            return (
              Array.isArray(coordinates) &&
              coordinates.length === 2 &&
              Number.isFinite(coordinates[0]) &&
              Number.isFinite(coordinates[1]) &&
              coordinates[0] >= -180 &&
              coordinates[0] <= 180 &&
              coordinates[1] >= -90 &&
              coordinates[1] <= 90
            );
          },
          message:
            "Location must contain valid [longitude, latitude] coordinates.",
        },
      },
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // Password reset token is stored only as a SHA-256 hash.
    resetPasswordToken: {
      type: String,
      default: undefined,
      select: false,
    },

    // Reset links expire after 15 minutes.
    resetPasswordExpires: {
      type: Date,
      default: undefined,
      select: false,
    },

    role: {
      type: String,
      enum: ["customer", "provider", "admin"],
      default: "customer",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    profileImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Create a geospatial index for location-based queries.
userSchema.index({ location: "2dsphere" });

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// Compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON responses
userSchema.methods.toJSON = function () {
  const user = this.toObject();

  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;

  return user;
};

// Supports admin user listing and role/status filtering.
userSchema.index({ createdAt: -1, _id: -1 });
userSchema.index({ role: 1, isActive: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
