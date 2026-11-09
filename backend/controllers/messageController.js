const mongoose = require("mongoose");
const Message = require("../models/Message");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// Resolve the customer and provider's USER account IDs.
const getBookingParticipants = async (bookingId, currentUserId) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return { error: "Invalid booking ID", status: 400 };
  }

  const booking = await Booking.findById(bookingId)
    .select("customer provider")
    .lean();

  if (!booking) {
    return { error: "Booking not found", status: 404 };
  }

  const provider = await Provider.findById(booking.provider)
    .select("user")
    .lean();

  if (!provider || !provider.user) {
    return { error: "Provider account not found", status: 404 };
  }

  const customerId = String(booking.customer);
  const providerUserId = String(provider.user);
  const userId = String(currentUserId);

  if (userId !== customerId && userId !== providerUserId) {
    return {
      error: "You cannot access this conversation",
      status: 403,
    };
  }

  return {
    booking,
    customerId,
    providerUserId,
    userId,
    otherUserId: userId === customerId ? providerUserId : customerId,
  };
};

// GET /api/bookings/:bookingId/messages
// Default: latest messages.
// ?before=messageId loads older messages.
// ?after=messageId loads newer messages.
exports.getMessages = async (req, res) => {
  try {
    const participants = await getBookingParticipants(
      req.params.bookingId,
      req.user._id,
    );

    if (participants.error) {
      return res.status(participants.status).json({
        success: false,
        message: participants.error,
      });
    }

    const { before, after } = req.query;

    if (before && after) {
      return res.status(400).json({
        success: false,
        message: "Use either before or after, not both",
      });
    }

    for (const cursor of [before, after]) {
      if (cursor && !mongoose.Types.ObjectId.isValid(cursor)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message cursor",
        });
      }
    }

    const requestedLimit = Number.parseInt(req.query.limit, 10);

    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;

    // The compound index { booking: 1, _id: -1 } supports these queries.
    const filter = {
      booking: participants.booking._id,
    };

    let sort = { _id: -1 };

    if (before) {
      filter._id = {
        $lt: new mongoose.Types.ObjectId(before),
      };
    } else if (after) {
      filter._id = {
        $gt: new mongoose.Types.ObjectId(after),
      };

      sort = { _id: 1 };
    }

    const foundMessages = await Message.find(filter)
      .select("booking sender receiver message readAt createdAt updatedAt")
      .sort(sort)
      .limit(limit + 1)
      .lean();

    const hasExtra = foundMessages.length > limit;

    const pageMessages = foundMessages.slice(0, limit);

    // Return older and latest pages chronologically.
    // Newer messages are already in ascending order.
    if (!after) {
      pageMessages.reverse();
    }

    // Identify only unread messages received by the current user.
    const unreadMessages = pageMessages.filter(
      (item) => String(item.receiver) === participants.userId && !item.readAt,
    );

    // Do not call updateMany when there are no unread messages.
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((item) => item._id);

      const messageIdSet = new Set(messageIds.map(String));

      const readAt = new Date();

      // Update only unread messages from this page.
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          booking: participants.booking._id,
          receiver: participants.userId,
          readAt: null,
        },
        {
          $set: { readAt },
        },
      );

      // Update the response objects without additional database queries.
      pageMessages.forEach((item) => {
        if (messageIdSet.has(String(item._id))) {
          item.readAt = readAt;
        }
      });
    }

    return res.status(200).json({
      success: true,
      messages: pageMessages,
      pagination: {
        limit,
        hasMore: after ? false : hasExtra,
        oldestMessageId: pageMessages[0]?._id || null,
        newestMessageId: pageMessages[pageMessages.length - 1]?._id || null,
      },
    });
  } catch (error) {
    console.error("Get booking messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load messages",
    });
  }
};

// POST /api/bookings/:bookingId/messages
exports.sendMessage = async (req, res) => {
  try {
    const participants = await getBookingParticipants(
      req.params.bookingId,
      req.user._id,
    );

    if (participants.error) {
      return res.status(participants.status).json({
        success: false,
        message: participants.error,
      });
    }

    const messageText =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!messageText) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    if (messageText.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 2000 characters",
      });
    }

    const message = await Message.create({
      booking: participants.booking._id,
      sender: participants.userId,
      receiver: participants.otherUserId,
      message: messageText,
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send booking message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};
