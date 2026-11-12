import { Router } from 'express';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { callFn } from '../../db/call.js';
import { env } from '../../config/env.js';
import { requireAuth, requireRole, type AuthedRequest } from '../../middlewares/auth.js';
import { ApiError, asyncHandler, ok } from '../../utils/http.js';
import { EXT_BY_MIME, randomObjectKey, resolveStoragePath, validateContent } from '../../utils/files.js';

export const documentRoutes = Router();

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_BYTES, files: 1, fields: 2, parts: 3, fieldSize: 200 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname) return cb(new Error('File wajib diunggah'));
    cb(null, true);
  },
});

const uploadSchema = z.object({
  applicationId: z.string().uuid(),
  documentTypeId: z.coerce.number().int().positive(),
});

documentRoutes.get(
  '/types',
  asyncHandler(async (_req, res) => {
    const catalog = (await callFn('get_catalog')) as any;
    ok(res, { documentTypes: catalog?.document_types ?? [] });
  })
);

documentRoutes.post(
  '/',
  requireAuth,
  requireRole('applicant'),
  upload.single('file'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = uploadSchema.parse(req.body);
    if (!req.file) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'File wajib diunggah');
    }

    // Authorize before decoding or writing any file. DB repeats this check atomically.
    const owned = await callFn('get_application', [req.user!.id, body.applicationId]) as any;
    if (!['draft', 'correction_requested'].includes(owned.application.status)) {
      throw new ApiError(409, 'LOCKED', 'Dokumen hanya dapat diganti saat draft atau perbaikan.');
    }

    const catalog = (await callFn('get_catalog')) as any;
    const docType = (catalog?.document_types ?? []).find(
      (t: any) => String(t.id) === String(body.documentTypeId) && t.is_active
    );
    if (!docType) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Jenis dokumen tidak valid');
    }

    const sniffed = await validateContent(req.file.buffer);
    const extension = path.extname(req.file.originalname).toLowerCase();
    const extensions = sniffed === 'application/pdf' ? ['.pdf'] : sniffed === 'image/png' ? ['.png'] : ['.jpg', '.jpeg'];
    if (!sniffed || sniffed !== req.file.mimetype || !extensions.includes(extension) || !docType.allowed_mime_types.includes(sniffed)) {
      throw new ApiError(400, 'INVALID_FILE', 'Format file tidak diizinkan');
    }
    if (req.file.size > docType.max_size_bytes) {
      throw new ApiError(400, 'FILE_TOO_LARGE', `Ukuran file melebihi batas ${Math.floor(docType.max_size_bytes / 1024 / 1024)} MB`);
    }

    const storageKey = `applications/${body.applicationId}/${randomObjectKey()}`;
    const destination = resolveStoragePath(storageKey, uploadRoot);
    await fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    await fs.writeFile(destination, req.file.buffer, { flag: 'wx', mode: 0o600 });

    try {
      const id = await callFn('put_document', [
        req.user!.id,
        body.applicationId,
        body.documentTypeId,
        storageKey,
        sniffed,
        req.file.size,
      ]);
      ok(res, { id }, 201);
    } catch (err) {
      await fs.rm(destination, { force: true });
      throw err;
    }
  })
);

documentRoutes.get(
  '/pendaftaran/:id',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const application = (await callFn('get_application', [req.user!.id, req.params.id])) as any;
    ok(res, { documents: application?.documents ?? [] });
  })
);

documentRoutes.get(
  '/:id/download',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const doc = (await callFn('get_document', [req.user!.id, req.params.id])) as any;
    if (!doc) throw new ApiError(404, 'NOT_FOUND', 'Dokumen tidak ditemukan');
    const filePath = resolveStoragePath(doc.storage_key, uploadRoot);
    let stat;
    try {
      stat = await fs.stat(filePath);
    } catch {
      throw new ApiError(404, 'NOT_FOUND', 'Berkas tidak ditemukan');
    }
    if (!stat.isFile()) throw new ApiError(404, 'NOT_FOUND', 'Berkas tidak ditemukan');
    const ext = EXT_BY_MIME[doc.mime_type as keyof typeof EXT_BY_MIME] ?? 'bin';
    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Length', String(stat.size));
    res.setHeader('Content-Disposition', `attachment; filename="dokumen-${doc.id}.${ext}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    const stream = (await import('node:fs')).createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) res.status(500).end();
    });
    stream.pipe(res);
  })
);

documentRoutes.delete(
  '/:id',
  requireAuth,
  requireRole('applicant'),
  asyncHandler(async (_req, _res) => {
    throw new ApiError(
      409,
      'REPLACE_ONLY',
      'Dokumen diganti dengan mengunggah versi baru; penghapusan slot tidak didukung skema'
    );
  })
);
