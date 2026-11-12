import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
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
    message = err.issues.slice(0, 3).map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  } else if (err instanceof multer.MulterError) {
    status = 400;
    code = 'INVALID_UPLOAD';
    message = 'Berkas terlalu besar atau formulir unggah tidak valid.';
  } else if (err instanceof SyntaxError || (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.too.large')) {
    status = 400;
    code = 'INVALID_BODY';
    message = 'Isi permintaan tidak valid atau terlalu besar.';
  } else if (err instanceof DbError) {
    const mapped = mapDbError(err);
    status = mapped.status;
    code = mapped.code;
    message = mapped.message;
  }

  if (status >= 500) {
    // Never log body, cookies, hashes, SQL details, or attacker-controlled query strings.
    console.error(`[${requestId}] ${req.method} internal-error`);
  }

  res.setHeader('X-Request-Id', requestId);
  res.status(status).json({
    error: { code, message, requestId },
  });
}
