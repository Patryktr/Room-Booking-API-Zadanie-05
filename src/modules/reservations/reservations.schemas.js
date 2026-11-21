const { z } = require("zod");
const idParams = z.object({ id: z.coerce.number().int().positive() }).strict();
const listReservationsQuery = z
  .object({
    roomId: z.coerce.number().int().positive().optional(),
    buildingId: z.coerce.number().int().positive().optional(),
    userId: z.coerce.number().int().positive().optional(),
    status: z.enum(["CONFIRMED", "CANCELLED"]).optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .enum([
        "startTime",
        "-startTime",
        "createdAt",
        "-createdAt",
        "participants",
        "-participants",
      ])
      .default("startTime"),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.from && v.to && Date.parse(v.from) >= Date.parse(v.to))
      c.addIssue({
        code: "custom",
        path: ["from"],
        message: "from must be earlier than to",
      });
  });
const createReservationBody = z
  .object({
    roomId: z.number().int().positive(),
    participants: z.number().int().positive(),
    startTime: z.iso.datetime({ offset: true }),
    endTime: z.iso.datetime({ offset: true }),
  })
  .strict();
module.exports = { idParams, listReservationsQuery, createReservationBody };
