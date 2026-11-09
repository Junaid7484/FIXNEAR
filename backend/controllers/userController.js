const User = require("../models/User");
const getUploadedFileUrl = require("../utils/getUploadedFileUrl");

// =========================================================
// GET MY PROFILE
// GET /api/users/profile
// Logged-in user
// =========================================================

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
      error: error.message,
    });
  }
};

// =========================================================
// UPDATE MY PROFILE
// PUT /api/users/profile
// Logged-in user
// =========================================================

const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { name, phone, address, city, state } = req.body;

    if (req.file) {
      user.profileImage = getUploadedFileUrl(req, req.file);
    }

    // UPDATE NAME
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    // UPDATE PHONE
    if (phone !== undefined) {
      if (typeof phone !== "string" || !phone.trim()) {
        return res.status(400).json({
          success: false,
          message: "Phone cannot be empty",
        });
      }

      user.phone = phone.trim();
    }

    // UPDATE ADDRESS
    if (address !== undefined) {
      if (typeof address !== "string") {
        return res.status(400).json({
          success: false,
          message: "Address must be a string",
        });
      }

      user.address = address.trim();
    }

    // UPDATE CITY
    if (city !== undefined) {
      if (typeof city !== "string") {
        return res.status(400).json({
          success: false,
          message: "City must be a string",
        });
      }

      user.city = city.trim();
    }

    // UPDATE STATE
    if (state !== undefined) {
      if (typeof state !== "string") {
        return res.status(400).json({
          success: false,
          message: "State must be a string",
        });
      }

      user.state = state.trim();
    }
    const updatedUser = await user.save();

    const userResponse = updatedUser.toObject();

    // Never send password
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// =========================================================
// GET ALL USERS
// GET /api/users
// ADMIN ONLY
// =========================================================

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// =========================================================
// GET USER BY ID
// GET /api/users/:id
// ADMIN ONLY
// =========================================================

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

// =========================================================
// UPDATE USER STATUS
// PUT /api/users/:id/status
// ADMIN ONLY
// =========================================================

const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Admin cannot deactivate their own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own account status",
      });
    }

    user.isActive = isActive;

    const updatedUser = await user.save();

    const userResponse = updatedUser.toObject();

    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update User Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message,
    });
  }
};

// =========================================================
// EXPORT ALL CONTROLLERS
// =========================================================

module.exports = {
  getMyProfile,
  updateMyProfile,

  // Admin
  getAllUsers,
  getUserById,
  updateUserStatus,
};
