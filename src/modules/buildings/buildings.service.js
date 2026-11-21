const { NotFoundError } = require("../../errors/AppError");
function createBuildingsService({ runInTransaction }) {
  return {
    listBuildings() {
      return runInTransaction(({ buildingsRepository }) =>
        buildingsRepository.list(),
      );
    },
    async getBuilding(id) {
      return runInTransaction(async ({ buildingsRepository }) => {
        const building = await buildingsRepository.findById(id);
        if (!building) throw new NotFoundError("Building");
        return building;
      });
    },
    createBuilding(data) {
      return runInTransaction(({ buildingsRepository }) =>
        buildingsRepository.create(data),
      );
    },
    async listRooms(id) {
      return runInTransaction(
        async ({ buildingsRepository, roomsRepository }) => {
          if (!(await buildingsRepository.findById(id)))
            throw new NotFoundError("Building");
          return roomsRepository.listByBuildingId(id);
        },
      );
    },
  };
}
module.exports = { createBuildingsService };
