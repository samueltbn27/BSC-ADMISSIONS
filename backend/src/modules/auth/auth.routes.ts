import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { sessionStore } from '../../session/store.js';
import { requireAuth, type AuthedRequest } from '../../middlewares/auth.js';
import { ApiError, asyncHandler, ok } from '../../utils/http.js';
import { changePassword, changePasswordSchema, credentialsSchema, login, register } from './auth.service.js';

export const authRoutes = Router();

const authLimiter =
  env.NODE_ENV === 'test'
    ? (_req: any, _res: any, next: any) => next()
    : rateLimit({
        windowMs: 60 * 1000,
        limit: env.RATE_LIMIT_AUTH_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan login' } },
      });

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.COOKIE_SECURE,
  path: '/',
  maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
};

authRoutes.post('/register', authLimiter, asyncHandler(async (req, res) => {
    const body = credentialsSchema.parse(req.body);
    const { id } = await register(body.email, body.password);
    const session = sessionStore.create({ id, email: body.email, role: 'applicant' });
    res.cookie(env.SESSION_COOKIE_NAME, session.sid, cookieOptions);
    ok(res, { user: { id, email: body.email, role: 'applicant' } }, 201);
  })
);

authRoutes.post('/login', authLimiter, asyncHandler(async (req, res) => {
    const body = credentialsSchema.parse(req.body);
    const user = await login(body.email, body.password);
    const session = sessionStore.create(user);
    res.cookie(env.SESSION_COOKIE_NAME, session.sid, cookieOptions);
    ok(res, { user });
  })
);

authRoutes.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    sessionStore.delete(req.user!.sessionId);
    res.clearCookie(env.SESSION_COOKIE_NAME, { httpOnly: true, path: '/' });
    ok(res, { logout: true });
  })
);

authRoutes.post('/change-password', authLimiter, requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
    const body = changePasswordSchema.parse(req.body);
    await changePassword(req.user!.email, req.user!.id, body.currentPassword, body.newPassword);
    sessionStore.deleteAllForUser(req.user!.id);
    res.clearCookie(env.SESSION_COOKIE_NAME, { httpOnly: true, path: '/' });
    ok(res, { changed: true, reauthenticate: true });
  })
);

authRoutes.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = req.user!;
    ok(res, { user: { id: user.id, email: user.email, role: user.role } });
  })
);

authRoutes.use(() => {
  throw new ApiError(404, 'NOT_FOUND', 'Endpoint tidak ditemukan');
});
