const path = require("path");
const dotenv = require("dotenv");

// =====================================================
// LOAD ENVIRONMENT VARIABLES FIRST
// =====================================================

const envPath = path.join(__dirname, ".env");
const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.error("Backend environment configuration could not be loaded.");
} else {
  console.log("Backend environment configuration loaded.");
}

// Never print actual environment variable values.
console.log("Environment configuration:", {
  JWT_SECRET: Boolean(process.env.JWT_SECRET),
  RAZORPAY_KEY_ID: Boolean(process.env.RAZORPAY_KEY_ID),
  RAZORPAY_KEY_SECRET: Boolean(process.env.RAZORPAY_KEY_SECRET),
});

// =====================================================
// IMPORTS
// =====================================================

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const connectDB = require("./config/db");

const { apiLimiter, authLimiter } = require("./middleware/rateLimitMiddleware");

const errorHandler = require("./middleware/errorMiddleware");

// Maintenance mode
const maintenanceModeMiddleware = require("./middleware/maintenanceModeMiddleware");
const AdminSettings = require("./models/AdminSettings");

// Routes
const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const providerRoutes = require("./routes/providerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const userRoutes = require("./routes/userRoutes");
const providerServiceRoutes = require("./routes/providerServiceRoutes");
const providerSettingsRoutes = require("./routes/providerSettingsRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const contactRoutes = require("./routes/contactRoutes");
const messageRoutes = require("./routes/messageRoutes");
const locationRoutes = require("./routes/locationRoutes");

// =====================================================
// EXPRESS APP
// =====================================================

const app = express();

app.disable("x-powered-by");

// =====================================================
// DATABASE
// =====================================================

connectDB();

// =====================================================
// HELMET SECURITY HEADERS
// =====================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

// =====================================================
// CORS
// =====================================================

// =====================================================
// CORS CONFIGURATION
// =====================================================

const allowedOrigins = [
  "https://fixnear-two.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (health checks, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// =====================================================
// REQUEST SIZE LIMITS
// =====================================================

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

// =====================================================
// RATE LIMITING
// =====================================================

// Apply general API rate limiting.
// Webhook requests are excluded so gateway retries are not
// accidentally blocked by the general API limiter.
app.use("/api", apiLimiter);

// Stricter protection for authentication endpoints.
app.use("/api/auth", authLimiter);

// =====================================================
// STATIC FILES
// =====================================================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =====================================================
// MAINTENANCE STATUS
// =====================================================

app.get("/api/maintenance-status", async (req, res, next) => {
  try {
    let settings = await AdminSettings.findOne();

    if (!settings) {
      settings = await AdminSettings.create({});
    }

    return res.status(200).json({
      success: true,
      maintenanceMode: settings.maintenanceMode,
      message: settings.maintenanceMode
        ? "FixNear is currently under maintenance."
        : "FixNear is available.",
    });
  } catch (error) {
    return next(error);
  }
});

// =====================================================
// EXISTING API ROUTES - PRESERVED
// =====================================================

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/providers/services", providerServiceRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/users", userRoutes);
app.use("/api/provider-settings", providerSettingsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api", messageRoutes);
app.use("/api/location", locationRoutes);

// =====================================================
// ROOT API
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FIXNEAR API is running",
  });
});

// =====================================================
// NOT FOUND HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

// =====================================================
// GLOBAL ERROR HANDLER - MUST BE LAST
// =====================================================

app.use(errorHandler);

// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`FIXNEAR Server running on http://localhost:${PORT}`);
});

module.exports = app;

// const path = require("path");

// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");

// const { apiLimiter, authLimiter } = require("./middleware/rateLimitMiddleware");
// const errorHandler = require("./middleware/errorMiddleware");

// const AdminSettings = require("./models/AdminSettings");

// // Routes
// const authRoutes = require("./routes/authRoutes");
// const serviceRoutes = require("./routes/serviceRoutes");
// const providerRoutes = require("./routes/providerRoutes");
// const adminRoutes = require("./routes/adminRoutes");
// const bookingRoutes = require("./routes/bookingRoutes");
// const reviewRoutes = require("./routes/reviewRoutes");
// const favoriteRoutes = require("./routes/favoriteRoutes");
// const notificationRoutes = require("./routes/notificationRoutes");
// const complaintRoutes = require("./routes/complaintRoutes");
// const userRoutes = require("./routes/userRoutes");
// const providerServiceRoutes = require("./routes/providerServiceRoutes");
// const providerSettingsRoutes = require("./routes/providerSettingsRoutes");
// const categoryRoutes = require("./routes/categoryRoutes");
// const contactRoutes = require("./routes/contactRoutes");
// const messageRoutes = require("./routes/messageRoutes");
// const locationRoutes = require("./routes/locationRoutes");

// const app = express();

// app.disable("x-powered-by");

// // Security headers
// app.use(
//   helmet({
//     crossOriginResourcePolicy: {
//       policy: "cross-origin",
//     },
//   })
// );

// // CORS
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// // Request size limits
// app.use(
//   express.json({
//     limit: "1mb",
//   })
// );

// app.use(
//   express.urlencoded({
//     extended: true,
//     limit: "1mb",
//   })
// );

// // Rate limiting
// app.use("/api", apiLimiter);
// app.use("/api/auth", authLimiter);

// // Static files
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Maintenance status
// app.get("/api/maintenance-status", async (req, res, next) => {
//   try {
//     let settings = await AdminSettings.findOne();

//     if (!settings) {
//       settings = await AdminSettings.create({});
//     }

//     return res.status(200).json({
//       success: true,
//       maintenanceMode: settings.maintenanceMode,
//       message: settings.maintenanceMode
//         ? "FixNear is currently under maintenance."
//         : "FixNear is available.",
//     });
//   } catch (error) {
//     return next(error);
//   }
// });

// // Existing API routes
// app.use("/api/auth", authRoutes);
// app.use("/api/services", serviceRoutes);
// app.use("/api/categories", categoryRoutes);
// app.use("/api/providers/services", providerServiceRoutes);
// app.use("/api/providers", providerRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/bookings", bookingRoutes);
// app.use("/api/reviews", reviewRoutes);
// app.use("/api/favorites", favoriteRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/complaints", complaintRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/provider-settings", providerSettingsRoutes);
// app.use("/api/contact", contactRoutes);
// app.use("/api", messageRoutes);
// app.use("/api/location", locationRoutes);

// // Root API
// app.get("/", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "FIXNEAR API is running",
//   });
// });

// // Not found handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "API endpoint not found.",
//   });
// });

// // Global error handler
// app.use(errorHandler);

// module.exports = app;
