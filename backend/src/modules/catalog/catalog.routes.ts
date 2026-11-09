import { Router } from 'express';
import { callFn } from '../../db/call.js';
import { asyncHandler, ok } from '../../utils/http.js';

export const catalogRoutes = Router();

catalogRoutes.get(
  '/',
  asyncHandler(async (_req, res) => {
    const catalog = await callFn('get_catalog');
    ok(res, catalog);
  })
);
