const { createReservationsService } = require("../../src/modules/reservations/reservations.service");

const NOW = new Date("2026-11-21T10:00:00.000Z");
const user = { id: 1, role: "USER" };
const admin = { id: 99, role: "ADMIN" };

function fixture({ capacity = 10, existing = [], eventBus } = {}) {
  let current = existing.map((x, i) => ({ id: i + 1, roomId: 1, userId: 1, participants: 1, status: "CONFIRMED", cancelledAt: null, createdAt: NOW.toISOString(), ...x }));
  const roomsRepository = { findById: jest.fn(async (id) => id === 1 ? { id: 1, capacity } : null), lockById: jest.fn(async () => true) };
  const reservationsRepository = {
    findConfirmedByRoom: jest.fn(async (roomId) => current.filter((x) => x.roomId === roomId && x.status === "CONFIRMED")),
    create: jest.fn(async (data) => { const value = { id: current.length + 1, ...data }; current.push(value); return value; }),
    findById: jest.fn(async (id) => current.find((x) => x.id === id) || null),
    setCancelled: jest.fn(async (id, cancelledAt) => { const value = current.find((x) => x.id === id); value.status = "CANCELLED"; value.cancelledAt = cancelledAt; return value; }),
    list: jest.fn(async () => ({ data: current, total: current.length })),
  };
  const repositories = { roomsRepository, reservationsRepository };
  return {
    service: createReservationsService({ runInTransaction: (fn) => fn(repositories), now: () => NOW, eventBus: eventBus || { publish: jest.fn(async () => {}) } }),
    reservationsRepository,
  };
}

const input = (startTime, endTime, participants = 1, roomId = 1) => ({ roomId, participants, startTime, endTime });

describe("reservation business rules", () => {
  test.each([
    ["partial overlap", "2026-11-21T11:30:00.000Z", "2026-11-21T12:30:00.000Z", true],
    ["contained", "2026-11-21T11:15:00.000Z", "2026-11-21T11:45:00.000Z", true],
    ["touching interval", "2026-11-21T12:00:00.000Z", "2026-11-21T13:00:00.000Z", false],
  ])("checks %s", async (_name, start, end, rejected) => {
    const { service } = fixture({ existing: [{ startTime: "2026-11-21T11:00:00.000Z", endTime: "2026-11-21T12:00:00.000Z" }] });
    const promise = service.createReservation(input(start, end), user);
    if (rejected) await expect(promise).rejects.toMatchObject({ code: "ROOM_ALREADY_BOOKED" });
    else await expect(promise).resolves.toMatchObject({ startTime: start });
  });

  test("allows the same time in another room", async () => {
    const { service } = fixture({ existing: [{ roomId: 2, startTime: "2026-11-21T11:00:00.000Z", endTime: "2026-11-21T12:00:00.000Z" }] });
    await expect(service.createReservation(input("2026-11-21T11:00:00.000Z", "2026-11-21T12:00:00.000Z"), user)).resolves.toBeDefined();
  });

  test("cancelled reservation does not block the interval", async () => {
    const { service } = fixture({ existing: [{ status: "CANCELLED", startTime: "2026-11-21T11:00:00.000Z", endTime: "2026-11-21T12:00:00.000Z" }] });
    await expect(service.createReservation(input("2026-11-21T11:00:00.000Z", "2026-11-21T12:00:00.000Z"), user)).resolves.toBeDefined();
  });

  test.each([[10, false], [11, true]])("capacity %i", async (participants, rejected) => {
    const { service } = fixture({ capacity: 10 });
    const promise = service.createReservation(input("2026-11-21T11:00:00.000Z", "2026-11-21T12:00:00.000Z", participants), user);
    if (rejected) await expect(promise).rejects.toMatchObject({ code: "ROOM_CAPACITY_EXCEEDED" });
    else await expect(promise).resolves.toBeDefined();
  });

  test.each([
    [15, false], [480, false], [14, true], [481, true],
  ])("duration %i minutes", async (minutes, rejected) => {
    const { service } = fixture();
    const start = new Date("2026-11-21T11:00:00.000Z");
    const promise = service.createReservation(input(start.toISOString(), new Date(start.getTime() + minutes * 60000).toISOString()), user);
    if (rejected) await expect(promise).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    else await expect(promise).resolves.toBeDefined();
  });

  test("rejects cancellation after start", async () => {
    const { service } = fixture({ existing: [{ startTime: "2026-11-21T09:00:00.000Z", endTime: "2026-11-21T11:00:00.000Z" }] });
    await expect(service.cancelReservation(1, user)).rejects.toMatchObject({ code: "RESERVATION_ALREADY_STARTED" });
  });

  test("double cancellation is idempotent", async () => {
    const bus = { publish: jest.fn(async () => {}) };
    const { service } = fixture({ existing: [{ startTime: "2026-11-21T11:00:00.000Z", endTime: "2026-11-21T12:00:00.000Z" }], eventBus: bus });
    const first = await service.cancelReservation(1, user);
    const second = await service.cancelReservation(1, user);
    expect(second.cancelledAt).toBe(first.cancelledAt);
    // Celowa regresja do demonstracji, że CI blokuje wadliwy pull request.
    expect(bus.publish).toHaveBeenCalledTimes(2);
  });

  test("USER cannot cancel another user's reservation", async () => {
    const { service } = fixture({ existing: [{ userId: 2, startTime: "2026-11-21T11:00:00.000Z", endTime: "2026-11-21T12:00:00.000Z" }] });
    await expect(service.cancelReservation(1, user)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("ADMIN may cancel another user's reservation", async () => {
    const { service } = fixture({ existing: [{ userId: 2, startTime: "2026-11-21T11:00:00.000Z", endTime: "2026-11-21T12:00:00.000Z" }] });
    await expect(service.cancelReservation(1, admin)).resolves.toMatchObject({ status: "CANCELLED" });
  });

  test("publishes created only after successful save", async () => {
    const bus = { publish: jest.fn(async () => {}) };
    const { service } = fixture({ eventBus: bus });
    await service.createReservation(input("2026-11-21T11:00:00.000Z", "2026-11-21T12:00:00.000Z"), user);
    expect(bus.publish).toHaveBeenCalledWith("reservation.created", expect.objectContaining({ reservationId: 1 }));
  });

  test("does not publish when reservation fails", async () => {
    const bus = { publish: jest.fn(async () => {}) };
    const { service } = fixture({ capacity: 1, eventBus: bus });
    await expect(service.createReservation(input("2026-11-21T11:00:00.000Z", "2026-11-21T12:00:00.000Z", 2), user)).rejects.toBeDefined();
    expect(bus.publish).not.toHaveBeenCalled();
  });
});
