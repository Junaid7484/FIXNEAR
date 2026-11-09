const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcryptjs");

// ========================================
// REGISTER USER
// ========================================
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      password,
      role,
      latitude,
      longitude,
      location,
    } = req.body;

    // Validate required fields.
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, phone and password.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Never allow public registration as an administrator.
    const userRole = role === "provider" ? "provider" : "customer";

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    // ========================================
    // VALIDATE LOCATION
    // ========================================
    let savedLocation;

    const hasLatitude =
      latitude !== undefined && latitude !== null && latitude !== "";

    const hasLongitude =
      longitude !== undefined && longitude !== null && longitude !== "";

    if (hasLatitude !== hasLongitude) {
      return res.status(400).json({
        success: false,
        message: "Both latitude and longitude must be provided.",
      });
    }

    if (hasLatitude && hasLongitude) {
      const lat = Number(latitude);
      const lng = Number(longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude or longitude.",
        });
      }

      // If the frontend sends a GeoJSON location too,
      // ensure it agrees with the validated coordinates.
      if (location !== undefined) {
        const coordinates = location?.coordinates;

        if (
          location?.type !== "Point" ||
          !Array.isArray(coordinates) ||
          coordinates.length !== 2 ||
          !Number.isFinite(Number(coordinates[0])) ||
          !Number.isFinite(Number(coordinates[1])) ||
          Number(coordinates[0]) !== lng ||
          Number(coordinates[1]) !== lat
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Location must match the supplied [longitude, latitude] coordinates.",
          });
        }
      }

      savedLocation = {
        type: "Point",
        coordinates: [lng, lat],
      };
    } else if (location !== undefined) {
      // Also support clients that submit GeoJSON directly.
      const coordinates = location?.coordinates;

      if (
        location?.type !== "Point" ||
        !Array.isArray(coordinates) ||
        coordinates.length !== 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Location must be a GeoJSON Point with [longitude, latitude] coordinates.",
        });
      }

      const lng = Number(coordinates[0]);
      const lat = Number(coordinates[1]);

      if (
        !Number.isFinite(lng) ||
        !Number.isFinite(lat) ||
        lng < -180 ||
        lng > 180 ||
        lat < -90 ||
        lat > 90
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid location coordinates.",
        });
      }

      savedLocation = {
        type: "Point",
        coordinates: [lng, lat],
      };
    }

    // ========================================
    // CREATE USER
    // ========================================
    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      address: address?.trim() || "",
      city: city?.trim() || "",
      state: state?.trim() || "",
      password,
      role: userRole,
    };

    // Only store a location when valid coordinates were provided.
    if (savedLocation) {
      userData.location = savedLocation;
    }

    const user = await User.create(userData);

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user,
    });
  } catch (error) {
    console.error("Registration Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during registration.",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

// ========================================
// LOGIN USER
// ========================================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user,
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login.",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

// ========================================
// CHANGE PASSWORD
// ========================================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current password and new password.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isCurrentPasswordCorrect =
      await user.comparePassword(currentPassword);

    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const isSamePassword = await user.comparePassword(newPassword);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password.",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change password.",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

// ========================================
// FORGOT PASSWORD
// ========================================
const forgotPassword = async (req, res) => {
  try {
    const email = req.body?.email;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Always return the same public response to prevent email enumeration.
    const genericResponse = {
      success: true,
      message:
        "If an account exists with this email, password reset instructions will be sent.",
    };

    if (!user || !user.isActive) {
      return res.status(200).json(genericResponse);
    }

    // Generate a cryptographically secure token. Only its hash is stored.
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: resetExpires,
        },
      },
    );

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/$/, "");
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "FIXNEAR - Password Reset Request",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#1e293b;">
            <h2 style="color:#2563eb;">Reset your FIXNEAR password</h2>
            <p>We received a request to reset the password for your FIXNEAR account.</p>
            <p style="margin:28px 0;">
              <a href="${resetUrl}" style="background:#2563eb;color:#ffffff;padding:13px 22px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">Reset Password</a>
            </p>
            <p>This link expires in <strong>15 minutes</strong> and can be used only once.</p>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
            <p style="font-size:12px;color:#64748b;word-break:break-all;">If the button does not work, copy this link into your browser:<br/>${resetUrl}</p>
          </div>
        `,
      });
    } catch (emailError) {
      // Do not reveal whether the email exists. Remove the unusable token.
      await User.updateOne(
        { _id: user._id },
        {
          $unset: {
            resetPasswordToken: 1,
            resetPasswordExpires: 1,
          },
        },
      );
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process the password reset request right now.",
    });
  }
};

// ========================================
// RESET PASSWORD
// ========================================
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "This password reset link is invalid or has expired.",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user || !user.isActive) {
      return res.status(400).json({
        success: false,
        message: "This password reset link is invalid or has expired.",
      });
    }

    // Hash manually because updateOne() does not run save middleware.
    const hashedPassword = await bcrypt.hash(password, 10);

    const updateResult = await User.updateOne(
      {
        _id: user._id,
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
        isActive: true,
      },
      {
        $set: {
          password: hashedPassword,
        },
        $unset: {
          resetPasswordToken: 1,
          resetPasswordExpires: 1,
        },
      },
    );

    if (updateResult.modifiedCount !== 1) {
      return res.status(400).json({
        success: false,
        message: "This password reset link is invalid or has expired.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to reset the password right now. Please try again.",
    });
  }
};

// ========================================
// EXPORT
// ========================================
module.exports = {
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
