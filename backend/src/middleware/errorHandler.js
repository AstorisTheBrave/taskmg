const { AppError } = require("../utils/errors");

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err.code === "P2002") {
    return res.status(409).json({ error: "Resource already exists" });
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

module.exports = errorHandler;
