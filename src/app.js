const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openApi = require("../openapi.json");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const authenticate = require("./middleware/authenticate");
const authorize = require("./middleware/authorize");
const { createRoomsService } = require("./modules/rooms/rooms.service");
const { createRoomsController } = require("./modules/rooms/rooms.controller");
const { createRoomsRouter } = require("./modules/rooms/rooms.routes");
const {
  createBuildingsService,
} = require("./modules/buildings/buildings.service");
const {
  createBuildingsController,
} = require("./modules/buildings/buildings.controller");
const {
  createBuildingsRouter,
} = require("./modules/buildings/buildings.routes");
const {
  createReservationsService,
} = require("./modules/reservations/reservations.service");
const {
  createReservationsController,
} = require("./modules/reservations/reservations.controller");
const {
  createReservationsRouter,
} = require("./modules/reservations/reservations.routes");
const { createAuthService } = require("./modules/auth/auth.service");
const { createAuthController } = require("./modules/auth/auth.controller");
const { createAuthRouter } = require("./modules/auth/auth.routes");
const { createEventBus } = require("./events/eventBus");
const { registerEventListeners } = require("./events/listeners");
const { createAuditLogRouter } = require("./modules/audit/audit.routes");
function createApp({
  runInTransaction,
  usersRepository,
  config,
  disableAppOverlapCheck = config.DISABLE_APP_OVERLAP_CHECK === "1",
  now = () => new Date(),
  auditLogRepository,
  eventBus = createEventBus(),
}) {
  const app = express();
  app.use(requestLogger);
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApi));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApi));
  const requireAuth = authenticate(config.JWT_SECRET);
  registerEventListeners({ eventBus, auditLogRepository });
  const authService = createAuthService({
    usersRepository,
    jwtSecret: config.JWT_SECRET,
    jwtExpiresIn: config.JWT_EXPIRES_IN,
  });
  app.use(
    "/api/auth",
    express.json(),
    createAuthRouter(
      createAuthController({ authService, usersRepository }),
      requireAuth,
    ),
  );
  app.use(requireAuth);
  app.use(express.json());
  const roomsService = createRoomsService({ runInTransaction }),
    buildingsService = createBuildingsService({ runInTransaction }),
    reservationsService = createReservationsService({
      runInTransaction,
      now,
      disableAppOverlapCheck,
      eventBus,
    });
  app.use(
    "/api/buildings",
    createBuildingsRouter(
      createBuildingsController(buildingsService),
      authorize,
    ),
  );
  app.use(
    "/api/rooms",
    createRoomsRouter(createRoomsController(roomsService), authorize),
  );
  app.use(
    "/api/reservations",
    createReservationsRouter(createReservationsController(reservationsService)),
  );
  app.use(
    "/api/admin/audit-log",
    authorize("ADMIN"),
    createAuditLogRouter(auditLogRepository),
  );
  app.get("/api/debug/crash", async () => {
    throw new Error("boom");
  });
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };
