const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
  getMessages,
  sendMessage,
} = require("../controllers/messageController");

const router = express.Router();

router.get("/bookings/:bookingId/messages", protect, getMessages);

router.post("/bookings/:bookingId/messages", protect, sendMessage);

module.exports = router;
