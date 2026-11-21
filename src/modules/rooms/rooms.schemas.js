const { z } = require("zod");

const roomIdParams = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

const buildingIdParams = z
  .object({ id: z.coerce.number().int().positive() })
  .strict();
const createRoomBody = z
  .object({
    buildingId: z.number().int().positive(),
    name: z.string().trim().min(1).max(80),
    capacity: z.number().int().positive(),
  })
  .strict();

module.exports = { roomIdParams, buildingIdParams, createRoomBody };
