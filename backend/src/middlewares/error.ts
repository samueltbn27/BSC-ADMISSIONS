import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { DbError } from '../db/call.js';
import { ApiError } from '../utils/http.js';

function mapDbError(err: DbError): { status: number; code: string; message: string } {
  const state = err.sqlState;
  if (state === '42501') return { status: 403, code: 'FORBIDDEN', message: 'Akses ditolak' };
  if (state === '23505') return { status: 409, code: 'CONFLICT', message: 'Data sudah ada' };
  if (['23514', '23502', '23503', '23001', '22P02', '22023'].includes(state)) {
    return { status: 400, code: 'VALIDATION_ERROR', message: 'Permintaan tidak valid' };
  }
  return { status: 500, code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan internal' };
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = crypto.randomUUID();

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Terjadi kesalahan internal';

  if (err instanceof ApiError) {
    status = err.status;
    code = err.code;
    message = err.message;
  } else if (err instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Permintaan tidak valid';
  } else if (err instanceof DbError) {
    const mapped = mapDbError(err);
    status = mapped.status;
    code = mapped.code;
    message = mapped.message;
  }

  if (status >= 500) {
    console.error(`[${requestId}] ${req.method} ${req.originalUrl}`, err);
  }

  res.setHeader('X-Request-Id', requestId);
  res.status(status).json({
    error: { code, message, requestId },
  });
}
