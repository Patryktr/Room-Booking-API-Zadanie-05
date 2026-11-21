exports.up = (knex) =>
  knex.schema.createTable("audit_log", (table) => {
    table.bigIncrements("id").primary();
    table.string("event_type", 80).notNullable().index();
    table.jsonb("payload").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

exports.down = (knex) => knex.schema.dropTableIfExists("audit_log");
