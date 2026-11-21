const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
function legacyEmail(name) {
  const slug =
    String(name)
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "user";
  const hash = crypto
    .createHash("sha256")
    .update(String(name))
    .digest("hex")
    .slice(0, 10);
  return `legacy-${slug}-${hash}@legacy.invalid`;
}
exports.up = async function (knex) {
  await knex.schema.createTable("users", (t) => {
    t.increments("id").primary();
    t.string("email", 254).notNullable().unique("users_email_unique");
    t.string("password_hash", 100).notNullable();
    t.string("role", 20).notNullable().defaultTo("USER");
    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.check("role IN ('USER','ADMIN')", [], "users_role_check");
  });
  await knex.schema.alterTable("reservations", (t) => {
    t.integer("user_id").nullable();
    t.foreign("user_id", "reservations_user_id_foreign")
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");
  });
  const placeholderHash = await bcrypt.hash(
    crypto.randomBytes(48).toString("hex"),
    12,
  );
  const names = await knex("reservations")
    .distinct("reserved_by")
    .whereNotNull("reserved_by");
  for (const { reserved_by: name } of names) {
    const email = legacyEmail(name);
    await knex("users")
      .insert({ email, password_hash: placeholderHash, role: "USER" })
      .onConflict("email")
      .ignore();
    const user = await knex("users").select("id").where({ email }).first();
    await knex("reservations")
      .where({ reserved_by: name })
      .update({ user_id: user.id });
  }
  await knex.raw("ALTER TABLE reservations ALTER COLUMN user_id SET NOT NULL");
  await knex.schema.alterTable("reservations", (t) =>
    t.dropColumn("reserved_by"),
  );
};
exports.down = async function (knex) {
  await knex.schema.alterTable("reservations", (t) =>
    t.string("reserved_by", 100).nullable(),
  );
  await knex.raw(
    "UPDATE reservations AS r SET reserved_by=u.email FROM users AS u WHERE u.id=r.user_id",
  );
  await knex.schema.alterTable("reservations", (t) => {
    t.dropForeign("user_id", "reservations_user_id_foreign");
    t.dropColumn("user_id");
    t.string("reserved_by", 100).notNullable().alter();
  });
  await knex.schema.dropTableIfExists("users");
};
