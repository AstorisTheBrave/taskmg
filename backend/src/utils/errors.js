class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(404, message);
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(400, message);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

module.exports = { AppError, ForbiddenError, NotFoundError, ValidationError, UnauthorizedError };
