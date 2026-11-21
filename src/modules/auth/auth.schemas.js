const { z } = require("zod");
const registerBody = z
  .object({
    email: z.email().max(254).toLowerCase(),
    password: z.string().min(10).max(72),
  })
  .strict();
const loginBody = z
  .object({
    email: z.email().max(254).toLowerCase(),
    password: z.string().min(1).max(72),
  })
  .strict();
module.exports = { registerBody, loginBody };
