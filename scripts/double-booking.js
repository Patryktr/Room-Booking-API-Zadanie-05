const config = require("../src/config");
const knexFactory = require("knex");
const db = knexFactory({ client: "pg", connection: config.DATABASE_URL });
const baseUrl = `${config.API_URL}/api/reservations`;
const roomId = config.DEMO_ROOM_ID;
async function main() {
  const login = await fetch(`${config.API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: config.ADMIN_EMAIL,
      password: config.ADMIN_PASSWORD,
    }),
  });
  if (!login.ok) throw new Error(`Admin login failed: ${login.status}`);
  const { accessToken } = await login.json();
  const startsAt = new Date(Date.now() + 14 * 86400000);
  startsAt.setSeconds(0, 0);
  const endsAt = new Date(startsAt.getTime() + 3600000);
  const body = {
    roomId,
    participants: 2,
    startTime: startsAt.toISOString(),
    endTime: endsAt.toISOString(),
  };
  const statuses = await Promise.all(
    Array.from({ length: 10 }, async (_, i) => {
      const r = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
      console.log(`request ${i + 1}: ${r.status}`);
      return r.status;
    }),
  );
  const [{ count }] = await db("reservations")
    .where({ room_id: roomId, status: "CONFIRMED" })
    .andWhere("start_time", "=", startsAt)
    .andWhere("end_time", "=", endsAt)
    .count({ count: "id" });
  console.log(`CONFIRMED reservations for exact interval: ${count}`);
  console.log(
    `summary: 201=${statuses.filter((x) => x === 201).length}, 409=${statuses.filter((x) => x === 409).length}, other=${statuses.filter((x) => x !== 201 && x !== 409).length}`,
  );
  await db.destroy();
}
main().catch(async (e) => {
  console.error(e);
  await db.destroy();
  process.exitCode = 1;
});
