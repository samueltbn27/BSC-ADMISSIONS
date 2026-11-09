import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/argon2id.js';

const PHC_RE = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;

describe('Argon2id (hash-wasm)', () => {
  it('menghasilkan hash PHC yang memenuhi constraint database', async () => {
    const hash = await hashPassword('rahasia123');
    const match = PHC_RE.exec(hash);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(19456);
    expect(Number(match![1])).toBeLessThanOrEqual(1048576);
    expect(Number(match![2])).toBeGreaterThanOrEqual(2);
    expect(Number(match![2])).toBeLessThanOrEqual(20);
    expect(Number(match![3])).toBeGreaterThanOrEqual(1);
    expect(Number(match![3])).toBeLessThanOrEqual(16);
    expect(hash.length).toBeGreaterThanOrEqual(90);
    expect(hash.length).toBeLessThanOrEqual(512);
  });

  it('verifikasi benar untuk password yang sama', async () => {
    const password = 'rahasia123';
    const hash = await hashPassword(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it('menolak password yang salah', async () => {
    const hash = await hashPassword('rahasia123');
    await expect(verifyPassword('rahasia124', hash)).resolves.toBe(false);
  });

  it('menghasilkan salt acak pada setiap hash', async () => {
    const a = await hashPassword('rahasia123');
    const b = await hashPassword('rahasia123');
    expect(a).not.toBe(b);
  });

  it('menolak string yang bukan PHC', async () => {
    await expect(verifyPassword('x', 'plaintext')).resolves.toBe(false);
  });
});
