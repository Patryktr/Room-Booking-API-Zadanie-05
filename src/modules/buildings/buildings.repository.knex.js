function buildingFromRow(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.name,
    address: row.address,
    createdAt: row.created_at,
    ...(row.rooms_count === undefined
      ? {}
      : { roomsCount: Number(row.rooms_count) }),
  };
}

function createBuildingsRepository(db) {
  return {
    async list() {
      const rows = await db("buildings as b")
        .leftJoin("rooms as r", "r.building_id", "b.id")
        .groupBy("b.id")
        .select("b.id", "b.name", "b.address", "b.created_at")
        .count({ rooms_count: "r.id" })
        .orderBy("b.id");
      return rows.map(buildingFromRow);
    },
    async findById(id) {
      return buildingFromRow(await db("buildings").where({ id }).first());
    },
    async create(data) {
      const [row] = await db("buildings")
        .insert({ name: data.name, address: data.address })
        .returning(["id", "name", "address", "created_at"]);
      return buildingFromRow(row);
    },
  };
}

module.exports = { createBuildingsRepository, buildingFromRow };
