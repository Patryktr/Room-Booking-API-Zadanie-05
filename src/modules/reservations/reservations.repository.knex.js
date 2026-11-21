function reservationFromRow(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    roomId: Number(r.room_id),
    userId: Number(r.user_id),
    participants: Number(r.participants),
    startTime: r.start_time,
    endTime: r.end_time,
    status: r.status,
    cancelledAt: r.cancelled_at,
    createdAt: r.created_at,
    user: { id: Number(r.user_id), email: r.user_email },
    room: {
      id: Number(r.joined_room_id),
      name: r.room_name,
      building: { id: Number(r.building_id), name: r.building_name },
    },
  };
}
function createReservationsRepository(db) {
  const joined = () =>
    db("reservations as x")
      .join("rooms as r", "r.id", "x.room_id")
      .join("buildings as b", "b.id", "r.building_id")
      .join("users as u", "u.id", "x.user_id")
      .select(
        "x.id",
        "x.room_id",
        "x.user_id",
        "x.participants",
        "x.start_time",
        "x.end_time",
        "x.status",
        "x.cancelled_at",
        "x.created_at",
        "u.email as user_email",
        "r.id as joined_room_id",
        "r.name as room_name",
        "b.id as building_id",
        "b.name as building_name",
      );
  function filters(q, f = {}) {
    if (f.roomId !== undefined) q.where("x.room_id", f.roomId);
    if (f.buildingId !== undefined) q.where("r.building_id", f.buildingId);
    if (f.userId !== undefined) q.where("x.user_id", f.userId);
    if (f.status !== undefined) q.where("x.status", f.status);
    if (f.from !== undefined) q.where("x.end_time", ">", f.from);
    if (f.to !== undefined) q.where("x.start_time", "<", f.to);
    return q;
  }
  return {
    async list(f = {}) {
      const countQ = filters(
        db("reservations as x").join("rooms as r", "r.id", "x.room_id"),
        f,
      )
        .countDistinct({ total: "x.id" })
        .first();
      const direction = f.sort?.startsWith("-") ? "desc" : "asc",
        key = (f.sort || "startTime").replace(/^-/, ""),
        cols = {
          startTime: "x.start_time",
          createdAt: "x.created_at",
          participants: "x.participants",
        };
      const query = filters(joined(), f)
        .orderBy(cols[key] || "x.start_time", direction)
        .orderBy("x.id", direction)
        .limit(f.limit || 20)
        .offset(((f.page || 1) - 1) * (f.limit || 20));
      const [count, rows] = await Promise.all([countQ, query]);
      return { data: rows.map(reservationFromRow), total: Number(count.total) };
    },
    async findById(id) {
      return reservationFromRow(await joined().where("x.id", id).first());
    },
    async findConfirmedByRoom(roomId, trx = db) {
      return trx("reservations")
        .where({ room_id: roomId, status: "CONFIRMED" })
        .select("id", "room_id", "start_time", "end_time")
        .then((rows) =>
          rows.map((r) => ({
            id: Number(r.id),
            roomId: Number(r.room_id),
            startTime: r.start_time,
            endTime: r.end_time,
          })),
        );
    },
    async create(d) {
      const [row] = await db("reservations")
        .insert({
          room_id: d.roomId,
          user_id: d.userId,
          participants: d.participants,
          start_time: d.startTime,
          end_time: d.endTime,
          status: d.status,
          created_at: d.createdAt,
          cancelled_at: d.cancelledAt,
        })
        .returning("id");
      return reservationFromRow(
        await joined().where("x.id", Number(row.id)).first(),
      );
    },
    async setCancelled(id, cancelledAt) {
      await db("reservations")
        .where({ id })
        .update({ status: "CANCELLED", cancelled_at: cancelledAt });
      return reservationFromRow(await joined().where("x.id", id).first());
    },
  };
}
function createKnexRepositories(db) {
  return {
    buildingsRepository:
      require("../buildings/buildings.repository.knex").createBuildingsRepository(
        db,
      ),
    roomsRepository:
      require("../rooms/rooms.repository.knex").createRoomsRepository(db),
    reservationsRepository: createReservationsRepository(db),
    usersRepository:
      require("../auth/users.repository.knex").createUsersRepository(db),
    auditLogRepository:
      require("../audit/audit.repository.knex").createAuditLogRepository(db),
  };
}
function createKnexUnitOfWork(db) {
  const repositories = createKnexRepositories(db);
  return {
    ...repositories,
    runInTransaction: (fn) =>
      db.transaction((trx) => fn(createKnexRepositories(trx))),
  };
}
module.exports = {
  createReservationsRepository,
  createKnexRepositories,
  createKnexUnitOfWork,
  reservationFromRow,
};
