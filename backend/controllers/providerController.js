const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Provider = require("../models/Provider");
const ProviderService = require("../models/ProviderService");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// =====================================================
// HELPERS
// =====================================================

const generateProviderToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: user._id,
      role: "provider",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

const isValidProviderId = (id) => mongoose.Types.ObjectId.isValid(id);

const providerUserFields =
  "name email phone role isActive isVerified profileImage address city state location";

// Public responses use explicit allow-lists.
const toPublicProvider = (provider, user, extra = {}) => ({
  _id: provider._id,
  businessName: provider.businessName,
  description: provider.description || "",
  address: [provider.city, provider.state].filter(Boolean).join(", "),
  city: provider.city,
  state: provider.state,
  experience: provider.experience ?? 0,
  profileImage: provider.profileImage || user?.profileImage || "",
  rating: provider.rating ?? 0,
  totalReviews: provider.totalReviews ?? 0,
  completedBookings: provider.completedBookings ?? 0,
  isVerified: Boolean(provider.isVerified),
  isAvailable: Boolean(provider.isAvailable),
  user: user
    ? {
        _id: user._id,
        name: user.name || "Local professional",
        profileImage: user.profileImage || "",
      }
    : null,
  ...extra,
});

const toPublicProviderService = (item) => {
  if (!item || !item.service || item.service.isActive === false) {
    return null;
  }

  return {
    _id: item._id,
    service: {
      _id: item.service._id,
      name: item.service.name,
      category: item.service.category,
      description: item.service.description || "",
      image: item.service.image || "",
      duration: item.service.duration,
    },
    price: item.price,
    description: item.description || "",
    image: item.image || item.service.image || "",
    duration: item.duration,
  };
};

const getPagination = (query, defaultLimit = 50) => {
  const pageValue = Number.parseInt(query.page, 10);
  const limitValue = Number.parseInt(query.limit, 10);

  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;

  const limit =
    Number.isInteger(limitValue) && limitValue > 0
      ? Math.min(limitValue, 100)
      : defaultLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const populateProvider = async (providerId) => {
  return Provider.findById(providerId).populate("user", providerUserFields);
};

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPincode = (pincode) =>
  /^\d{6}$/.test(String(pincode || "").trim());

// GeoJSON coordinates must be [longitude, latitude].
const getBusinessLocation = (body) => {
  let rawLat = body.latitude;
  let rawLng = body.longitude;

  if (body.location) {
    let parsedLocation = body.location;

    if (typeof parsedLocation === "string") {
      try {
        parsedLocation = JSON.parse(parsedLocation);
      } catch (error) {
        // Use latitude and longitude fields as fallback.
      }
    }

    if (
      parsedLocation &&
      Array.isArray(parsedLocation.coordinates) &&
      parsedLocation.coordinates.length === 2
    ) {
      if (rawLng === undefined || rawLng === "") {
        rawLng = parsedLocation.coordinates[0];
      }

      if (rawLat === undefined || rawLat === "") {
        rawLat = parsedLocation.coordinates[1];
      }
    }
  }

  const hasLat = rawLat !== undefined && rawLat !== "";
  const hasLng = rawLng !== undefined && rawLng !== "";

  if (!hasLat && !hasLng) return undefined;

  if (!hasLat || !hasLng) {
    throw new Error("Both latitude and longitude are required.");
  }

  const latitude = Number(rawLat);
  const longitude = Number(rawLng);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("Invalid latitude or longitude.");
  }

  return {
    type: "Point",
    coordinates: [longitude, latitude],
  };
};

const sendValidationError = (res, error, fallbackMessage) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: fallbackMessage,
      error: error.message,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists.",
    });
  }

  return null;
};

// =====================================================
// PROVIDER REGISTRATION
// POST /api/providers/register
// =====================================================

const registerProvider = async (req, res) => {
  let createdUser = null;

  try {
    const {
      name,
      email,
      phone,
      password,
      businessName,
      description,
      address,
      city,
      state,
      pincode,
      experience,
      profileImage,
    } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required.",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    if (!businessName || !address || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message:
          "Business name, address, city, state and pincode are required.",
      });
    }

    const normalizedPincode = String(pincode).trim();

    if (!isValidPincode(normalizedPincode)) {
      return res.status(400).json({
        success: false,
        message: "Pincode must contain exactly 6 digits.",
      });
    }

    const providerExperience =
      experience === undefined || experience === "" ? 0 : Number(experience);

    if (!Number.isFinite(providerExperience) || providerExperience < 0) {
      return res.status(400).json({
        success: false,
        message: "Experience must be a valid non-negative number.",
      });
    }

    let location;

    try {
      location = getBusinessLocation(req.body);

      if (!location) {
        return res.status(400).json({
          success: false,
          message:
            "Business latitude and longitude are required for nearby searches.",
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    let cloudinaryImageUrl = "";

    if (req.file) {
      const cloudinaryResult = await uploadToCloudinary(
        req.file.buffer,
        "fixnear/providers",
      );

      cloudinaryImageUrl = cloudinaryResult.secure_url;
    }

    const finalProfileImage = cloudinaryImageUrl || profileImage || "";

    createdUser = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      password,
      role: "provider",
      address: String(address).trim(),
      city: String(city).trim(),
      state: String(state).trim(),
      profileImage: finalProfileImage,
      location,
      isActive: true,
      isVerified: false,
    });

    const provider = await Provider.create({
      user: createdUser._id,
      email: normalizedEmail,
      businessName: String(businessName).trim(),
      description: description ? String(description).trim() : "",
      phone: String(phone).trim(),
      address: String(address).trim(),
      city: String(city).trim(),
      state: String(state).trim(),
      pincode: normalizedPincode,
      experience: providerExperience,
      profileImage: finalProfileImage,
      location,
      isVerified: false,
      isAvailable: true,
    });

    const token = generateProviderToken(createdUser);

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Your application is pending verification.",
      token,
      user: {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        phone: createdUser.phone,
        role: createdUser.role,
        isActive: createdUser.isActive,
        isVerified: createdUser.isVerified,
      },
      provider,
    });
  } catch (error) {
    console.error("Provider Registration Error:", error);

    if (createdUser) {
      try {
        await Provider.deleteOne({ user: createdUser._id });
        await User.findByIdAndDelete(createdUser._id);
      } catch (cleanupError) {
        console.error("Registration Cleanup Error:", cleanupError);
      }
    }

    const handled = sendValidationError(
      res,
      error,
      "Please provide valid provider details.",
    );

    if (handled) return handled;

    if (
      error.message?.includes("latitude") ||
      error.message?.includes("longitude")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during provider registration.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// PROVIDER LOGIN
// POST /api/providers/login
// =====================================================

const loginProvider = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({
      email: normalizedEmail,
      role: "provider",
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
        message: "Provider account is inactive.",
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const provider = await Provider.findOne({
      user: user._id,
    }).populate("user", providerUserFields);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found.",
      });
    }

    if (provider.email !== user.email) {
      provider.email = user.email;
      await provider.save();
    }

    const token = generateProviderToken(user);

    return res.status(200).json({
      success: true,
      message: "Provider login successful.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
      },
      provider,
    });
  } catch (error) {
    console.error("Provider Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during provider login.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// =====================================================
// GET PUBLIC PROVIDERS
// GET /api/providers
// =====================================================

const getProviders = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query, 50);

    // Only active provider accounts are eligible for public listings.
    const activeUserIds = await User.distinct("_id", {
      role: "provider",
      isActive: true,
    });

    const filter = {
      user: { $in: activeUserIds },
      isVerified: true,
      isAvailable: true,
    };

    const [total, providers] = await Promise.all([
      Provider.countDocuments(filter),
      Provider.find(filter)
        .select(
          "businessName description city state experience profileImage rating totalReviews completedBookings isVerified isAvailable user createdAt",
        )
        .populate({ path: "user", select: "name profileImage" })
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const providerIds = providers.map((provider) => provider._id);

    const serviceDocs = providerIds.length
      ? await ProviderService.find({
          provider: { $in: providerIds },
          isActive: true,
        })
          .select("provider service price description image duration")
          .populate({
            path: "service",
            select: "name category description image duration isActive",
          })
          .lean()
      : [];

    const servicesByProvider = new Map();

    for (const item of serviceDocs) {
      const publicService = toPublicProviderService(item);
      if (!publicService) continue;

      const key = String(item.provider);

      if (!servicesByProvider.has(key)) {
        servicesByProvider.set(key, []);
      }

      servicesByProvider.get(key).push(publicService);
    }

    const result = providers.map((provider) =>
      toPublicProvider(provider, provider.user, {
        services: servicesByProvider.get(String(provider._id)) || [],
      }),
    );

    return res.status(200).json({
      success: true,
      count: result.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      providers: result,
    });
  } catch (error) {
    console.error("Get Providers Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch providers.",
    });
  }
};

// =====================================================
// GET NEARBY PROVIDERS
// GET /api/providers/nearby?lat=25.60&lng=85.13&radius=10
// =====================================================

const getNearbyProviders = async (req, res) => {
  try {
    const rawLat = req.query.lat;
    const rawLng = req.query.lng;
    const radius = Number(req.query.radius ?? 10);

    if (
      typeof rawLat !== "string" ||
      rawLat.trim() === "" ||
      typeof rawLng !== "string" ||
      rawLng.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer latitude and longitude are required.",
      });
    }

    const lat = Number(rawLat);
    const lng = Number(rawLng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180 ||
      !Number.isFinite(radius) ||
      ![5, 10, 20, 50].includes(radius)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates or radius. Choose 5, 10, 20, or 50 km.",
      });
    }

    const { page, limit, skip } = getPagination(req.query, 50);

    const activeUserIds = await User.distinct("_id", {
      role: "provider",
      isActive: true,
    });

    const nearbyQuery = {
      user: { $in: activeUserIds },
      isVerified: true,
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: radius * 1000,
        },
      },
    };

    // Fetch one extra record to determine whether another page exists.
    const providers = await Provider.find(nearbyQuery)
      .select(
        "businessName description city state experience profileImage rating totalReviews completedBookings isVerified isAvailable user location createdAt",
      )
      .skip(skip)
      .limit(limit + 1)
      .lean();

    const hasMore = providers.length > limit;
    const pageProviders = providers.slice(0, limit);

    const providerIds = pageProviders.map((provider) => provider._id);
    const userIds = pageProviders.map((provider) => provider.user);

    const [users, serviceDocs] = await Promise.all([
      userIds.length
        ? User.find({
            _id: { $in: userIds },
            isActive: true,
          })
            .select("name profileImage")
            .lean()
        : [],
      providerIds.length
        ? ProviderService.find({
            provider: { $in: providerIds },
            isActive: true,
          })
            .select("provider service price description image duration")
            .populate({
              path: "service",
              select: "name category description image duration isActive",
            })
            .lean()
        : [],
    ]);

    const usersById = new Map(users.map((user) => [String(user._id), user]));

    const servicesByProvider = new Map();

    for (const item of serviceDocs) {
      const publicService = toPublicProviderService(item);
      if (!publicService) continue;

      const key = String(item.provider);

      if (!servicesByProvider.has(key)) {
        servicesByProvider.set(key, []);
      }

      servicesByProvider.get(key).push(publicService);
    }

    const nearbyProviders = pageProviders
      .map((provider) => {
        const user = usersById.get(String(provider.user));
        const coordinates = provider.location?.coordinates;

        if (!user || !Array.isArray(coordinates) || coordinates.length !== 2) {
          return null;
        }

        const services = servicesByProvider.get(String(provider._id)) || [];

        if (services.length === 0) return null;

        const distanceKm = calculateDistanceKm(
          lat,
          lng,
          Number(coordinates[1]),
          Number(coordinates[0]),
        );

        return toPublicProvider(provider, user, {
          distanceKm: Number(distanceKm.toFixed(2)),
          services,
        });
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      radiusKm: radius,
      count: nearbyProviders.length,
      page,
      limit,
      hasMore,
      providers: nearbyProviders,
    });
  } catch (error) {
    console.error("Get Nearby Providers Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch nearby providers and services.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// GET PROVIDER BY ID (PUBLIC, VERIFIED PROVIDERS ONLY)
// GET /api/providers/:id
// =====================================================

const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidProviderId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID.",
      });
    }

    const provider = await Provider.findOne({
      _id: id,
      isVerified: true,
      isAvailable: true,
    })
      .select(
        "businessName description city state experience profileImage rating totalReviews completedBookings isVerified isAvailable user createdAt",
      )
      .lean();

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found.",
      });
    }

    const user = await User.findOne({
      _id: provider.user,
      role: "provider",
      isActive: true,
    })
      .select("name profileImage")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Provider not found.",
      });
    }

    const serviceDocs = await ProviderService.find({
      provider: provider._id,
      isActive: true,
    })
      .select("provider service price description image duration")
      .populate({
        path: "service",
        select: "name category description image duration isActive",
      })
      .lean();

    const services = serviceDocs.map(toPublicProviderService).filter(Boolean);

    return res.status(200).json({
      success: true,
      provider: toPublicProvider(provider, user, { services }),
    });
  } catch (error) {
    console.error("Get Provider By ID Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch provider.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// GET MY PROVIDER PROFILE
// =====================================================

const getMyProviderProfile = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const provider = await Provider.findOne({
      user: req.user._id,
    }).populate("user", providerUserFields);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      provider,
    });
  } catch (error) {
    console.error("Get My Provider Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch provider profile.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// CREATE PROVIDER PROFILE
// =====================================================

const createProvider = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Linked user account not found.",
      });
    }

    if (user.role !== "provider") {
      return res.status(403).json({
        success: false,
        message: "Only provider accounts can create a provider profile.",
      });
    }

    const existingProvider = await Provider.findOne({
      user: user._id,
    });

    if (existingProvider) {
      return res.status(409).json({
        success: false,
        message: "Provider profile already exists.",
      });
    }

    const {
      businessName,
      description,
      phone,
      address,
      city,
      state,
      pincode,
      experience,
      profileImage,
    } = req.body;

    if (!businessName || !phone || !address || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message:
          "Business name, phone, address, city, state and pincode are required.",
      });
    }

    const normalizedEmail = normalizeEmail(user.email);

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "The linked user account must have a valid email.",
      });
    }

    const normalizedPincode = String(pincode).trim();

    if (!isValidPincode(normalizedPincode)) {
      return res.status(400).json({
        success: false,
        message: "Pincode must contain exactly 6 digits.",
      });
    }

    const providerExperience =
      experience === undefined || experience === "" ? 0 : Number(experience);

    if (!Number.isFinite(providerExperience) || providerExperience < 0) {
      return res.status(400).json({
        success: false,
        message: "Experience must be a valid non-negative number.",
      });
    }

    let location;

    try {
      location = getBusinessLocation(req.body);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (!location) {
      return res.status(400).json({
        success: false,
        message: "Business latitude and longitude are required.",
      });
    }

    let cloudinaryImageUrl = "";

    if (req.file) {
      const cloudinaryResult = await uploadToCloudinary(
        req.file.buffer,
        "fixnear/providers",
      );

      cloudinaryImageUrl = cloudinaryResult.secure_url;
    }

    const provider = await Provider.create({
      user: user._id,
      email: normalizedEmail,
      businessName: String(businessName).trim(),
      description: description ? String(description).trim() : "",
      phone: String(phone).trim(),
      address: String(address).trim(),
      city: String(city).trim(),
      state: String(state).trim(),
      pincode: normalizedPincode,
      experience: providerExperience,
      profileImage: cloudinaryImageUrl || profileImage || "",
      location,
      isVerified: false,
      isAvailable: true,
    });

    const populatedProvider = await populateProvider(provider._id);

    return res.status(201).json({
      success: true,
      message: "Provider profile created successfully.",
      provider: populatedProvider,
    });
  } catch (error) {
    console.error("Create Provider Error:", error);

    const handled = sendValidationError(
      res,
      error,
      "Invalid provider details.",
    );

    if (handled) return handled;

    return res.status(500).json({
      success: false,
      message: "Failed to create provider profile.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// =====================================================
// UPDATE MY PROVIDER PROFILE
// =====================================================

const updateMyProviderProfile = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const provider = await Provider.findOne({
      user: req.user._id,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Linked user account not found.",
      });
    }

    const {
      name,
      email,
      userPhone,
      businessName,
      description,
      phone,
      address,
      city,
      state,
      pincode,
      experience,
      profileImage,
      isAvailable,
    } = req.body;

    // Update linked User information.
    if (name !== undefined) {
      const value = String(name).trim();

      if (!value) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      user.name = value;
    }

    if (userPhone !== undefined) {
      const value = String(userPhone).trim();

      if (!value) {
        return res.status(400).json({
          success: false,
          message: "Personal phone cannot be empty.",
        });
      }

      user.phone = value;
    }

    if (email !== undefined) {
      const normalizedEmail = normalizeEmail(email);

      if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address.",
        });
      }

      const emailInUse = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (emailInUse) {
        return res.status(409).json({
          success: false,
          message: "This email is already associated with another account.",
        });
      }

      user.email = normalizedEmail;
      provider.email = normalizedEmail;
    }

    // Update Provider business fields.
    if (businessName !== undefined) {
      const value = String(businessName).trim();

      if (!value) {
        return res.status(400).json({
          success: false,
          message: "Business name cannot be empty.",
        });
      }

      provider.businessName = value;
    }

    if (description !== undefined) {
      provider.description = String(description).trim();
    }

    if (phone !== undefined) {
      const value = String(phone).trim();

      if (!value) {
        return res.status(400).json({
          success: false,
          message: "Business phone cannot be empty.",
        });
      }

      provider.phone = value;
    }

    if (address !== undefined) {
      const value = String(address).trim();

      if (!value) {
        return res.status(400).json({
          success: false,
          message: "Address cannot be empty.",
        });
      }

      provider.address = value;
      user.address = value;
    }

    if (city !== undefined) {
      const value = String(city).trim();

      if (!value) {
        return res.status(400).json({
          success: false,
          message: "City cannot be empty.",
        });
      }

      provider.city = value;
      user.city = value;
    }

    if (state !== undefined) {
      const value = String(state).trim();

      if (!value) {
        return res.status(400).json({
          success: false,
          message: "State cannot be empty.",
        });
      }

      provider.state = value;
      user.state = value;
    }

    if (pincode !== undefined) {
      const normalizedPincode = String(pincode).trim();

      if (!isValidPincode(normalizedPincode)) {
        return res.status(400).json({
          success: false,
          message: "Pincode must contain exactly 6 digits.",
        });
      }

      provider.pincode = normalizedPincode;
    }

    if (experience !== undefined) {
      const numericExperience = Number(experience);

      if (!Number.isFinite(numericExperience) || numericExperience < 0) {
        return res.status(400).json({
          success: false,
          message: "Experience must be a valid non-negative number.",
        });
      }

      provider.experience = numericExperience;
    }

    try {
      const location = getBusinessLocation(req.body);

      if (location) {
        provider.location = location;
        user.location = location;
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (req.file) {
      const cloudinaryResult = await uploadToCloudinary(
        req.file.buffer,
        "fixnear/providers",
      );

      provider.profileImage = cloudinaryResult.secure_url;
      user.profileImage = cloudinaryResult.secure_url;
    } else if (profileImage !== undefined) {
      provider.profileImage = String(profileImage).trim();
      user.profileImage = String(profileImage).trim();
    }

    if (isAvailable !== undefined) {
      if (
        isAvailable === true ||
        isAvailable === "true" ||
        isAvailable === 1 ||
        isAvailable === "1"
      ) {
        provider.isAvailable = true;
      } else if (
        isAvailable === false ||
        isAvailable === "false" ||
        isAvailable === 0 ||
        isAvailable === "0"
      ) {
        provider.isAvailable = false;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid availability value.",
        });
      }
    }

    await Promise.all([user.validate(), provider.validate()]);

    await user.save();
    await provider.save();

    const updatedProvider = await populateProvider(provider._id);

    return res.status(200).json({
      success: true,
      message: "Provider profile updated successfully.",
      provider: updatedProvider,
    });
  } catch (error) {
    console.error("Update Provider Profile Error:", error);

    const handled = sendValidationError(
      res,
      error,
      "Invalid provider information.",
    );

    if (handled) return handled;

    return res.status(500).json({
      success: false,
      message: "Failed to update provider profile.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// GET MY WORKING HOURS
// =====================================================

const getMyWorkingHours = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const provider = await Provider.findOne({
      user: req.user._id,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Working hours fetched successfully.",
      workingHours: provider.workingHours,
    });
  } catch (error) {
    console.error("Get Working Hours Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch working hours.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// UPDATE MY WORKING HOURS
// =====================================================

const updateMyWorkingHours = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const provider = await Provider.findOne({
      user: req.user._id,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found.",
      });
    }

    const { workingHours } = req.body;

    if (
      !workingHours ||
      typeof workingHours !== "object" ||
      Array.isArray(workingHours)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid working hours.",
      });
    }

    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;

    for (const day of days) {
      const dayData = workingHours[day];

      if (dayData === undefined) continue;

      if (!dayData || typeof dayData !== "object" || Array.isArray(dayData)) {
        return res.status(400).json({
          success: false,
          message: `Invalid working hours for ${day}.`,
        });
      }

      if (dayData.enabled !== undefined) {
        if (
          dayData.enabled === true ||
          dayData.enabled === "true" ||
          dayData.enabled === 1 ||
          dayData.enabled === "1"
        ) {
          provider.workingHours[day].enabled = true;
        } else if (
          dayData.enabled === false ||
          dayData.enabled === "false" ||
          dayData.enabled === 0 ||
          dayData.enabled === "0"
        ) {
          provider.workingHours[day].enabled = false;
        } else {
          return res.status(400).json({
            success: false,
            message: `Invalid enabled value for ${day}.`,
          });
        }
      }

      for (const field of ["start", "end"]) {
        if (dayData[field] !== undefined) {
          const value = String(dayData[field]);

          if (!validTime.test(value)) {
            return res.status(400).json({
              success: false,
              message: `Invalid ${field} time for ${day}.`,
            });
          }

          provider.workingHours[day][field] = value;
        }
      }
    }

    await provider.save();

    return res.status(200).json({
      success: true,
      message: "Working hours updated successfully.",
      workingHours: provider.workingHours,
    });
  } catch (error) {
    console.error("Update Working Hours Error:", error);

    const handled = sendValidationError(res, error, "Invalid working hours.");

    if (handled) return handled;

    return res.status(500).json({
      success: false,
      message: "Failed to update working hours.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// =====================================================
// ADMIN - VERIFY PROVIDER
// =====================================================

const verifyProvider = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidProviderId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID.",
      });
    }

    const provider = await Provider.findById(id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found.",
      });
    }

    const user = await User.findById(provider.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Linked user account not found.",
      });
    }

    provider.isVerified = true;
    provider.isAvailable = true;
    user.isActive = true;

    await Promise.all([user.save(), provider.save()]);

    const updatedProvider = await populateProvider(provider._id);

    return res.status(200).json({
      success: true,
      message: "Provider verified successfully.",
      provider: updatedProvider,
    });
  } catch (error) {
    console.error("Verify Provider Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify provider.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// ADMIN - REJECT PROVIDER
// =====================================================

const rejectProvider = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidProviderId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID.",
      });
    }

    const provider = await Provider.findById(id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found.",
      });
    }

    provider.isVerified = false;
    provider.isAvailable = false;

    await provider.save();

    const updatedProvider = await populateProvider(provider._id);

    return res.status(200).json({
      success: true,
      message: "Provider application rejected.",
      provider: updatedProvider,
    });
  } catch (error) {
    console.error("Reject Provider Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject provider application.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// ADMIN - SUSPEND PROVIDER
// =====================================================

const suspendProvider = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidProviderId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID.",
      });
    }

    const provider = await Provider.findById(id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found.",
      });
    }

    const user = await User.findById(provider.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Linked user account not found.",
      });
    }

    user.isActive = false;
    provider.isAvailable = false;

    await Promise.all([user.save(), provider.save()]);

    const updatedProvider = await populateProvider(provider._id);

    return res.status(200).json({
      success: true,
      message: "Provider suspended successfully.",
      provider: updatedProvider,
    });
  } catch (error) {
    console.error("Suspend Provider Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to suspend provider.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// ADMIN - ACTIVATE PROVIDER
// =====================================================

const activateProvider = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidProviderId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID.",
      });
    }

    const provider = await Provider.findById(id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found.",
      });
    }

    const user = await User.findById(provider.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Linked user account not found.",
      });
    }

    user.isActive = true;
    provider.isAvailable = Boolean(provider.isVerified);

    await Promise.all([user.save(), provider.save()]);

    const updatedProvider = await populateProvider(provider._id);

    return res.status(200).json({
      success: true,
      message: "Provider account activated successfully.",
      provider: updatedProvider,
    });
  } catch (error) {
    console.error("Activate Provider Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to activate provider.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// PROVIDER - DELETE MY ACCOUNT
// =====================================================

const deleteMyProviderAccount = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "provider") {
      return res.status(403).json({
        success: false,
        message: "Only provider accounts can use this endpoint.",
      });
    }

    const userId = req.user._id;

    const provider = await Provider.findOne({
      user: userId,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider profile not found.",
      });
    }

    const user = await User.findOne({
      _id: userId,
      role: "provider",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Linked provider account not found.",
      });
    }

    await ProviderService.deleteMany({
      provider: provider._id,
    });

    await Provider.deleteOne({
      _id: provider._id,
      user: userId,
    });

    await User.deleteOne({
      _id: userId,
      role: "provider",
    });

    return res.status(200).json({
      success: true,
      message: "Provider account deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Provider Account Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete provider account.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  registerProvider,
  loginProvider,

  // Public APIs
  getProviders,
  getNearbyProviders,
  getProviderById,

  // Provider profile
  createProvider,
  getMyProviderProfile,
  updateMyProviderProfile,

  // Working hours
  getMyWorkingHours,
  updateMyWorkingHours,

  // Admin provider management
  verifyProvider,
  rejectProvider,
  suspendProvider,
  activateProvider,

  // Account deletion
  deleteMyProviderAccount,
};
