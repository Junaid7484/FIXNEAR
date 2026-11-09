const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Provider = require("../models/Provider");

const protect = async (req, res, next) => {
  try {
    // Get JWT from Authorization header
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login first.",
      });
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login first.",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded._id && !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload.",
      });
    }

    // Support tokens containing either _id or id
    const userId = decoded._id || decoded.id;

    // Find user
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    // Check whether account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    // Attach authenticated user to request
    req.user = user;

    // Load provider profile for provider accounts
    if (user.role === "provider") {
      const provider = await Provider.findOne({
        user: user._id,
      });

      if (!provider) {
        return res.status(404).json({
          success: false,
          message: "Provider profile not found.",
        });
      }

      req.provider = provider;
    }

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          error.name === "TokenExpiredError"
            ? "Token has expired. Please login again."
            : "Invalid or inactive token.",
      });
    }

    console.error("Authentication Error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

module.exports = {
  protect,
};
