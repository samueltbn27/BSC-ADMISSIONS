import { Router } from 'express';
import { callFn, selectFn } from '../../db/call.js';
import { requireAuth, requireRole, type AuthedRequest } from '../../middlewares/auth.js';
import { asyncHandler, ok } from '../../utils/http.js';

export const dashboardRoutes = Router();

dashboardRoutes.get(
  '/siswa',
  requireAuth,
  requireRole('applicant'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const [catalog, profile, applications] = await Promise.all([
      callFn('get_catalog'),
      callFn('get_my_profile', [req.user!.id]),
      selectFn('list_applications', [req.user!.id]),
    ]);
    const catalogAny = catalog as any;
    ok(res, {
      profile,
      applications,
      periods: catalogAny?.periods ?? [],
      majors: catalogAny?.majors ?? [],
      documentTypes: catalogAny?.document_types ?? [],
    });
  })
);

dashboardRoutes.get(
  '/panitia',
  requireAuth,
  requireRole('committee', 'admin'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const [catalog, rawApplicants] = await Promise.all([
      callFn('get_catalog'),
      selectFn('list_applicants', [req.user!.id, null, null, 100, 0]),
    ]);
    const applicants = rawApplicants.map((a: any) => ({
      user_id: a.user_id,
      full_name: a.full_name,
      phone: a.phone,
      application_id: a.application_id,
      registration_number: a.reg_no,
      status: a.st,
      created_at: a.created_at,
    }));
    const counts: Record<string, number> = {};
    for (const a of applicants) {
      const key = a.status ?? 'belum_ada_aplikasi';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    ok(res, {
      counts,
      total: applicants.length,
      recent: applicants.slice(0, 10),
      periods: (catalog as any)?.periods ?? [],
    });
  })
);

dashboardRoutes.get(
  '/admin',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const [users, rawApplicants, periods, announcements] = await Promise.all([
      selectFn('list_users', [req.user!.id, null, 100, 0]),
      selectFn('list_applicants', [req.user!.id, null, null, 100, 0]),
      callFn('list_periods', [req.user!.id]),
      callFn('list_announcements', [req.user!.id]),
    ]);
    const applicants = rawApplicants.map((a: any) => ({
      ...a,
      registration_number: a.reg_no,
      status: a.st,
    }));
    const roleCounts: Record<string, number> = {};
    for (const u of users) roleCounts[u.role_code] = (roleCounts[u.role_code] ?? 0) + 1;
    const statusCounts: Record<string, number> = {};
    for (const a of applicants) {
      const key = a.status ?? 'belum_ada_aplikasi';
      statusCounts[key] = (statusCounts[key] ?? 0) + 1;
    }
    ok(res, {
      roleCounts,
      statusCounts,
      totalApplicants: applicants.length,
      totalUsers: users.length,
      periods: periods as any,
      announcementCount: (announcements as any[])?.length ?? 0,
    });
  })
);
