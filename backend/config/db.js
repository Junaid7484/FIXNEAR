const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URL) {
      console.error("❌ MONGO_URL is not defined in .env");
      process.exit(1);
    }

    const connection = await mongoose.connect(process.env.MONGO_URL);

    console.log("====================================");
    console.log("✅ MongoDB Connected Successfully");
    console.log("Host:", connection.connection.host);
    console.log("Database:", connection.connection.name);
    console.log("====================================");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;


// const mongoose = require("mongoose");

// const connectDB = async () => {
//   if (!process.env.MONGO_URL) {
//     throw new Error("MONGO_URL is not defined in environment variables.");
//   }

//   const connection = await mongoose.connect(process.env.MONGO_URL);

//   console.log("====================================");
//   console.log("MongoDB Connected Successfully");
//   console.log("Host:", connection.connection.host);
//   console.log("Database:", connection.connection.name);
//   console.log("====================================");

//   return connection;
// };

// module.exports = connectDB;
