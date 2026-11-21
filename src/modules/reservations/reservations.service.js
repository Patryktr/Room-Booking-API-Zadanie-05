const {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} = require("../../errors/AppError");
const MIN_DURATION_MS = 15 * 60 * 1000,
  MAX_DURATION_MS = 8 * 60 * 60 * 1000,
  ALLOWED_TRANSITIONS = { CONFIRMED: ["CANCELLED"], CANCELLED: [] };
function createReservationsService({
  runInTransaction,
  now = () => new Date(),
  disableAppOverlapCheck = false,
  eventBus = { publish: async () => {} },
}) {
  async function createReservation(input, currentUser) {
    const reservation = await runInTransaction(
      async ({ roomsRepository, reservationsRepository }) => {
        const room = await roomsRepository.findById(input.roomId);
        if (!room) throw new NotFoundError("Room");
        const startMs = Date.parse(input.startTime),
          endMs = Date.parse(input.endTime),
          details = [];
        if (endMs <= startMs)
          details.push({
            location: "body",
            field: "endTime",
            message: "endTime must be later than startTime",
          });
        else if (
          endMs - startMs < MIN_DURATION_MS ||
          endMs - startMs > MAX_DURATION_MS
        )
          details.push({
            location: "body",
            field: "endTime",
            message:
              "Reservation duration must be between 15 minutes and 8 hours",
          });
        if (startMs < now().getTime())
          details.push({
            location: "body",
            field: "startTime",
            message: "startTime cannot be in the past",
          });
        if (details.length) throw new ValidationError(details);
        if (input.participants > room.capacity)
          throw new ConflictError(
            "Room capacity exceeded",
            "ROOM_CAPACITY_EXCEEDED",
          );
        if (!(await roomsRepository.lockById(input.roomId)))
          throw new NotFoundError("Room");
        if (!disableAppOverlapCheck) {
          const existing = await reservationsRepository.findConfirmedByRoom(
            room.id,
          );
          if (
            existing.some(
              (x) =>
                startMs < Date.parse(x.endTime) &&
                Date.parse(x.startTime) < endMs,
            )
          )
            throw new ConflictError(
              "Room already has a reservation during this time",
              "ROOM_ALREADY_BOOKED",
            );
        }
        return reservationsRepository.create({
          roomId: room.id,
          userId: currentUser.id,
          participants: input.participants,
          startTime: new Date(startMs).toISOString(),
          endTime: new Date(endMs).toISOString(),
          status: "CONFIRMED",
          createdAt: now().toISOString(),
          cancelledAt: null,
        });
      },
    );
    await eventBus.publish("reservation.created", {
      reservationId: reservation.id,
      roomId: reservation.roomId,
      userId: reservation.userId,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
    });
    return reservation;
  }
  async function listReservations(filters, currentUser) {
    if (currentUser.role !== "ADMIN" && filters.userId !== undefined)
      throw new ForbiddenError("Only ADMIN may filter by userId");
    const scoped = {
      ...filters,
      userId: currentUser.role === "ADMIN" ? filters.userId : currentUser.id,
    };
    return runInTransaction(async ({ reservationsRepository }) => {
      const { data, total } = await reservationsRepository.list(scoped);
      return {
        data,
        meta: {
          page: scoped.page,
          limit: scoped.limit,
          total,
          totalPages: Math.ceil(total / scoped.limit),
        },
      };
    });
  }
  async function getReservation(id, currentUser) {
    return runInTransaction(async ({ reservationsRepository }) => {
      const r = await reservationsRepository.findById(id);
      if (!r || (currentUser.role !== "ADMIN" && r.userId !== currentUser.id))
        throw new NotFoundError("Reservation");
      return r;
    });
  }
  async function cancelReservation(id, currentUser) {
    const result = await runInTransaction(async ({ reservationsRepository }) => {
      const r = await reservationsRepository.findById(id);
      if (!r || (currentUser.role !== "ADMIN" && r.userId !== currentUser.id))
        throw new NotFoundError("Reservation");
      if (r.status === "CANCELLED") return { reservation: r, changed: false };
      if (!(ALLOWED_TRANSITIONS[r.status] ?? []).includes("CANCELLED"))
        throw new ConflictError(
          "Reservation cannot be cancelled from its current status",
          "INVALID_STATUS_TRANSITION",
        );
      if (Date.parse(r.startTime) <= now().getTime())
        throw new ConflictError(
          "Reservation has already started",
          "RESERVATION_ALREADY_STARTED",
        );
      return {
        reservation: await reservationsRepository.setCancelled(id, now().toISOString()),
        changed: true,
      };
    });
    if (result.changed)
      await eventBus.publish("reservation.cancelled", {
        reservationId: result.reservation.id,
        roomId: result.reservation.roomId,
        userId: result.reservation.userId,
        cancelledBy: currentUser.id,
      });
    return result.reservation;
  }
  return {
    createReservation,
    listReservations,
    getReservation,
    cancelReservation,
  };
}
module.exports = {
  createReservationsService,
  MIN_DURATION_MS,
  MAX_DURATION_MS,
  ALLOWED_TRANSITIONS,
};
