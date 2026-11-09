import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { csrfGuard } from './middlewares/csrf.js';
import { errorHandler } from './middlewares/error.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { catalogRoutes } from './modules/catalog/catalog.routes.js';
import { profileRoutes } from './modules/profile/profile.routes.js';
import { applicationRoutes } from './modules/applications/applications.routes.js';
import { documentRoutes } from './modules/documents/documents.routes.js';
import { verificationRoutes } from './modules/verification/verification.routes.js';
import { selectionRoutes } from './modules/selection/selection.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { publicRoutes } from './modules/public/public.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));

const noop = (_req: express.Request, _res: express.Response, next: express.NextFunction) => next();

const globalLimiter =
  env.NODE_ENV === 'test'
    ? noop
    : rateLimit({
        windowMs: 60 * 1000,
        limit: 300,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: { code: 'RATE_LIMITED', message: 'Terlalu banyak permintaan' } },
      });
app.use(globalLimiter);

const authLimiter =
  env.NODE_ENV === 'test'
    ? noop
    : rateLimit({
        windowMs: 60 * 1000,
        limit: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan login' } },
      });

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authLimiter, csrfGuard, authRoutes);
app.use('/api/v1', csrfGuard, publicRoutes);
app.use('/api/v1/catalog', csrfGuard, catalogRoutes);
app.use('/api/v1/siswa/profil', csrfGuard, profileRoutes);
app.use('/api/v1/pendaftaran', csrfGuard, applicationRoutes);
app.use('/api/v1/dokumen', csrfGuard, documentRoutes);
app.use('/api/v1/verifikasi', csrfGuard, verificationRoutes);
app.use('/api/v1/hasil-seleksi', csrfGuard, selectionRoutes);
app.use('/api/v1/admin', csrfGuard, adminRoutes);
app.use('/api/v1/dashboard', csrfGuard, dashboardRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan' } });
});

app.use(errorHandler);
