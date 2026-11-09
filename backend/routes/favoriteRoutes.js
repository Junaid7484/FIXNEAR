const express = require("express");

const {
  addFavorite,
  getMyFavorites,
  checkFavorite,
  removeFavorite,
} = require("../controllers/favoriteController");

const { protect } = require("../middleware/authMiddleware");

const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// ADD SERVICE + PROVIDER TO FAVORITES
// POST /favorites
// ======================================================

router.post("/", protect, authorize("customer"), addFavorite);

// ======================================================
// GET CUSTOMER'S FAVORITES
// GET /favorites/my
// ======================================================

router.get("/my", protect, authorize("customer"), getMyFavorites);

// ======================================================
// CHECK IF SERVICE IS FAVORITED
// GET /favorites/check/:providerId/:providerServiceId
// ======================================================

router.get(
  "/check/:providerId/:providerServiceId",
  protect,
  authorize("customer"),
  checkFavorite,
);

// ======================================================
// REMOVE SERVICE FROM FAVORITES
// DELETE /favorites/:providerId/:providerServiceId
// ======================================================

router.delete(
  "/:providerId/:providerServiceId",
  protect,
  authorize("customer"),
  removeFavorite,
);

module.exports = router;
