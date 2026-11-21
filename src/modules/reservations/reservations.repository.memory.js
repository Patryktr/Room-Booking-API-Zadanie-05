function createReservationsRepository({
  seed,
  now = () => new Date(),
  roomsRepository,
  usersRepository,
} = {}) {
  const t = now().getTime();
  const defaults = [
    {
      id: 1,
      roomId: 1,
      userId: 2,
      participants: 5,
      startTime: new Date(t - 1800000).toISOString(),
      endTime: new Date(t + 1800000).toISOString(),
      status: "CONFIRMED",
      createdAt: new Date(t - 3600000).toISOString(),
      cancelledAt: null,
    },
    {
      id: 2,
      roomId: 2,
      userId: 3,
      participants: 4,
      startTime: new Date(t + 86400000).toISOString(),
      endTime: new Date(t + 90000000).toISOString(),
      status: "CONFIRMED",
      createdAt: new Date(t).toISOString(),
      cancelledAt: null,
    },
    {
      id: 3,
      roomId: 3,
      userId: 4,
      participants: 8,
      startTime: new Date(t + 172800000).toISOString(),
      endTime: new Date(t + 176400000).toISOString(),
      status: "CANCELLED",
      createdAt: new Date(t).toISOString(),
      cancelledAt: new Date(t).toISOString(),
    },
    {
      id: 4,
      roomId: 4,
      userId: 5,
      participants: 10,
      startTime: new Date(t + 259200000).toISOString(),
      endTime: new Date(t + 262800000).toISOString(),
      status: "CONFIRMED",
      createdAt: new Date(t).toISOString(),
      cancelledAt: null,
    },
    {
      id: 5,
      roomId: 5,
      userId: 6,
      participants: 5,
      startTime: new Date(t + 345600000).toISOString(),
      endTime: new Date(t + 349200000).toISOString(),
      status: "CONFIRMED",
      createdAt: new Date(t).toISOString(),
      cancelledAt: null,
    },
  ];
  const reservations = structuredClone(seed ?? defaults);
  let nextId = Math.max(0, ...reservations.map((x) => x.id)) + 1;
  const rel = async (x) => {
    const [room, user] = await Promise.all([
      roomsRepository.findById(x.roomId),
      usersRepository.findById(x.userId),
    ]);
    return {
      ...x,
      room,
      user: user ? { id: user.id, email: user.email } : null,
    };
  };
  return {
    async list(f = {}) {
      const {
        roomId,
        buildingId,
        userId,
        status,
        from,
        to,
        page = 1,
        limit = 20,
        sort = "startTime",
      } = f;
      let rows = reservations.filter(
        (x) =>
          (roomId === undefined || x.roomId === roomId) &&
          (userId === undefined || x.userId === userId) &&
          (status === undefined || x.status === status) &&
          (from === undefined || Date.parse(x.endTime) > Date.parse(from)) &&
          (to === undefined || Date.parse(x.startTime) < Date.parse(to)),
      );
      if (buildingId !== undefined) rows = await Promise.all(rows.map(rel));
      if (buildingId !== undefined)
        rows = rows.filter((x) => x.room?.buildingId === buildingId);
      const total = rows.length,
        key = sort.replace(/^-/, ""),
        sign = sort.startsWith("-") ? -1 : 1,
        fields = {
          startTime: "startTime",
          createdAt: "createdAt",
          participants: "participants",
        };
      rows.sort(
        (a, b) =>
          (a[fields[key]] > b[fields[key]]
            ? 1
            : a[fields[key]] < b[fields[key]]
              ? -1
              : a.id - b.id) * sign,
      );
      return {
        data: await Promise.all(
          rows.slice((page - 1) * limit, page * limit).map(rel),
        ),
        total,
      };
    },
    async findById(id) {
      const x = reservations.find((r) => r.id === id);
      return x ? rel(x) : null;
    },
    async findConfirmedByRoom(id) {
      return reservations.filter(
        (x) => x.roomId === id && x.status === "CONFIRMED",
      );
    },
    async create(d) {
      const x = { id: nextId++, ...d };
      reservations.push(x);
      return rel(x);
    },
    async setCancelled(id, cancelledAt) {
      const x = reservations.find((r) => r.id === id);
      if (!x) return null;
      x.status = "CANCELLED";
      x.cancelledAt = cancelledAt;
      return rel(x);
    },
  };
}
module.exports = { createReservationsRepository };
