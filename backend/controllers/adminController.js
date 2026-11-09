const mongoose = require("mongoose");

const Provider = require("../models/Provider");
const ProviderService = require("../models/ProviderService");
const User = require("../models/User");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const AdminSettings = require("../models/AdminSettings");
const { getPagination, getPaginationMeta } = require("../utils/pagination");

// =====================================================
// HELPER: POPULATE PROVIDER DETAILS
// =====================================================

const getProviderWithServices = async (providerId) => {
  const provider = await Provider.findById(providerId)
    .populate(
      "user",
      "name email phone role isActive isVerified address city state profileImage",
    )
    .lean();

  if (!provider) {
    return null;
  }

  // ---------------------------------------------------
  // GET PROVIDER SERVICES
  // Provider -> ProviderService -> Service
  // ---------------------------------------------------

  const providerServices = await ProviderService.find({
    provider: provider._id,
  })
    .populate(
      "service",
      "name description category image price duration isActive",
    )
    .sort({ createdAt: -1 })
    .lean();

  // ---------------------------------------------------
  // FORMAT SERVICES
  // ---------------------------------------------------

  const services = providerServices
    .filter((item) => item.service)
    .map((item) => ({
      _id: item._id,
      providerServiceId: item._id,
      service: item.service,
      price: item.price,
      description: item.description,
      duration: item.duration,
      isActive: item.isActive,
      bookingCount: item.bookingCount,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

  // ---------------------------------------------------
  // GET UNIQUE CATEGORIES
  // Categories come from Service.category
  // ---------------------------------------------------

  const categories = [
    ...new Set(services.map((item) => item.service?.category).filter(Boolean)),
  ];

  // ---------------------------------------------------
  // RETURN COMPLETE PROVIDER
  // ---------------------------------------------------

  return {
    ...provider,

    // Provider schema fields
    phone: provider.phone || provider.user?.phone || "",

    address: provider.address || provider.user?.address || "",

    city: provider.city || provider.user?.city || "",

    state: provider.state || provider.user?.state || "",

    // -------------------------------------------------
    // IMPORTANT
    // Provider schema does NOT have isActive.
    // User schema has isActive.
    // -------------------------------------------------

    isActive:
      typeof provider.user?.isActive === "boolean"
        ? provider.user.isActive
        : true,

    // -------------------------------------------------
    // SERVICES
    // -------------------------------------------------

    services,
    providerServices: services,

    // -------------------------------------------------
    // CATEGORIES
    // -------------------------------------------------

    categories,

    // Frontend-friendly category field
    category: categories.length > 0 ? categories.join(", ") : "No category",
  };
};

// =====================================================
// GET ALL PROVIDERS
// =====================================================

// =====================================================
// GET ALL PROVIDERS
// =====================================================

const getAllProviders = async (req, res) => {
  try {
    const pagination = getPagination(req.query, 10, 100);

    // Fetch total count and current page in parallel
    const [total, providers] = await Promise.all([
      Provider.countDocuments(),

      Provider.find()
        .sort({ createdAt: -1, _id: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
    ]);

    // Fetch services only for providers on the current page
    const providerIds = providers.map((provider) => provider._id);

    const providerServices = providerIds.length
      ? await ProviderService.find({
          provider: { $in: providerIds },
        })
          .populate(
            "service",
            "name description category image price duration isActive",
          )
          .sort({ createdAt: -1, _id: -1 })
          .lean()
      : [];

    // Group services by provider
    const servicesByProvider = {};

    providerServices.forEach((item) => {
      if (!item.provider) return;

      const providerId = item.provider.toString();

      if (!servicesByProvider[providerId]) {
        servicesByProvider[providerId] = [];
      }

      if (item.service) {
        servicesByProvider[providerId].push({
          _id: item._id,
          providerServiceId: item._id,
          service: item.service,
          price: item.price,
          description: item.description,
          duration: item.duration,
          isActive: item.isActive,
          bookingCount: item.bookingCount,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      }
    });

    // Format providers
    const formattedProviders = providers.map((provider) => {
      const providerId = provider._id.toString();
      const services = servicesByProvider[providerId] || [];

      const categories = [
        ...new Set(
          services.map((item) => item.service?.category).filter(Boolean),
        ),
      ];

      const address =
        typeof provider.address === "string"
          ? provider.address
          : [
              provider.address?.street,
              provider.address?.city,
              provider.address?.state,
              provider.address?.pincode,
            ]
              .filter(Boolean)
              .join(", ");

      const location = [
        address,
        provider.city,
        provider.state,
        provider.pincode,
      ]
        .filter(Boolean)
        .join(", ");

      const status = provider.isSuspended
        ? "Suspended"
        : provider.isActive === false
          ? "Suspended"
          : provider.isVerified
            ? "Verified"
            : "Pending";

      return {
        ...provider,

        id: providerId,

        name:
          provider.name ||
          provider.fullName ||
          provider.businessName ||
          "Unknown Provider",

        businessName: provider.businessName || "Service Provider",
        email: provider.email || "",
        phone: provider.phone || "",
        address,
        city: provider.city || "",
        state: provider.state || "",
        pincode: provider.pincode || "",
        location: location || "Location not available",

        services,
        providerServices: services,
        categories,
        category: categories.length > 0 ? categories.join(", ") : "No category",

        status,
      };
    });

    return res.status(200).json({
      success: true,
      count: total,
      providers: formattedProviders,
      pagination: getPaginationMeta(total, pagination),
    });
  } catch (error) {
    console.error("Get All Providers Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching providers",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};
// =====================================================
// GET PROVIDER BY ID
// =====================================================

const getAdminProviderById = async (req, res) => {
  try {
    const { id } = req.params;

    // ---------------------------------------------------
    // VALIDATE ID
    // ---------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });
    }

    // ---------------------------------------------------
    // GET PROVIDER
    // ---------------------------------------------------

    const provider = await getProviderWithServices(id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    return res.status(200).json({
      success: true,
      provider,
    });
  } catch (error) {
    console.error("Get Admin Provider Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching provider",
      error: error.message,
    });
  }
};

// =====================================================
// VERIFY PROVIDER
// =====================================================

const verifyProvider = async (req, res) => {
  try {
    const { id } = req.params;

    // ---------------------------------------------------
    // VALIDATE ID
    // ---------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });
    }

    // ---------------------------------------------------
    // FIND PROVIDER
    // ---------------------------------------------------

    const provider = await Provider.findById(id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // ---------------------------------------------------
    // VERIFY PROVIDER PROFILE
    // ---------------------------------------------------

    provider.isVerified = true;

    await provider.save();

    // ---------------------------------------------------
    // VERIFY + ACTIVATE LINKED USER
    // ---------------------------------------------------

    if (provider.user) {
      await User.findByIdAndUpdate(
        provider.user,
        {
          isVerified: true,
          isActive: true,
        },
        {
          new: true,
        },
      );
    }

    // ---------------------------------------------------
    // GET UPDATED PROVIDER
    // ---------------------------------------------------

    const updatedProvider = await getProviderWithServices(id);

    return res.status(200).json({
      success: true,
      message: "Provider verified successfully",
      provider: updatedProvider,
    });
  } catch (error) {
    console.error("Verify Provider Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while verifying provider",
      error: error.message,
    });
  }
};

// =====================================================
// REJECT PROVIDER
// =====================================================

const rejectProvider = async (req, res) => {
  try {
    const { id } = req.params;

    // ---------------------------------------------------
    // VALIDATE ID
    // ---------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });
    }

    // ---------------------------------------------------
    // FIND PROVIDER
    // ---------------------------------------------------

    const provider = await Provider.findById(id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // ---------------------------------------------------
    // REMOVE VERIFICATION
    // ---------------------------------------------------

    provider.isVerified = false;

    await provider.save();

    // ---------------------------------------------------
    // UPDATE LINKED USER
    // ---------------------------------------------------

    if (provider.user) {
      await User.findByIdAndUpdate(
        provider.user,
        {
          isVerified: false,
        },
        {
          new: true,
        },
      );
    }

    // ---------------------------------------------------
    // GET UPDATED PROVIDER
    // ---------------------------------------------------

    const updatedProvider = await getProviderWithServices(id);

    return res.status(200).json({
      success: true,
      message: "Provider verification rejected successfully",
      provider: updatedProvider,
    });
  } catch (error) {
    console.error("Reject Provider Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while rejecting provider",
      error: error.message,
    });
  }
};

// =====================================================
// SUSPEND PROVIDER
// =====================================================

const suspendProvider = async (req, res) => {
  try {
    const { id } = req.params;

    // ---------------------------------------------------
    // VALIDATE ID
    // ---------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });
    }

    // ---------------------------------------------------
    // FIND PROVIDER
    // ---------------------------------------------------

    const provider = await Provider.findById(id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // ---------------------------------------------------
    // PROVIDER BECOMES UNAVAILABLE
    // ---------------------------------------------------

    provider.isAvailable = false;

    await provider.save();

    // ---------------------------------------------------
    // DEACTIVATE LINKED USER ACCOUNT
    // ---------------------------------------------------

    if (provider.user) {
      await User.findByIdAndUpdate(
        provider.user,
        {
          isActive: false,
        },
        {
          new: true,
        },
      );
    }

    // ---------------------------------------------------
    // GET UPDATED PROVIDER
    // ---------------------------------------------------

    const updatedProvider = await getProviderWithServices(id);

    return res.status(200).json({
      success: true,
      message: "Provider suspended successfully",
      provider: updatedProvider,
    });
  } catch (error) {
    console.error("Suspend Provider Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while suspending provider",
      error: error.message,
    });
  }
};

// =====================================================
// ACTIVATE PROVIDER
// =====================================================

const activateProvider = async (req, res) => {
  try {
    const { id } = req.params;

    // ---------------------------------------------------
    // VALIDATE ID
    // ---------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });
    }

    // ---------------------------------------------------
    // FIND PROVIDER
    // ---------------------------------------------------

    const provider = await Provider.findById(id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // ---------------------------------------------------
    // PROVIDER BECOMES AVAILABLE
    // ---------------------------------------------------

    provider.isAvailable = true;

    await provider.save();

    // ---------------------------------------------------
    // ACTIVATE LINKED USER ACCOUNT
    // ---------------------------------------------------

    if (provider.user) {
      await User.findByIdAndUpdate(
        provider.user,
        {
          isActive: true,
        },
        {
          new: true,
        },
      );
    }

    // ---------------------------------------------------
    // GET UPDATED PROVIDER
    // ---------------------------------------------------

    const updatedProvider = await getProviderWithServices(id);

    return res.status(200).json({
      success: true,
      message: "Provider activated successfully",
      provider: updatedProvider,
    });
  } catch (error) {
    console.error("Activate Provider Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while activating provider",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL USERS
// =====================================================

// =====================================================
// GET ALL USERS
// =====================================================

const getAllUsers = async (req, res) => {
  try {
    const pagination = getPagination(req.query, 10, 100);

    // Fetch total count and current page in parallel
    const [total, users] = await Promise.all([
      User.countDocuments(),

      User.find()
        .select("-password")
        .sort({ createdAt: -1, _id: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      count: total,
      users,
      pagination: getPaginationMeta(total, pagination),
    });
  } catch (error) {
    console.error("Get All Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

// =====================================================
// GET SINGLE USER
// =====================================================

const getAdminUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // ---------------------------------------------------
    // VALIDATE ID
    // ---------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ---------------------------------------------------
    // FIND USER
    // ---------------------------------------------------

    const user = await User.findById(id).select("-password").lean();

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
    console.error("Get Admin User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching user",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE USER STATUS
// =====================================================

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // ---------------------------------------------------
    // VALIDATE ID
    // ---------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ---------------------------------------------------
    // VALIDATE isActive
    // ---------------------------------------------------

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    // ---------------------------------------------------
    // FIND USER
    // ---------------------------------------------------

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ---------------------------------------------------
    // PROTECT ADMIN ACCOUNT
    // ---------------------------------------------------

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin accounts cannot be changed from Manage Users",
      });
    }

    // ---------------------------------------------------
    // UPDATE STATUS
    // ---------------------------------------------------

    user.isActive = isActive;

    await user.save();

    // ---------------------------------------------------
    // KEEP PROVIDER AVAILABILITY IN SYNC
    // ---------------------------------------------------

    if (user.role === "provider") {
      const provider = await Provider.findOne({
        user: user._id,
      });

      if (provider) {
        provider.isAvailable = isActive;

        await provider.save();
      }
    }

    // ---------------------------------------------------
    // GET UPDATED USER
    // ---------------------------------------------------

    const updatedUser = await User.findById(id).select("-password").lean();

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update User Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating user status",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE USER
// =====================================================

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // ---------------------------------------------------
    // VALIDATE ID
    // ---------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // ---------------------------------------------------
    // FIND USER
    // ---------------------------------------------------

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ---------------------------------------------------
    // PROTECT ADMIN ACCOUNT
    // ---------------------------------------------------

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin accounts cannot be deleted from Manage Users",
      });
    }

    // ---------------------------------------------------
    // DELETE PROVIDER DATA
    // ---------------------------------------------------

    if (user.role === "provider") {
      const provider = await Provider.findOneAndDelete({
        user: user._id,
      });

      // Delete provider services
      if (provider) {
        await ProviderService.deleteMany({
          provider: provider._id,
        });
      }
    }

    // ---------------------------------------------------
    // DELETE USER
    // ---------------------------------------------------

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting user",
      error: error.message,
    });
  }
};

// =====================================================
// ADMIN DASHBOARD STATISTICS
// =====================================================

const getDashboardStats = async (req, res) => {
  try {
    // =================================================
    // USERS
    // =================================================

    const totalUsers = await User.countDocuments();

    const totalCustomers = await User.countDocuments({
      role: "customer",
    });

    const totalProviderUsers = await User.countDocuments({
      role: "provider",
    });

    const totalAdmins = await User.countDocuments({
      role: "admin",
    });

    const activeUsers = await User.countDocuments({
      isActive: true,
    });

    const inactiveUsers = await User.countDocuments({
      isActive: false,
    });

    // =================================================
    // PROVIDERS
    // =================================================

    const totalProviders = await Provider.countDocuments();

    const verifiedProviders = await Provider.countDocuments({
      isVerified: true,
    });

    const pendingProviders = await Provider.countDocuments({
      isVerified: false,
    });

    const activeProviders = await Provider.countDocuments({
      isAvailable: true,
    });

    const unavailableProviders = await Provider.countDocuments({
      isAvailable: false,
    });

    // =================================================
    // SERVICES
    // =================================================

    const totalServices = await Service.countDocuments();

    const activeServices = await Service.countDocuments({
      isActive: true,
    });

    const inactiveServices = await Service.countDocuments({
      isActive: false,
    });

    // =================================================
    // BOOKINGS
    // =================================================

    const totalBookings = await Booking.countDocuments();

    const pendingBookings = await Booking.countDocuments({
      status: "pending",
    });

    const acceptedBookings = await Booking.countDocuments({
      status: "accepted",
    });

    const confirmedBookings = await Booking.countDocuments({
      status: "confirmed",
    });

    const inProgressBookings = await Booking.countDocuments({
      status: "in-progress",
    });

    const completedBookings = await Booking.countDocuments({
      status: "completed",
    });

    const cancelledBookings = await Booking.countDocuments({
      status: "cancelled",
    });

    const rejectedBookings = await Booking.countDocuments({
      status: "rejected",
    });

    // =================================================
    // REVENUE
    // =================================================

    const revenueResult = await Booking.aggregate([
      {
        $match: {
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$price",
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // =================================================
    // RECENT BOOKINGS
    // =================================================

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customer", "name email phone")
      .populate(
        "provider",
        "businessName phone city state rating totalReviews isVerified isAvailable",
      )
      .populate("service", "name category price duration");

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      stats: {
        totalUsers,
        totalCustomers,
        totalProviderUsers,
        totalAdmins,

        activeUsers,
        inactiveUsers,

        totalProviders,
        verifiedProviders,
        pendingProviders,
        activeProviders,
        unavailableProviders,

        totalServices,
        activeServices,
        inactiveServices,

        totalBookings,
        pendingBookings,
        acceptedBookings,
        confirmedBookings,
        inProgressBookings,
        completedBookings,
        cancelledBookings,
        rejectedBookings,

        totalRevenue,
      },

      recentBookings,
    });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard statistics",
      error: error.message,
    });
  }
};

// =====================================================
// ADMIN SETTINGS
// =====================================================

// =====================================================
// GET ADMIN SETTINGS
// GET /api/admin/settings
// =====================================================

const getAdminSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();

    // Create default settings automatically
    // if no settings document exists.
    if (!settings) {
      settings = await AdminSettings.create({});
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get Admin Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin settings",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE ADMIN SETTINGS
// PUT /api/admin/settings
// =====================================================

const updateAdminSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();

    // Create settings document if it doesn't exist
    if (!settings) {
      settings = new AdminSettings();
    }

    // =================================================
    // GENERAL SETTINGS
    // =================================================

    if (req.body.platformName !== undefined) {
      settings.platformName = req.body.platformName;
    }

    if (req.body.supportEmail !== undefined) {
      settings.supportEmail = req.body.supportEmail;
    }

    if (req.body.supportPhone !== undefined) {
      settings.supportPhone = req.body.supportPhone;
    }

    if (req.body.currency !== undefined) {
      settings.currency = req.body.currency;
    }

    if (req.body.timezone !== undefined) {
      settings.timezone = req.body.timezone;
    }

    if (req.body.maintenanceMode !== undefined) {
      settings.maintenanceMode = req.body.maintenanceMode;
    }

    // =================================================
    // BOOKING SETTINGS
    // =================================================

    if (req.body.autoAcceptBookings !== undefined) {
      settings.autoAcceptBookings = req.body.autoAcceptBookings;
    }

    if (req.body.allowCancellation !== undefined) {
      settings.allowCancellation = req.body.allowCancellation;
    }

    if (req.body.cancellationHours !== undefined) {
      settings.cancellationHours = req.body.cancellationHours;
    }

    if (req.body.maxAdvanceDays !== undefined) {
      settings.maxAdvanceDays = req.body.maxAdvanceDays;
    }

    if (req.body.requireProviderApproval !== undefined) {
      settings.requireProviderApproval = req.body.requireProviderApproval;
    }

    // =================================================
    // NOTIFICATION SETTINGS
    // =================================================

    if (req.body.newBooking !== undefined) {
      settings.newBooking = req.body.newBooking;
    }

    if (req.body.providerVerification !== undefined) {
      settings.providerVerification = req.body.providerVerification;
    }

    if (req.body.complaints !== undefined) {
      settings.complaints = req.body.complaints;
    }

    if (req.body.newUser !== undefined) {
      settings.newUser = req.body.newUser;
    }

    if (req.body.payment !== undefined) {
      settings.payment = req.body.payment;
    }

    if (req.body.systemAlerts !== undefined) {
      settings.systemAlerts = req.body.systemAlerts;
    }

    // =================================================
    // PAYMENT SETTINGS
    // =================================================

    if (req.body.onlinePayment !== undefined) {
      settings.onlinePayment = req.body.onlinePayment;
    }

    if (req.body.cashPayment !== undefined) {
      settings.cashPayment = req.body.cashPayment;
    }

    if (req.body.providerCommission !== undefined) {
      settings.providerCommission = req.body.providerCommission;
    }

    if (req.body.minimumBookingAmount !== undefined) {
      settings.minimumBookingAmount = req.body.minimumBookingAmount;
    }

    // =================================================
    // SECURITY SETTINGS
    // =================================================

    if (req.body.twoFactorAuth !== undefined) {
      settings.twoFactorAuth = req.body.twoFactorAuth;
    }

    if (req.body.loginAlerts !== undefined) {
      settings.loginAlerts = req.body.loginAlerts;
    }

    if (req.body.sessionTimeout !== undefined) {
      settings.sessionTimeout = req.body.sessionTimeout;
    }

    if (req.body.passwordExpiry !== undefined) {
      settings.passwordExpiry = req.body.passwordExpiry;
    }

    // =================================================
    // SAVE SETTINGS
    // =================================================

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Admin settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update Admin Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update admin settings",
      error: error.message,
    });
  }
};

// =====================================================
// CHANGE ADMIN PASSWORD
// PUT /api/admin/settings/password
// =====================================================

const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // =================================================
    // FIND LOGGED-IN ADMIN
    // =================================================

    const admin = await User.findById(req.user._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    // =================================================
    // MAKE SURE USER IS ADMIN
    // =================================================

    if (admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can change admin password",
      });
    }

    // =================================================
    // CHECK CURRENT PASSWORD
    // =================================================

    if (typeof admin.matchPassword === "function") {
      const isMatch = await admin.matchPassword(currentPassword);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
    }

    // =================================================
    // UPDATE PASSWORD
    // =================================================

    admin.password = newPassword;

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Admin Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
  // ---------------------------------------------------
  // Providers
  // ---------------------------------------------------

  getAllProviders,
  getAdminProviderById,
  verifyProvider,
  rejectProvider,
  suspendProvider,
  activateProvider,

  // ---------------------------------------------------
  // Users
  // ---------------------------------------------------

  getAllUsers,
  getAdminUserById,
  updateUserStatus,
  deleteUser,

  // ---------------------------------------------------
  // Dashboard
  // ---------------------------------------------------

  getDashboardStats,

  // ---------------------------------------------------
  // Admin Settings
  // ---------------------------------------------------

  getAdminSettings,
  updateAdminSettings,
  changeAdminPassword,
};
