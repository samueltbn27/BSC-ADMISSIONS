import { Router } from 'express';
import { z } from 'zod';
import { callFn, selectFn } from '../../db/call.js';
import { requireAuth, requireRole, type AuthedRequest } from '../../middlewares/auth.js';
import { ApiError, asyncHandler, ok } from '../../utils/http.js';
import { register } from '../auth/auth.service.js';

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireRole('admin'));

const periodSchema = z.object({
  name: z.string().trim().min(1).max(100),
  academicYear: z.string().regex(/^\d{4}\/\d{4}$/, 'Format tahun ajaran YYYY/YYYY'),
  opensAt: z.coerce.date(),
  closesAt: z.coerce.date(),
  isActive: z.boolean().default(false),
});

const majorSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9]{1,15}$/, 'Kode jurusan 2-16 karakter huruf/angka, diawali huruf')
    .refine((c) => c !== 'TKJT', 'Kode tidak diizinkan'),
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(2000).optional(),
});

const majorUpdateSchema = majorSchema.omit({ code: true }).extend({
  isActive: z.boolean(),
});

const petugasSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  password: z.string().min(8).max(128),
  role: z.enum(['committee', 'admin']),
});

const petugasUpdateSchema = z.object({
  role: z.enum(['applicant', 'committee', 'admin']).optional(),
  accountStatus: z.enum(['active', 'suspended', 'closed']).optional(),
});

const announcementSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
  publish: z.boolean().default(false),
});

adminRoutes.get('/periode', asyncHandler(async (req: AuthedRequest, res) => {
  const periods = await callFn('list_periods', [req.user!.id]);
  ok(res, { periods });
}));

adminRoutes.post('/periode', asyncHandler(async (req: AuthedRequest, res) => {
  const body = periodSchema.parse(req.body);
  const id = await callFn('create_period', [
    req.user!.id, body.name, body.academicYear,
    body.opensAt.toISOString(), body.closesAt.toISOString(), body.isActive,
  ]);
  ok(res, { id }, 201);
}));

adminRoutes.patch('/periode/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = periodSchema.parse(req.body);
  await callFn('update_period', [
    req.user!.id, req.params.id, body.name, body.academicYear,
    body.opensAt.toISOString(), body.closesAt.toISOString(), body.isActive,
  ]);
  ok(res, { updated: true });
}));

adminRoutes.get('/jurusan', asyncHandler(async (req: AuthedRequest, res) => {
  const majors = await callFn('list_majors', [req.user!.id]);
  ok(res, { majors });
}));

adminRoutes.post('/jurusan', asyncHandler(async (req: AuthedRequest, res) => {
  const body = majorSchema.parse(req.body);
  const id = await callFn('create_major', [
    req.user!.id, body.code, body.name, body.description ?? null,
  ]);
  ok(res, { id }, 201);
}));

adminRoutes.patch('/jurusan/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = majorUpdateSchema.parse(req.body);
  await callFn('update_major', [
    req.user!.id, Number(req.params.id), body.name, body.description ?? null, body.isActive,
  ]);
  ok(res, { updated: true });
}));

adminRoutes.get('/petugas', asyncHandler(async (req: AuthedRequest, res) => {
  const role = typeof req.query.role === 'string' ? req.query.role : null;
  const limit = Number(req.query.limit ?? 50);
  const offset = Number(req.query.offset ?? 0);
  const users = await selectFn('list_users', [req.user!.id, role, limit, offset]);
  ok(res, { users, total: users.length });
}));

adminRoutes.post('/petugas', asyncHandler(async (req: AuthedRequest, res) => {
  const body = petugasSchema.parse(req.body);
  const { id } = await register(body.email, body.password);
  await callFn('manage_account', [req.user!.id, id, body.role, 'active']);
  ok(res, { id }, 201);
}));

adminRoutes.patch('/petugas/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = petugasUpdateSchema.parse(req.body);
  const account = (await callFn('get_account', [req.user!.id, req.params.id])) as any;
  if (!account) {
    throw new ApiError(404, 'NOT_FOUND', 'Akun tidak ditemukan');
  }
  await callFn('manage_account', [
    req.user!.id, req.params.id, body.role ?? account.role_code, body.accountStatus ?? account.account_status,
  ]);
  ok(res, { updated: true });
}));

adminRoutes.get('/pendaftar', asyncHandler(async (req: AuthedRequest, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : null;
  const limit = Number(req.query.limit ?? 50);
  const offset = Number(req.query.offset ?? 0);
  const applicants = await selectFn('list_applicants', [req.user!.id, q, limit, offset]);
  ok(res, { applicants, total: applicants.length });
}));

adminRoutes.get('/audit-log', asyncHandler(async (req: AuthedRequest, res) => {
  const limit = Number(req.query.limit ?? 50);
  const offset = Number(req.query.offset ?? 0);
  const logs = await selectFn('list_audit_logs', [req.user!.id, limit, offset]);
  ok(res, { logs, total: logs.length });
}));

adminRoutes.get('/pengumuman', asyncHandler(async (req: AuthedRequest, res) => {
  const announcements = await callFn('list_announcements', [req.user!.id]);
  ok(res, { announcements });
}));

adminRoutes.post('/pengumuman', asyncHandler(async (req: AuthedRequest, res) => {
  const body = announcementSchema.parse(req.body);
  const id = await callFn('create_announcement', [
    req.user!.id, body.title, body.body, body.publish,
  ]);
  ok(res, { id }, 201);
}));

adminRoutes.patch('/pengumuman/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = announcementSchema.parse(req.body);
  await callFn('update_announcement', [
    req.user!.id, req.params.id, body.title, body.body, body.publish,
  ]);
  ok(res, { updated: true });
}));

adminRoutes.delete('/pengumuman/:id', asyncHandler(async (req: AuthedRequest, res) => {
  await callFn('delete_announcement', [req.user!.id, req.params.id]);
  ok(res, { deleted: true });
}));
