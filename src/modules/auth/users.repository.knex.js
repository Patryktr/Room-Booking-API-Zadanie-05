function fromRow(r) {
  return r
    ? {
        id: Number(r.id),
        email: r.email,
        passwordHash: r.password_hash,
        role: r.role,
        createdAt: r.created_at,
      }
    : null;
}
function createUsersRepository(db) {
  return {
    async findByEmail(email) {
      return fromRow(
        await db("users").where({ email: email.toLowerCase() }).first(),
      );
    },
    async findById(id) {
      return fromRow(await db("users").where({ id }).first());
    },
    async create({ email, passwordHash, role = "USER" }) {
      const [r] = await db("users")
        .insert({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          role,
        })
        .returning(["id", "email", "password_hash", "role", "created_at"]);
      return fromRow(r);
    },
  };
}
module.exports = { createUsersRepository, fromRow };
