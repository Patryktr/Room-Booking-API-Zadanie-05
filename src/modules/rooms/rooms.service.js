const { NotFoundError } = require("../../errors/AppError");

function createRoomsService({ runInTransaction }) {
  async function listRooms() {
    return runInTransaction(({ roomsRepository }) => roomsRepository.list());
  }

  async function getRoom(id) {
    return runInTransaction(async ({ roomsRepository }) => {
      const room = await roomsRepository.findById(id);
      if (!room) throw new NotFoundError("Room");
      return room;
    });
  }

  async function createRoom(input) {
    return runInTransaction(
      async ({ buildingsRepository, roomsRepository }) => {
        if (!(await buildingsRepository.findById(input.buildingId)))
          throw new NotFoundError("Building");
        return roomsRepository.create(input);
      },
    );
  }

  return { listRooms, getRoom, createRoom };
}

module.exports = { createRoomsService };
