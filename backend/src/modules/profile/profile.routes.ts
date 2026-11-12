import { Router } from 'express';
import { z } from 'zod';
import { callFn } from '../../db/call.js';
import { requireAuth, requireRole, type AuthedRequest } from '../../middlewares/auth.js';
import { asyncHandler, ok } from '../../utils/http.js';

export const profileRoutes = Router();

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(150),
  birthplace: z.preprocess(emptyToNull, z.string().trim().min(1).max(100).nullable()),
  birthDate: z.preprocess(
    emptyToNull,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v &&
        v >= '1900-01-01' && v <= new Date().toISOString().slice(0, 10);
    }, 'Tanggal lahir tidak valid').nullable()
  ),
  gender: z.preprocess(emptyToNull, z.enum(['L', 'P']).nullable()),
  address: z.preprocess(emptyToNull, z.string().trim().min(1).max(1000).nullable()),
  phone: z.preprocess(
    emptyToNull,
    z.string().regex(/^\+[1-9][0-9]{7,14}$/, 'Format telepon harus E.164, mis. +6281234567890').nullable()
  ),
});

profileRoutes.use(requireAuth, requireRole('applicant'));

profileRoutes.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await callFn('get_my_profile', [req.user!.id]);
    ok(res, { profile });
  })
);

profileRoutes.put(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = profileSchema.parse(req.body);
    const id = await callFn('save_profile', [
      req.user!.id,
      body.fullName,
      body.birthplace,
      body.birthDate,
      body.gender,
      body.address,
      body.phone,
    ]);
    ok(res, { profileId: id });
  })
);

