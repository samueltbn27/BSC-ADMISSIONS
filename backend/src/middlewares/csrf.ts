import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfGuard(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

  const allowedOrigin = new URL(env.ALLOWED_ORIGIN).origin;

  const check = (value: string | undefined): boolean => {
    if (!value) return true;
    try {
      return new URL(value).origin === allowedOrigin;
    } catch {
      return false;
    }
  };

  if (!check(req.headers.origin) || !check(req.headers.referer)) {
    return next(new ApiError(403, 'CSRF_DENIED', 'Asal permintaan tidak diizinkan'));
  }
  next();
}
