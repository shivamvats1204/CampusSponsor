function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;

  console.error(error);
  res.status(statusCode).json({
    message: error.message || "Internal server error."
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};

