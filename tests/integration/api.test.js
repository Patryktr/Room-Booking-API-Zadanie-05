const request = require("supertest");
const bcrypt = require("bcryptjs");
const db = require("../../src/db/knex");
const config = require("../../src/config");
const { createApp } = require("../../src/app");
const { createKnexUnitOfWork } = require("../../src/modules/reservations/reservations.repository.knex");

let app;

async function seed() {
  await db.raw("TRUNCATE audit_log, reservations, rooms, buildings, users RESTART IDENTITY CASCADE");
  const hash = await bcrypt.hash("integration-password", 4);
  await db("users").insert([
    { email: "admin@example.test", password_hash: hash, role: "ADMIN" },
    { email: "user@example.test", password_hash: hash, role: "USER" },
    { email: "other@example.test", password_hash: hash, role: "USER" },
  ]);
  await db("buildings").insert({ name: "Main", address: "Test Street 1" });
  await db("rooms").insert([{ building_id: 1, name: "101", capacity: 10 }, { building_id: 1, name: "102", capacity: 10 }]);
}

async function token(email) {
  const response = await request(app).post("/api/auth/login").send({ email, password: "integration-password" });
  return response.body.accessToken;
}

const auth = (method, path, jwt) => request(app)[method](path).set("Authorization", `Bearer ${jwt}`);
const reservation = (overrides = {}) => ({
  roomId: 1,
  participants: 2,
  startTime: "2026-12-01T10:00:00.000Z",
  endTime: "2026-12-01T11:00:00.000Z",
  ...overrides,
});

beforeAll(async () => {
  await db.migrate.latest();
  app = createApp({ ...createKnexUnitOfWork(db), config, now: () => new Date("2026-11-21T10:00:00.000Z") });
});
beforeEach(seed);
afterAll(async () => db.destroy());

test("registers, logs in and reads /api/auth/me", async () => {
  await request(app).post("/api/auth/register").send({ email: "new@example.test", password: "new-user-password" }).expect(201);
  const login = await request(app).post("/api/auth/login").send({ email: "new@example.test", password: "new-user-password" }).expect(200);
  await auth("get", "/api/auth/me", login.body.accessToken).expect(200).expect((res) => expect(res.body.email).toBe("new@example.test"));
});

test("POST reservation returns 201, Location and persists row", async () => {
  const jwt = await token("user@example.test");
  const response = await auth("post", "/api/reservations", jwt).send(reservation()).expect(201);
  expect(response.headers.location).toBe(`/api/reservations/${response.body.id}`);
  expect(await db("reservations").where({ id: response.body.id }).first()).toBeDefined();
});

test("invalid body returns 400 with details", async () => {
  const jwt = await token("user@example.test");
  const response = await auth("post", "/api/reservations", jwt).send({ roomId: "bad" }).expect(400);
  expect(response.body.error.details.length).toBeGreaterThan(0);
});

test("private endpoint returns 401 without token", async () => {
  await request(app).get("/api/reservations").expect(401);
});

test("USER cannot create a room", async () => {
  const jwt = await token("user@example.test");
  await auth("post", "/api/rooms", jwt).send({ buildingId: 1, name: "201", capacity: 5 }).expect(403);
});

test("USER receives 404 for another user's reservation", async () => {
  const other = await token("other@example.test");
  const created = await auth("post", "/api/reservations", other).send(reservation()).expect(201);
  const userJwt = await token("user@example.test");
  await auth("get", `/api/reservations/${created.body.id}`, userJwt).expect(404);
});

test("overlap returns 409 ROOM_ALREADY_BOOKED", async () => {
  const jwt = await token("user@example.test");
  await auth("post", "/api/reservations", jwt).send(reservation()).expect(201);
  const response = await auth("post", "/api/reservations", jwt).send(reservation({ startTime: "2026-12-01T10:30:00.000Z", endTime: "2026-12-01T11:30:00.000Z" })).expect(409);
  expect(response.body.error.code).toBe("ROOM_ALREADY_BOOKED");
});

test("pagination and ADMIN audit log expose correct totals", async () => {
  const userJwt = await token("user@example.test");
  await auth("post", "/api/reservations", userJwt).send(reservation()).expect(201);
  await auth("post", "/api/reservations", userJwt).send(reservation({ roomId: 2 })).expect(201);
  const page = await auth("get", "/api/reservations?limit=1&page=1", userJwt).expect(200);
  expect(page.body.meta.total).toBe(2);
  expect(page.body.data).toHaveLength(1);
  const adminJwt = await token("admin@example.test");
  const audit = await auth("get", "/api/admin/audit-log?eventType=reservation.created", adminJwt).expect(200);
  expect(audit.body.meta.total).toBe(2);
});
