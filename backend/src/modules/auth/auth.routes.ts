import { Router } from 'express';
import { env } from '../../config/env.js';
import { sessionStore } from '../../session/store.js';
import { requireAuth, type AuthedRequest } from '../../middlewares/auth.js';
import { ApiError, asyncHandler, ok } from '../../utils/http.js';
import { credentialsSchema, login, register } from './auth.service.js';

export const authRoutes = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.COOKIE_SECURE,
  path: '/',
  maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
};

authRoutes.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = credentialsSchema.parse(req.body);
    const { id } = await register(body.email, body.password);
    const session = sessionStore.create({ id, email: body.email, role: 'applicant' });
    res.cookie(env.SESSION_COOKIE_NAME, session.sid, cookieOptions);
    ok(res, { user: { id, email: body.email, role: 'applicant' } }, 201);
  })
);

authRoutes.post(
  '/login',
  asyncHandler(async (req, res) => {
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
