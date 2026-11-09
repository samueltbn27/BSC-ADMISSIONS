import { vi } from 'vitest';

const m = vi.hoisted(() => ({
  callFn: vi.fn(),
  selectFn: vi.fn(),
  lookupAccount: vi.fn(),
}));

vi.mock('../src/db/call.js', () => ({
  DbError: class DbError extends Error {
    constructor(
      public sqlState: string,
      message: string
    ) {
      super(message);
      this.name = 'DbError';
    }
  },
  callFn: m.callFn,
  selectFn: m.selectFn,
  lookupAccount: m.lookupAccount,
}));

import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { sessionStore } from '../src/session/store.js';
import { DbError } from '../src/db/call.js';

function cookieFor(role: 'applicant' | 'committee' | 'admin') {
  const session = sessionStore.create({ id: 'u-1', email: 'x@example.test', role });
  return { Cookie: `bsc_session=${session.sid}` };
}

describe('Keamanan Endpoint', () => {
  beforeEach(() => {
    m.callFn.mockReset();
    m.selectFn.mockReset();
    m.lookupAccount.mockReset();
  });

  it('menolak permintaan mutasi dari origin asing (CSRF)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: 'a@example.test', password: 'rahasia123' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_DENIED');
  });

  it('menolak akses admin tanpa sesi', async () => {
    const res = await request(app).get('/api/v1/admin/periode');
    expect(res.status).toBe(401);
  });

  it('menolak akses admin oleh calon siswa', async () => {
    m.callFn.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/v1/admin/periode')
      .set(cookieFor('applicant'));
    expect(res.status).toBe(403);
  });

  it('menolak akses panitia oleh calon siswa', async () => {
    const res = await request(app)
      .get('/api/v1/pendaftaran?limit=10')
      .set(cookieFor('applicant'));
    expect(res.status).toBe(403);
  });

  it('mengizinkan akses panitia ke antrean pendaftaran', async () => {
    m.selectFn.mockResolvedValue([]);
    m.callFn.mockResolvedValue(0);
    const res = await request(app)
      .get('/api/v1/pendaftaran?limit=10')
      .set(cookieFor('committee'));
    expect(res.status).toBe(200);
    expect(m.selectFn).toHaveBeenCalledWith('list_applicants', ['u-1', null, null, 10, 0]);
    expect(m.callFn).toHaveBeenCalledWith('count_applicants', ['u-1', null, null]);
  });

  it('menolak input tidak valid pada endpoint profil', async () => {
    const res = await request(app)
      .put('/api/v1/siswa/profil')
      .set(cookieFor('applicant'))
      .send({ fullName: '', gender: 'X' });
    expect(res.status).toBe(400);
  });

  it('tidak membocorkan SQLSTATE/detail internal ke client', async () => {
    m.callFn.mockRejectedValue(new DbError('22P02', 'invalid'));
    const res = await request(app)
      .post('/api/v1/pendaftaran')
      .set(cookieFor('applicant'))
      .send({ periodId: '00000000-0000-0000-0000-000000000000', majorId: 1 });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toContain('22P02');
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
