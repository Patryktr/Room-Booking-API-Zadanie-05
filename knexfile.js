const config = require("./src/config");
module.exports = {
  client: "pg",
  connection: config.DATABASE_URL,
  debug: config.DEBUG.split(",").includes("knex:query"),
  pool: { min: 0, max: 10 },
  migrations: {
    directory: "./src/db/migrations",
    tableName: "knex_migrations",
  },
  seeds: { directory: "./src/db/seeds" },
};
