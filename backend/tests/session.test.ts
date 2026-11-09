import { beforeEach, describe, expect, it } from 'vitest';
import { sessionStore } from '../src/session/store.js';

describe('sessionStore', () => {
  beforeEach(() => {
    sessionStore.size();
  });

  it('membuat dan membaca sesi', () => {
    const session = sessionStore.create({ id: 'u1', email: 'a@example.test', role: 'applicant' });
    expect(session.sid).toBeTruthy();
    const got = sessionStore.get(session.sid);
    expect(got?.id).toBe('u1');
    expect(got?.role).toBe('applicant');
  });

  it('mengembalikan null untuk sesi yang tidak dikenal', () => {
    expect(sessionStore.get('tidak-ada')).toBeNull();
  });

  it('menghapus sesi saat logout', () => {
    const session = sessionStore.create({ id: 'u1', email: 'a@example.test', role: 'admin' });
    sessionStore.delete(session.sid);
    expect(sessionStore.get(session.sid)).toBeNull();
  });

  it('menolak sesi yang kedaluwarsa', () => {
    const session = sessionStore.create({ id: 'u1', email: 'a@example.test', role: 'admin' });
    session.expiresAt = Date.now() - 1;
    expect(sessionStore.get(session.sid)).toBeNull();
  });
});
