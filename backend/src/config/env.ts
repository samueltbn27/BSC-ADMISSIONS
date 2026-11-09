import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  PGHOST: z.string().default('127.0.0.1'),
  PGPORT: z.coerce.number().int().positive().default(5432),
  PGDATABASE: z.string().min(1),
  PGUSER_RUNTIME: z.string().min(1),
  PGPASSWORD_RUNTIME: z.string().default(''),
  PGUSER_AUTH: z.string().min(1),
  PGPASSWORD_AUTH: z.string().default(''),

  SESSION_COOKIE_NAME: z.string().default('bsc_session'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(8),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  UPLOAD_DIR: z.string().default('../storage/uploads'),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(20 * 1024 * 1024),

  ALLOWED_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`
  );
}

export const env = parsed.data;
