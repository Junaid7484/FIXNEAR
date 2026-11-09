const express = require("express");
const router = express.Router();

const {
  reverseGeocode,
  geocodeAddress,
} = require("../controllers/locationController");

router.post("/reverse", reverseGeocode);
router.post("/geocode", geocodeAddress);

module.exports = router;
