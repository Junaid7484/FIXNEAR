const express = require("express");

const { sendContactMessage } = require("../controllers/contactController");

const router = express.Router();

// =========================================================
// CONTACT FORM
// POST /api/contact
// =========================================================
router.post("/", sendContactMessage);

module.exports = router;
