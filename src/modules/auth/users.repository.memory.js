const { ConflictError } = require("../../errors/AppError");
function createUsersRepository(seed = []) {
  const users = structuredClone(seed);
  let nextId = Math.max(0, ...users.map((u) => u.id)) + 1;
  return {
    async findByEmail(email) {
      return users.find((u) => u.email === email.toLowerCase()) ?? null;
    },
    async findById(id) {
      return users.find((u) => u.id === id) ?? null;
    },
    async create({ email, passwordHash, role = "USER" }) {
      email = email.toLowerCase();
      if (users.some((u) => u.email === email))
        throw new ConflictError("Email already registered", "EMAIL_TAKEN");
      const user = {
        id: nextId++,
        email,
        passwordHash,
        role,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      return user;
    },
  };
}
module.exports = { createUsersRepository };
