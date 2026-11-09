const mongoose = require("mongoose");
const Provider = require("../models/Provider");

/**
 * Executes booking operations inside a MongoDB transaction.
 *
 * Updating the provider lock document forces concurrent
 * booking transactions for the same provider to serialize.
 *
 * MongoDB must support transactions (Atlas or replica set).
 */
const withProviderBookingLock = async (providerId, callback) => {
  const session = await mongoose.startSession();

  let result;

  try {
    await session.withTransaction(
      async () => {
        const lockResult = await Provider.updateOne(
          { _id: providerId },
          { $inc: { bookingLockVersion: 1 } },
          { session },
        );

        if (lockResult.matchedCount !== 1) {
          throw new Error("Provider not found.");
        }

        result = await callback(session);
      },
      {
        readPreference: "primary",
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      },
    );

    return result;
  } finally {
    await session.endSession();
  }
};

module.exports = withProviderBookingLock;
