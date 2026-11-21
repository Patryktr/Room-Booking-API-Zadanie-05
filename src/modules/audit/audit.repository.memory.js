function createAuditLogRepository() {
  const rows = [];
  return {
    async create({ eventType, payload }) {
      const row = { id: rows.length + 1, event_type: eventType, payload, created_at: new Date().toISOString() };
      rows.push(row);
      return row;
    },
    async list({ eventType, page = 1, limit = 20 } = {}) {
      const filtered = rows.filter((x) => !eventType || x.event_type === eventType).reverse();
      return { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
    },
  };
}

module.exports = { createAuditLogRepository };
