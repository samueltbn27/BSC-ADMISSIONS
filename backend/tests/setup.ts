import dotenv from 'dotenv';
import path from 'node:path';

process.env.NODE_ENV = 'test';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const defaults: Record<string, string> = {
  PORT: '4001',
  PGHOST: '127.0.0.1',
  PGPORT: '5432',
  PGDATABASE: 'bsc_test',
  PGUSER_RUNTIME: 'bsc_app',
  PGPASSWORD_RUNTIME: '',
  PGUSER_AUTH: 'bsc_auth_login',
  PGPASSWORD_AUTH: '',
  SESSION_COOKIE_NAME: 'bsc_session',
  SESSION_TTL_HOURS: '8',
  COOKIE_SECURE: 'false',
  UPLOAD_DIR: 'storage/uploads-test',
  UPLOAD_MAX_BYTES: '20971520',
  ALLOWED_ORIGIN: 'http://localhost:5173',
};

for (const [key, value] of Object.entries(defaults)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}
