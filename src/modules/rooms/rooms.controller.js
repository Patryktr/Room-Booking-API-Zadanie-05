const { toRoomResponse } = require("./rooms.mapper");

function createRoomsController(roomsService) {
  return {
    async list(_req, res) {
      const rooms = await roomsService.listRooms();
      return res.json(rooms.map(toRoomResponse));
    },
    async getById(req, res) {
      const room = await roomsService.getRoom(req.validated.params.id);
      return res.json(toRoomResponse(room));
    },
    async create(req, res) {
      const room = await roomsService.createRoom(req.validated.body);
      return res.status(201).json(toRoomResponse(room));
    },
  };
}

module.exports = { createRoomsController };
