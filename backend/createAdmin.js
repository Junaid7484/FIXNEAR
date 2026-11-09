const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

require("dotenv").config();

const createAdmin = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");

    const email = process.env.EMAIL_USER?.toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error("EMAIL_USER or ADMIN_PASSWORD missing in .env");
    }

    let user = await User.findOne({ email });

    if (user) {
      user.role = "admin";
      user.isActive = true;
      user.isVerified = true;
      user.password = password; // triggers pre('save') hook if defined
      await user.save();
      console.log("Existing account converted to ADMIN successfully.");
    } else {
      user = await User.create({
        name: "FIXNEAR Admin",
        email,
        phone: "9999999999",
        password,
        role: "admin",
        isActive: true,
        isVerified: true,
      });
      console.log("New ADMIN account created successfully.");
    }

    console.log("--------------------------------");
    console.log("Admin Email:", user.email);
    console.log("Admin Role:", user.role);
    console.log("--------------------------------");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Create Admin Error:", error);
    process.exit(1);
  }
};

createAdmin();
