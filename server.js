const config = require("./src/config");
const { createApp } = require("./src/app");
const usePostgres =
  !process.argv.includes("--memory") &&
  (process.argv.includes("--postgres") || config.STORAGE === "postgres");
async function main() {
  let unitOfWork;
  if (usePostgres) {
    const db = require("./src/db/knex");
    const {
      createKnexUnitOfWork,
    } = require("./src/modules/reservations/reservations.repository.knex");
    unitOfWork = createKnexUnitOfWork(db);
    await db.raw("select 1");
    await db.migrate.latest();
    console.log("Database migrations completed");
    console.log("Storage: PostgreSQL");
  } else {
    const { createMemoryUnitOfWork } = require("./src/modules/memory.unit");
    unitOfWork = createMemoryUnitOfWork({ config });
    console.log(
      "Storage: in-memory (use npm run start:postgres for PostgreSQL)",
    );
  }
  const app = createApp({
    ...unitOfWork,
    config,
    disableAppOverlapCheck: config.DISABLE_APP_OVERLAP_CHECK === "1",
  });
  const server = app.listen(config.PORT, () => {
    console.log(`Room Booking API running at http://localhost:${config.PORT}`);
    console.log(`Swagger UI: http://localhost:${config.PORT}/api/docs`);
  });
  const shutdown = (signal) => {
    console.log(`${signal} received - starting graceful shutdown`);
    server.close(async () => {
      if (usePostgres) await require("./src/db/knex").destroy();
      console.log("HTTP server and database pool closed");
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
main().catch((e) => {
  console.error("Could not start Room Booking API", e.message);
  process.exitCode = 1;
});
