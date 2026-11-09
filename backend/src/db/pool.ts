import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

export const runtimePool = new Pool({
  host: env.PGHOST,
  port: env.PGPORT,
  database: env.PGDATABASE,
  user: env.PGUSER_RUNTIME,
  password: env.PGPASSWORD_RUNTIME,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export const authPool = new Pool({
  host: env.PGHOST,
  port: env.PGPORT,
  database: env.PGDATABASE,
  user: env.PGUSER_AUTH,
  password: env.PGPASSWORD_AUTH,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
