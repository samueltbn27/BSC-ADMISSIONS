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

import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { hashPassword } from '../src/utils/argon2id.js';
import { DbError } from '../src/db/call.js';

const PHC_RE = /^\$argon2id\$v=19\$/;

describe('API Autentikasi', () => {
  beforeAll(() => {
    m.callFn.mockReset();
    m.lookupAccount.mockReset();
  });

  it('mendaftarkan calon siswa dan mengirim cookie sesi', async () => {
    m.callFn.mockResolvedValue('11111111-1111-1111-1111-111111111111');
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'Budi@Example.test', password: 'rahasia123' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('applicant');
    expect(res.body.data.user.email).toBe('budi@example.test');
    expect(res.headers['set-cookie']?.[0]).toContain('bsc_session=');
    expect(res.headers['set-cookie']?.[0]).toContain('HttpOnly');

    const [fn, params] = m.callFn.mock.calls[0];
    expect(fn).toBe('register_account');
    expect(params![0]).toBe('budi@example.test');
    expect(PHC_RE.test(String(params![1]))).toBe(true);
    expect(JSON.stringify(res.body)).not.toContain('$argon2id');
  });

  it('menolak email duplikat dengan 409', async () => {
    m.callFn.mockRejectedValue(new DbError('23505', 'duplicate'));
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'x@example.test', password: 'rahasia123' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('menolak password pendek', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'y@example.test', password: 'pendek' });
    expect(res.status).toBe(400);
  });

  it('login berhasil dengan hash yang valid', async () => {
    const hash = await hashPassword('rahasia123');
    m.lookupAccount.mockResolvedValue({
      id: '22222222-2222-2222-2222-222222222222',
      email: 'budi@example.test',
      password_hash: hash,
      role_code: 'applicant',
      account_status: 'active',
      password_changed_at: new Date(),
    });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'budi@example.test', password: 'rahasia123' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('applicant');
    expect(res.headers['set-cookie']?.[0]).toContain('bsc_session=');
  });

  it('login ditolak untuk password salah dengan pesan generik', async () => {
    const hash = await hashPassword('rahasia123');
    m.lookupAccount.mockResolvedValue({
      id: '22222222-2222-2222-2222-222222222222',
      email: 'budi@example.test',
      password_hash: hash,
      role_code: 'applicant',
      account_status: 'active',
      password_changed_at: new Date(),
    });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'budi@example.test', password: 'salahsekali' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('login ditolak untuk email tidak dikenal tanpa enumerasi', async () => {
    m.lookupAccount.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'tidak@ada.test', password: 'rahasia123' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('login ditolak untuk akun ditangguhkan', async () => {
    const hash = await hashPassword('rahasia123');
    m.lookupAccount.mockResolvedValue({
      id: '22222222-2222-2222-2222-222222222222',
      email: 'budi@example.test',
      password_hash: hash,
      role_code: 'applicant',
      account_status: 'suspended',
      password_changed_at: new Date(),
    });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'budi@example.test', password: 'rahasia123' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });

  it('GET /auth/me ditolak tanpa sesi', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('logout mengakhiri sesi', async () => {
    m.lookupAccount.mockResolvedValue({
      id: '33333333-3333-3333-3333-333333333333',
      email: 'c@example.test',
      password_hash: await hashPassword('rahasia123'),
      role_code: 'admin',
      account_status: 'active',
      password_changed_at: new Date(),
    });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'c@example.test', password: 'rahasia123' });
    console.log('LOGIN', login.status, JSON.stringify(login.headers['set-cookie']));
    const cookie = login.headers['set-cookie']?.[0].split(';')[0];

    const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    console.log('ME', me.status, JSON.stringify(me.body));
    expect(me.status).toBe(200);

    const out = await request(app).post('/api/v1/auth/logout').set('Cookie', cookie);
    expect(out.status).toBe(200);

    const after = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(after.status).toBe(401);
  });
});
