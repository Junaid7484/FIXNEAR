const express = require("express");

const {
  createReview,
  getProviderReviews,
  getMyReviews,
  deleteReview,
} = require("../controllers/reviewController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CUSTOMER CREATE REVIEW
|--------------------------------------------------------------------------
| POST /api/reviews
*/

router.post("/", protect, authorize("customer"), createReview);

/*
|--------------------------------------------------------------------------
| GET PROVIDER REVIEWS
|--------------------------------------------------------------------------
| GET /api/reviews/provider/:providerId
|
| Public route
*/

router.get("/provider/:providerId", getProviderReviews);

/*
|--------------------------------------------------------------------------
| GET LOGGED-IN CUSTOMER REVIEWS
|--------------------------------------------------------------------------
| GET /api/reviews/my
*/

router.get("/my", protect, authorize("customer"), getMyReviews);

/*
|--------------------------------------------------------------------------
| DELETE CUSTOMER REVIEW
|--------------------------------------------------------------------------
| DELETE /api/reviews/:id
*/

router.delete("/:id", protect, authorize("customer"), deleteReview);

module.exports = router;
