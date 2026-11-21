const express = require("express");
const { z } = require("zod");
const validate = require("../../middleware/validate");

const querySchema = z.object({
  eventType: z.enum(["reservation.created", "reservation.cancelled"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

function createAuditLogRouter(repository) {
  const router = express.Router();
  router.get("/", validate({ query: querySchema }), async (req, res) => {
    const query = req.validated.query;
    const result = await repository.list(query);
    res.json({
      data: result.data.map((row) => ({
        id: Number(row.id),
        eventType: row.event_type,
        payload: row.payload,
        createdAt: row.created_at,
      })),
      meta: { page: query.page, limit: query.limit, total: result.total },
    });
  });
  return router;
}

module.exports = { createAuditLogRouter };
