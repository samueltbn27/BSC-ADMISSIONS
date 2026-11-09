import { Router } from 'express';
import { z } from 'zod';
import { callFn } from '../../db/call.js';
import { requireAuth, requireRole, type AuthedRequest } from '../../middlewares/auth.js';
import { asyncHandler, ok } from '../../utils/http.js';

export const verificationRoutes = Router();

const verifySchema = z.object({
  status: z.enum(['approved', 'correction_requested']),
  note: z.string().trim().max(1000).optional(),
});

verificationRoutes.use(requireAuth, requireRole('committee', 'admin'));

verificationRoutes.get(
  '/pendaftaran/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const application = await callFn('get_application', [req.user!.id, req.params.id]);
    ok(res, application);
  })
);

verificationRoutes.post(
  '/dokumen/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = verifySchema.parse(req.body);
    await callFn('verify_document', [req.user!.id, req.params.id, body.status, body.note ?? null]);
    ok(res, { verified: true });
  })
);
