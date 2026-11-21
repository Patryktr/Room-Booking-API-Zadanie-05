const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../errors/AppError");
function authenticate(secret) {
  return (req, _res, next) => {
    const header = req.get("Authorization");
    const match =
      typeof header === "string" && header.match(/^Bearer\s+(\S+)$/i);
    if (!match) return next(new UnauthorizedError());
    try {
      const payload = jwt.verify(match[1], secret, { algorithms: ["HS256"] });
      const id = Number(payload.sub);
      if (
        !Number.isSafeInteger(id) ||
        id < 1 ||
        !["USER", "ADMIN"].includes(payload.role)
      )
        return next(new UnauthorizedError("Invalid token"));
      req.user = { id, role: payload.role };
      return next();
    } catch (error) {
      return next(
        new UnauthorizedError(
          error.name === "TokenExpiredError"
            ? "Token expired"
            : "Invalid token",
        ),
      );
    }
  };
}
module.exports = authenticate;
