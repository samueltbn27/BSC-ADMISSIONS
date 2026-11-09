import { app } from './app.js';
import { env } from './config/env.js';
import { runtimePool, authPool } from './db/pool.js';

async function main() {
  await runtimePool.query('SELECT 1');
  await authPool.query('SELECT 1');

  const server = app.listen(env.PORT, () => {
    console.log(`BSC Admissions API berjalan di http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} diterima, menutup server...`);
    server.close(() => {
      void runtimePool.end();
      void authPool.end();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Gagal memulai server:', err);
  process.exit(1);
});
