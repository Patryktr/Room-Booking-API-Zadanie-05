const { toUserResponse } = require("./users.mapper");
const { NotFoundError } = require("../../errors/AppError");
function createAuthController({ authService, usersRepository }) {
  return {
    async register(req, res) {
      return res
        .status(201)
        .json(await authService.register(req.validated.body));
    },
    async login(req, res) {
      return res.json(await authService.login(req.validated.body));
    },
    async me(req, res) {
      const u = await usersRepository.findById(req.user.id);
      if (!u) throw new NotFoundError("User");
      return res.json(toUserResponse(u));
    },
  };
}
module.exports = { createAuthController };
