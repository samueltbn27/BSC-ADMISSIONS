import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { sessionStore, type Role } from '../session/store.js';
import { ApiError } from '../utils/http.js';

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    sessionId: string;
  };
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const sid = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (!sid) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Sesi tidak ditemukan'));
  }
  const session = sessionStore.get(sid);
  if (!session) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Sesi kedaluwarsa'));
  }
  req.user = {
    id: session.id,
    email: session.email,
    role: session.role,
    sessionId: session.sid,
  };
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'FORBIDDEN', 'Akses ditolak'));
    }
    next();
  };
}
