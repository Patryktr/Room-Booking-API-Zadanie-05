const bcrypt = require("bcryptjs");
const {
  createRoomsRepository,
  createBuildingsRepository,
} = require("./rooms/rooms.repository.memory");
const {
  createReservationsRepository,
} = require("./reservations/reservations.repository.memory");
const { createUsersRepository } = require("./auth/users.repository.memory");
const { createAuditLogRepository } = require("./audit/audit.repository.memory");
function createMemoryUnitOfWork({ now = () => new Date(), config } = {}) {
  const stamp = now().toISOString();
  const users = [
    {
      id: 1,
      email: config.ADMIN_EMAIL,
      role: "ADMIN",
      passwordHash: bcrypt.hashSync(config.ADMIN_PASSWORD, 12),
      createdAt: stamp,
    },
    ...[
      "anna.nowak",
      "jan.kowalski",
      "maria.wisniewska",
      "piotr.zielinski",
      "ola.wojcik",
    ].map((n, i) => ({
      id: i + 2,
      email: `${n}@example.com`,
      role: "USER",
      passwordHash: bcrypt.hashSync(config.DEMO_USER_PASSWORD, 12),
      createdAt: stamp,
    })),
  ];
  const usersRepository = createUsersRepository(users);
  let roomsRepository;
  const buildingsRepository = createBuildingsRepository(undefined, undefined, {
    getRooms: () => roomsRepository.list(),
  });
  roomsRepository = createRoomsRepository(undefined, undefined, {
    buildingsRepository,
  });
  const reservationsRepository = createReservationsRepository({
    now,
    roomsRepository,
    usersRepository,
  });
  const auditLogRepository = createAuditLogRepository();
  const repositories = {
    buildingsRepository,
    roomsRepository,
    reservationsRepository,
    usersRepository,
    auditLogRepository,
  };
  return { ...repositories, runInTransaction: (fn) => fn(repositories) };
}
module.exports = { createMemoryUnitOfWork };
