const Notification = require("../models/Notification");

const createNotification = async ({
  user,
  title,
  message,
  type = "system",
  booking = null,
}) => {
  try {
    if (!user) {
      return null;
    }

    return await Notification.create({
      user,
      title,
      message,
      type,
      booking,
    });
  } catch (error) {
    console.error("Create Notification Error:", error);
    return null;
  }
};

module.exports = {
  createNotification,
};
