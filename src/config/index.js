const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  STORAGE: z.enum(["memory", "postgres"]).default("postgres"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (value) =>
        value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "DATABASE_URL must be a PostgreSQL URL",
    ),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must have at least 32 characters"),
  JWT_EXPIRES_IN: z
    .string()
    .regex(
      /^\d+(s|m|h|d)$/,
      "JWT_EXPIRES_IN must use seconds, minutes, hours or days",
    )
    .default("15m"),
  ADMIN_EMAIL: z.email().toLowerCase(),
  ADMIN_PASSWORD: z.string().min(10).max(72),
  DEMO_USER_PASSWORD: z.string().min(10).max(72),
  DEMO_ROOM_ID: z.coerce.number().int().positive().default(1),
  DEBUG: z.string().default(""),
  DISABLE_APP_OVERLAP_CHECK: z.enum(["0", "1"]).default("0"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

module.exports = Object.freeze(parsed.data);
