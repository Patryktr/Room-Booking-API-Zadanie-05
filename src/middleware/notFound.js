const { NotFoundError } = require("../errors/AppError");

function notFound(req, _res, next) {
  return next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
