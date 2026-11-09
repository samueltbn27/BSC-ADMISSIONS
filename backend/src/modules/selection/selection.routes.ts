import { Router } from 'express';
import { z } from 'zod';
import { callFn, selectFn } from '../../db/call.js';
import { requireAuth, requireRole, type AuthedRequest } from '../../middlewares/auth.js';
import { asyncHandler, ok } from '../../utils/http.js';

export const selectionRoutes = Router();

const resultSchema = z.object({
  applicationId: z.string().uuid(),
  outcome: z.enum(['accepted', 'waitlisted', 'rejected']),
  note: z.string().trim().max(1000).optional(),
  announcementAt: z.coerce.date(),
});

const updateResultSchema = resultSchema.omit({ applicationId: true });

selectionRoutes.get(
  '/me',
  requireAuth,
  requireRole('applicant'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const rows = await selectFn('list_applications', [req.user!.id]);
    const results = [];
    for (const row of rows) {
      const app = (await callFn('get_application', [req.user!.id, row.id])) as any;
      if (app?.selection_result) {
        results.push({
          applicationId: row.id,
          registrationNumber: row.registration_number,
          ...app.selection_result,
        });
      }
    }
    ok(res, { results });
  })
);

selectionRoutes.use(requireAuth, requireRole('admin'));

selectionRoutes.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = resultSchema.parse(req.body);
    const id = await callFn('save_selection_result', [
      req.user!.id,
      body.applicationId,
      body.outcome,
      body.note ?? null,
      body.announcementAt.toISOString(),
    ]);
    ok(res, { id }, 201);
  })
);

selectionRoutes.patch(
  '/:applicationId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = updateResultSchema.parse(req.body);
    const id = await callFn('save_selection_result', [
      req.user!.id,
      req.params.applicationId,
      body.outcome,
      body.note ?? null,
      body.announcementAt.toISOString(),
    ]);
    ok(res, { id });
  })
);

selectionRoutes.post(
  '/:applicationId/publish',
  asyncHandler(async (req: AuthedRequest, res) => {
    await callFn('publish_selection_result', [req.user!.id, req.params.applicationId]);
    ok(res, { published: true });
  })
);
