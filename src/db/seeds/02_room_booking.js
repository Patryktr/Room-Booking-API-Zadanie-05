exports.seed = async function (knex) {
  await knex("reservations").del();
  await knex("rooms").del();
  await knex("buildings").del();
  await knex.raw("ALTER SEQUENCE buildings_id_seq RESTART WITH 1");
  await knex.raw("ALTER SEQUENCE rooms_id_seq RESTART WITH 1");
  await knex.raw("ALTER SEQUENCE reservations_id_seq RESTART WITH 1");
  const [a, b] = await knex("buildings")
    .insert([
      { name: "Budynek A", address: "ul. Warszawska 24, Kraków" },
      { name: "Budynek B", address: "ul. Długa 10, Kraków" },
    ])
    .returning("id");
  const [r1, r2, r3, r4, r5] = await knex("rooms")
    .insert([
      { building_id: a.id, name: "101", capacity: 30 },
      { building_id: a.id, name: "102", capacity: 12 },
      { building_id: a.id, name: "103", capacity: 24 },
      { building_id: b.id, name: "101", capacity: 50 },
      { building_id: b.id, name: "201", capacity: 20 },
    ])
    .returning("id");
  const users = await knex("users").select("id", "email");
  const ids = Object.fromEntries(users.map((u) => [u.email, u.id]));
  const now = new Date(),
    tomorrow = new Date(now.getTime() + 86400000),
    dayAfter = new Date(now.getTime() + 172800000),
    yesterday = new Date(now.getTime() - 86400000);
  await knex("reservations").insert([
    {
      room_id: r1.id,
      user_id: ids["anna.nowak@example.com"],
      participants: 8,
      start_time: tomorrow,
      end_time: new Date(tomorrow.getTime() + 3600000),
      status: "CONFIRMED",
    },
    {
      room_id: r2.id,
      user_id: ids["jan.kowalski@example.com"],
      participants: 6,
      start_time: dayAfter,
      end_time: new Date(dayAfter.getTime() + 5400000),
      status: "CONFIRMED",
    },
    {
      room_id: r3.id,
      user_id: ids["maria.wisniewska@example.com"],
      participants: 10,
      start_time: yesterday,
      end_time: new Date(yesterday.getTime() + 3600000),
      status: "CONFIRMED",
    },
    {
      room_id: r4.id,
      user_id: ids["piotr.zielinski@example.com"],
      participants: 4,
      start_time: tomorrow,
      end_time: new Date(tomorrow.getTime() + 3600000),
      status: "CANCELLED",
      cancelled_at: now,
    },
    {
      room_id: r5.id,
      user_id: ids["ola.wojcik@example.com"],
      participants: 12,
      start_time: new Date(now.getTime() - 1800000),
      end_time: new Date(now.getTime() + 1800000),
      status: "CONFIRMED",
    },
  ]);
};
