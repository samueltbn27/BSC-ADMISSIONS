import pg from 'pg';
import { authPool, runtimePool } from './pool.js';

export class DbError extends Error {
  constructor(
    public sqlState: string,
    message: string
  ) {
    super(message);
    this.name = 'DbError';
  }
}

const RETRYABLE = new Set(['40001', '40P01']);

async function queryWithRetry(sql: string, params: unknown[]) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await runtimePool.query(sql, params);
    } catch (err) {
      if (err instanceof pg.DatabaseError) {
        if (RETRYABLE.has(err.code ?? '')) {
          continue;
        }
        throw new DbError(err.code ?? 'P0000', 'Database operation failed');
      }
      throw err;
    }
  }
  throw new Error('Transaksi database gagal setelah percobaan ulang');
}

export async function callFn(fn: string, params: unknown[] = []): Promise<unknown> {
  const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `SELECT bsc_api.${fn}(${placeholders}) AS result`;
  const result = await queryWithRetry(sql, params);
  return result.rows[0]?.result ?? null;
}

export async function selectFn(fn: string, params: unknown[] = []): Promise<any[]> {
  const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `SELECT * FROM bsc_api.${fn}(${placeholders})`;
  const result = await queryWithRetry(sql, params);
  return result.rows;
}

export async function lookupAccount(email: string) {
  const result = await authPool.query(
    `SELECT * FROM bsc_auth.lookup_account($1)`,
    [email]
  );
  return result.rows[0] ?? null;
}
