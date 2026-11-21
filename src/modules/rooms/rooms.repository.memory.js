const { ConflictError } = require("../../errors/AppError");

const DEFAULT_BUILDINGS = [
  { id: 1, name: "Budynek A", address: "ul. Warszawska 24, Kraków" },
  { id: 2, name: "Budynek B", address: "ul. Długa 10, Kraków" },
];

const DEFAULT_ROOMS = [
  { id: 1, buildingId: 1, name: "101", capacity: 30 },
  { id: 2, buildingId: 1, name: "102", capacity: 12 },
  { id: 3, buildingId: 1, name: "103", capacity: 24 },
  { id: 4, buildingId: 2, name: "101", capacity: 50 },
  { id: 5, buildingId: 2, name: "201", capacity: 20 },
];

function createRoomsRepository(
  seed = DEFAULT_ROOMS,
  buildingsSeed = DEFAULT_BUILDINGS,
  { buildingsRepository } = {},
) {
  const rooms = structuredClone(seed);
  const buildings = structuredClone(buildingsSeed);
  const findBuilding = async (id) =>
    buildingsRepository
      ? buildingsRepository.findById(id)
      : buildings.find((item) => item.id === id);
  return {
    async list() {
      return Promise.all(
        rooms.map(async (room) => ({
          ...room,
          building: await findBuilding(room.buildingId),
        })),
      );
    },
    async findById(id) {
      const room = rooms.find((item) => item.id === id);
      return room
        ? { ...room, building: await findBuilding(room.buildingId) }
        : null;
    },
    async listByBuildingId(buildingId) {
      return Promise.all(
        rooms
          .filter((room) => room.buildingId === buildingId)
          .map(async (room) => ({
            ...room,
            building: await findBuilding(room.buildingId),
          })),
      );
    },
    async create(data) {
      if (
        rooms.some(
          (room) =>
            room.buildingId === data.buildingId && room.name === data.name,
        )
      ) {
        throw new ConflictError(
          "Room name already exists in this building",
          "UNIQUE_VIOLATION",
        );
      }
      const room = {
        id: Math.max(0, ...rooms.map((item) => item.id)) + 1,
        ...data,
      };
      rooms.push(room);
      return { ...room, building: await findBuilding(room.buildingId) };
    },
    async lockById(id) {
      return this.findById(id);
    },
  };
}

function createBuildingsRepository(
  seed = DEFAULT_BUILDINGS,
  roomsSeed = DEFAULT_ROOMS,
  { getRooms } = {},
) {
  const buildings = structuredClone(seed);
  const rooms = structuredClone(roomsSeed);
  return {
    async list() {
      const currentRooms = getRooms ? await getRooms() : rooms;
      return buildings.map((building) => ({
        ...building,
        roomsCount: currentRooms.filter(
          (room) => room.buildingId === building.id,
        ).length,
      }));
    },
    async findById(id) {
      return buildings.find((item) => item.id === id) ?? null;
    },
    async create(data) {
      if (buildings.some((item) => item.name === data.name)) {
        throw new ConflictError(
          "Building name already exists",
          "UNIQUE_VIOLATION",
        );
      }
      const building = {
        id: Math.max(0, ...buildings.map((item) => item.id)) + 1,
        ...data,
      };
      buildings.push(building);
      return building;
    },
  };
}

module.exports = {
  createRoomsRepository,
  createBuildingsRepository,
  DEFAULT_ROOMS,
  DEFAULT_BUILDINGS,
};
