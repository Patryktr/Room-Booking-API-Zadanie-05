const bcrypt = require("bcryptjs");
const config = require("../../config");
exports.seed = async function (knex) {
  await knex.raw(
    "TRUNCATE TABLE reservations, rooms, buildings, users RESTART IDENTITY CASCADE",
  );
  const userHash = await bcrypt.hash(config.DEMO_USER_PASSWORD, 12);
  const adminHash = await bcrypt.hash(config.ADMIN_PASSWORD, 12);
  await knex("users").insert([
    { email: config.ADMIN_EMAIL, password_hash: adminHash, role: "ADMIN" },
    { email: "anna.nowak@example.com", password_hash: userHash, role: "USER" },
    {
      email: "jan.kowalski@example.com",
      password_hash: userHash,
      role: "USER",
    },
    {
      email: "maria.wisniewska@example.com",
      password_hash: userHash,
      role: "USER",
    },
    {
      email: "piotr.zielinski@example.com",
      password_hash: userHash,
      role: "USER",
    },
    { email: "ola.wojcik@example.com", password_hash: userHash, role: "USER" },
  ]);
};
