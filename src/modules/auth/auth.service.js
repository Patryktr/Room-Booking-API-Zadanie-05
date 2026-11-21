const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ConflictError, UnauthorizedError } = require("../../errors/AppError");
const { toUserResponse } = require("./users.mapper");
const DUMMY_HASH = bcrypt.hashSync("not-a-real-account-password", 10);
function createAuthService({
  usersRepository,
  jwtSecret,
  jwtExpiresIn = "15m",
}) {
  return {
    async register({ email, password }) {
      const passwordHash = await bcrypt.hash(password, 12);
      try {
        return toUserResponse(
          await usersRepository.create({
            email: email.toLowerCase(),
            passwordHash,
            role: "USER",
          }),
        );
      } catch (e) {
        if (e.code === "23505" || e.code === "EMAIL_TAKEN")
          throw new ConflictError("Email is already registered", "EMAIL_TAKEN");
        throw e;
      }
    },
    async login({ email, password }) {
      const user = await usersRepository.findByEmail(email.toLowerCase());
      const valid = await bcrypt.compare(
        password,
        user?.passwordHash ?? DUMMY_HASH,
      );
      if (!user || !valid)
        throw new UnauthorizedError("Invalid email or password");
      const accessToken = jwt.sign({ role: user.role }, jwtSecret, {
        algorithm: "HS256",
        subject: String(user.id),
        expiresIn: jwtExpiresIn,
      });
      return { accessToken, tokenType: "Bearer", expiresIn: jwtExpiresIn };
    },
  };
}
module.exports = { createAuthService };
