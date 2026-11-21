const { ForbiddenError, UnauthorizedError } = require("../errors/AppError");
function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!allowedRoles.includes(req.user.role))
      return next(new ForbiddenError());
    return next();
  };
}
module.exports = authorize;
