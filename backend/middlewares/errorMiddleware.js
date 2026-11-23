function errorMiddleware(error, request, response, next) {
  // If response headers have already been sent, delegate to default Express error handler
  if (response.headersSent) {
    return next(error);
  }

  // Handle MySQL duplicate entry error
  if (error.code === "ER_DUP_ENTRY") {
    return response.status(409).jsend.error({
      code: 409,
      message: "Duplicate entry: a resource with these details already exists.",
    });
  }

  // Handle Multer upload errors
  if (error.name === "MulterError") {
    if (error.code === "LIMIT_FILE_SIZE") {
      return response.status(400).jsend.error({
        code: 400,
        message: "File size exceeds the allowed limit (maximum 5MB).",
      });
    }
    return response.status(400).jsend.error({
      code: 400,
      message: error.message || "File upload error.",
    });
  }

  console.error("Unhandled error:", error);

  const statusCode = error.statusCode || error.status || 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error."
      : error.message || "Internal server error.";

  return response.status(statusCode).jsend.error({
    code: statusCode,
    message,
  });
}

module.exports = errorMiddleware;
