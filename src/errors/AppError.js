class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    if (details !== undefined) this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
class ValidationError extends AppError {
  constructor(details, message = "Validation failed") {
    super(400, "VALIDATION_ERROR", message, details);
  }
}
class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}
class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(403, "FORBIDDEN", message);
  }
}
class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(404, "NOT_FOUND", `${resource} not found`);
  }
}
class ConflictError extends AppError {
  constructor(message, code = "CONFLICT", details) {
    super(409, code, message, details);
  }
}
module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
