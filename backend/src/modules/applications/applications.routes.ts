import { Router } from 'express';
import { z } from 'zod';
import { callFn, selectFn } from '../../db/call.js';
import { requireAuth, requireRole, type AuthedRequest } from '../../middlewares/auth.js';
import { asyncHandler, ok } from '../../utils/http.js';

export const applicationRoutes = Router();

const STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'correction_requested',
  'verified',
  'selection_in_progress',
  'completed',
  'withdrawn',
] as const;

const createSchema = z.object({
  periodId: z.string().uuid(),
  majorId: z.coerce.number().int().positive(),
});

const changeMajorSchema = z.object({
  majorId: z.coerce.number().int().positive(),
});

const staffStatusSchema = z.object({
  status: z.enum(STATUSES),
  note: z.string().trim().max(1000).optional(),
});

applicationRoutes.get(
  '/me',
  requireAuth,
  requireRole('applicant'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const rows = await selectFn('list_applications', [req.user!.id]);
    ok(res, { applications: rows });
  })
);

applicationRoutes.post(
  '/',
  requireAuth,
  requireRole('applicant'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = createSchema.parse(req.body);
    const id = await callFn('create_application', [req.user!.id, body.periodId, body.majorId]);
    ok(res, { id }, 201);
  })
);

applicationRoutes.get(
  '/',
  requireAuth,
  requireRole('committee', 'admin'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { q, status, limit, offset } = z.object({
      q: z.string().trim().max(150).optional(),
      status: z.enum(STATUSES).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
      offset: z.coerce.number().int().min(0).max(100000).default(0),
    }).parse(req.query);

    const [rows, total] = await Promise.all([
      selectFn('list_applicants', [req.user!.id, q ?? null, status ?? null, limit, offset]),
      callFn('count_applicants', [req.user!.id, q ?? null, status ?? null]),
    ]);
    const applicants = rows.map((r) => ({
      user_id: r.user_id,
      full_name: r.full_name,
      phone: r.phone,
      application_id: r.application_id,
      registration_number: r.reg_no,
      status: r.st,
      created_at: r.created_at,
    }));
    ok(res, { applicants, total: Number(total ?? applicants.length) });
  })
);

applicationRoutes.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const application = await callFn('get_application', [req.user!.id, req.params.id]);
    ok(res, application);
  })
);

applicationRoutes.patch(
  '/:id',
  requireAuth,
  requireRole('applicant'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = changeMajorSchema.parse(req.body);
    await callFn('change_major', [req.user!.id, req.params.id, body.majorId]);
    ok(res, { updated: true });
  })
);

applicationRoutes.post(
  '/:id/submit',
  requireAuth,
  requireRole('applicant'),
  asyncHandler(async (req: AuthedRequest, res) => {
    await callFn('change_application_status', [req.user!.id, req.params.id, 'submitted', null]);
    ok(res, { submitted: true });
  })
);

applicationRoutes.post(
  '/:id/withdraw',
  requireAuth,
  requireRole('applicant'),
  asyncHandler(async (req: AuthedRequest, res) => {
    await callFn('change_application_status', [req.user!.id, req.params.id, 'withdrawn', null]);
    ok(res, { withdrawn: true });
  })
);

applicationRoutes.post(
  '/:id/status',
  requireAuth,
  requireRole('committee', 'admin'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = staffStatusSchema.parse(req.body);
    await callFn('change_application_status', [
      req.user!.id,
      req.params.id,
      body.status,
      body.note ?? null,
    ]);
    ok(res, { status: body.status });
  })
);
