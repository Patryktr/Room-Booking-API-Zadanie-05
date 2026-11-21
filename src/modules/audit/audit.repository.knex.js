function createAuditLogRepository(db) {
  return {
    async create({ eventType, payload }) {
      const [row] = await db("audit_log")
        .insert({ event_type: eventType, payload: JSON.stringify(payload) })
        .returning(["id", "event_type", "payload", "created_at"]);
      return row;
    },
    async list({ eventType, page = 1, limit = 20 } = {}) {
      const base = db("audit_log");
      if (eventType) base.where({ event_type: eventType });
      const [{ count }] = await base.clone().count("id as count");
      const rows = await base
        .clone()
        .orderBy("created_at", "desc")
        .orderBy("id", "desc")
        .limit(limit)
        .offset((page - 1) * limit);
      return { data: rows, total: Number(count) };
    },
  };
}

module.exports = { createAuditLogRepository };
