const authorize = (...roles) => {
  return (req, res, next) => {
    console.log("==================================");
    console.log("ROLE AUTHORIZATION CHECK");
    console.log("Required Roles:", roles);
    console.log("User Exists:", !!req.user);

    if (!req.user) {
      console.log("❌ No authenticated user");

      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    console.log("User ID:", req.user._id);
    console.log("User Email:", req.user.email);
    console.log("User Role:", req.user.role);
    console.log("==================================");

    if (!roles.includes(req.user.role)) {
      console.log("❌ ROLE NOT AUTHORIZED");
      console.log("Required:", roles);
      console.log("Received:", req.user.role);

      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(
          " or ",
        )}. Your role is: ${req.user.role}`,
      });
    }

    console.log("✅ ROLE AUTHORIZED");

    next();
  };
};

module.exports = {
  authorize,
};
