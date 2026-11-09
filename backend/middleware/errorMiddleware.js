const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || err.status || res.statusCode || 500;

  if (statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  let message = "Something went wrong. Please try again.";

  // MongoDB duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    message = "This record already exists.";
  }

  // Mongoose validation
  else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Please provide valid information.";
  }

  // Invalid MongoDB ObjectId
  else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier.";
  }

  // Invalid JSON
  else if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON request body.";
  }

  // Explicit client errors
  else if (statusCode >= 400 && statusCode < 500) {
    message = err.message || "Invalid request.";
  }

  // Log safe diagnostic information only.
  console.error("API Error:", {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    errorName: err.name || "Error",
    message: err.message || "Unknown error",
  });

  const response = {
    success: false,
    message,
  };

  // Additional diagnostic information only in development.
  if (process.env.NODE_ENV === "development") {
    response.error = err.name || "Error";
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
