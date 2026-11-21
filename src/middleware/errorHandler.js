const { AppError } = require("../errors/AppError");
function errorHandler(err, req, res, _next) {
  if (err?.type === "entity.parse.failed")
    return res
      .status(400)
      .json({
        error: {
          code: "INVALID_JSON",
          message: "Request body is not valid JSON",
          requestId: req.id,
        },
      });
  if (err?.code === "23P01")
    return res
      .status(409)
      .json({
        error: {
          code: "ROOM_ALREADY_BOOKED",
          message: "Room already has a reservation during this time",
          requestId: req.id,
        },
      });
  if (err?.code === "23505")
    return res
      .status(409)
      .json({
        error: {
          code: "UNIQUE_VIOLATION",
          message: "A resource with these values already exists",
          requestId: req.id,
        },
      });
  if (err?.code === "23503")
    return res
      .status(409)
      .json({
        error: {
          code: "FOREIGN_KEY_VIOLATION",
          message: "The resource is referenced by another record",
          requestId: req.id,
        },
      });
  if (err?.code === "23514")
    return res
      .status(400)
      .json({
        error: {
          code: "CHECK_VIOLATION",
          message: "The submitted values violate a data rule",
          requestId: req.id,
        },
      });
  if (err instanceof AppError) {
    const error = { code: err.code, message: err.message };
    if (err.details !== undefined) error.details = err.details;
    error.requestId = req.id;
    return res.status(err.statusCode).json({ error });
  }
  console.error(`[${req.id}] Unexpected error`, err?.stack || err);
  return res
    .status(500)
    .json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected error",
        requestId: req.id,
      },
    });
}
module.exports = errorHandler;
