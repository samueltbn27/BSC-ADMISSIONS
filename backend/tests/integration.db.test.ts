import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

const runDb = Boolean(process.env.RUN_DB_TESTS);

describe.skipIf(!runDb)('Integrasi Database Nyata (RUN_DB_TESTS=1)', () => {
  it('katalog publik tersedia', async () => {
    const res = await request(app).get('/api/v1/catalog');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.majors)).toBe(true);
    expect(res.body.data.majors.length).toBeGreaterThanOrEqual(5);
    expect(res.body.data.document_types.length).toBeGreaterThanOrEqual(4);
  });

  it('alur registrasi -> login -> profil', async () => {
    const email = `e2e-${Date.now()}@example.test`;
    const password = 'rahasia123';

    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password });
    expect(reg.status).toBe(201);
    const cookie = reg.headers['set-cookie']?.[0].split(';')[0];
    expect(cookie).toBeTruthy();

    const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(email);

    const profile = await request(app)
      .put('/api/v1/siswa/profil')
      .set('Cookie', cookie)
      .send({
        fullName: 'Calon Siswa E2E',
        birthplace: 'Jakarta',
        birthDate: '2010-05-01',
        gender: 'L',
        address: 'Jl. Contoh No. 1',
        phone: '+6281234567890',
      });
    expect(profile.status).toBe(200);

    const got = await request(app).get('/api/v1/siswa/profil').set('Cookie', cookie);
    expect(got.status).toBe(200);
    expect(got.body.data.profile.full_name).toBe('Calon Siswa E2E');

    const dup = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password });
    expect(dup.status).toBe(409);
  });
});
