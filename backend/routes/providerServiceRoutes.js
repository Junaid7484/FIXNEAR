const express = require("express");

const {
  getProvidersByService,
  getPublicProviderServices,
  getMyServices,
  addProviderService,
  updateProviderService,
  deleteProviderService,
} = require("../controllers/providerServiceController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// ========================================
// PUBLIC ROUTES
// ========================================

// Get providers offering a particular service
router.get("/service/:serviceId", getProvidersByService);

// Get services offered by a particular provider
router.get("/provider/:providerId", getPublicProviderServices);

// ========================================
// PROVIDER PROTECTED ROUTES
// ========================================

// Get my services
router.get("/my", protect, authorize("provider"), getMyServices);

// Add service
router.post("/my", protect, authorize("provider"), upload.single("image"), addProviderService);

// Update service
router.put("/my/:id", protect, authorize("provider"), upload.single("image"), updateProviderService);

// Remove/deactivate service
router.delete("/my/:id", protect, authorize("provider"), deleteProviderService);

module.exports = router;
