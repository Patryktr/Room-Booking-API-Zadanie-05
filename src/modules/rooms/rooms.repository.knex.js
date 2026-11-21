function roomFromRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.name,
    capacity: Number(row.capacity),
    buildingId: Number(row.building_id),
    building: { id: Number(row.joined_building_id), name: row.building_name },
  };
}

function createRoomsRepository(db) {
  const joined = () =>
    db("rooms as r")
      .join("buildings as b", "b.id", "r.building_id")
      .select(
        "r.id",
        "r.name",
        "r.capacity",
        "r.building_id",
        "b.id as joined_building_id",
        "b.name as building_name",
      );
  return {
    async list() {
      return (await joined().orderBy("r.id")).map(roomFromRow);
    },
    async findById(id) {
      return roomFromRow(await joined().where("r.id", id).first());
    },
    async listByBuildingId(buildingId) {
      return (
        await joined().where("r.building_id", buildingId).orderBy("r.id")
      ).map(roomFromRow);
    },
    async create(data) {
      const [row] = await db("rooms")
        .insert({
          building_id: data.buildingId,
          name: data.name,
          capacity: data.capacity,
        })
        .returning("id");
      return this.findById(Number(row.id));
    },
    async lockById(id) {
      return db("rooms").where({ id }).forUpdate().first();
    },
  };
}

module.exports = { createRoomsRepository, roomFromRow };
