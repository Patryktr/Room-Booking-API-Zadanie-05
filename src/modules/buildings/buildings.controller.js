const { toRoomResponse } = require("../rooms/rooms.mapper");
function toBuildingResponse(building) {
  return {
    id: building.id,
    name: building.name,
    address: building.address,
    ...(building.roomsCount === undefined
      ? {}
      : { roomsCount: building.roomsCount }),
  };
}
function createBuildingsController(service) {
  return {
    async list(_req, res) {
      return res.json((await service.listBuildings()).map(toBuildingResponse));
    },
    async getById(req, res) {
      return res.json(
        toBuildingResponse(await service.getBuilding(req.validated.params.id)),
      );
    },
    async create(req, res) {
      return res
        .status(201)
        .json(
          toBuildingResponse(await service.createBuilding(req.validated.body)),
        );
    },
    async listRooms(req, res) {
      return res.json(
        (await service.listRooms(req.validated.params.id)).map(toRoomResponse),
      );
    },
  };
}
module.exports = { createBuildingsController, toBuildingResponse };
