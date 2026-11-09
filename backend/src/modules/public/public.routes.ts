import { Router } from 'express';
import { callFn } from '../../db/call.js';
import { asyncHandler, ok } from '../../utils/http.js';

export const publicRoutes = Router();

publicRoutes.get(
  '/pengumuman/public',
  asyncHandler(async (_req, res) => {
    const announcements = await callFn('list_published_announcements');
    ok(res, { announcements });
  })
);
