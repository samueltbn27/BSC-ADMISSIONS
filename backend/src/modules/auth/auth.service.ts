import { z } from 'zod';
import { callFn, DbError, lookupAccount } from '../../db/call.js';
import { ApiError } from '../../utils/http.js';
import { hashPassword, verifyPassword } from '../../utils/argon2id.js';
import type { Role } from '../../session/store.js';

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Format email tidak valid'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter').max(128),
});

export const registerSchema = credentialsSchema;

export async function register(email: string, password: string): Promise<{ id: string }> {
  const hash = await hashPassword(password);
  try {
    const id = await callFn('register_account', [email, hash]);
    return { id: String(id) };
  } catch (err) {
    if (err instanceof DbError && err.sqlState === '23505') {
      throw new ApiError(409, 'EMAIL_TAKEN', 'Email sudah terdaftar');
    }
    throw err;
  }
}

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi'),
  newPassword: z.string().min(8, 'Kata sandi baru minimal 8 karakter').max(128),
});

export async function changePassword(
  email: string,
  actorId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const account = await lookupAccount(email);
  if (!account) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Kata sandi saat ini salah');
  }
  const valid = await verifyPassword(currentPassword, account.password_hash);
  if (!valid) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Kata sandi saat ini salah');
  }
  const hash = await hashPassword(newPassword);
  await callFn('replace_password_hash', [actorId, hash]);
}

export async function login(
  email: string,
  password: string
): Promise<{ id: string; email: string; role: Role }> {
  const account = await lookupAccount(email);
  if (!account) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email atau kata sandi salah');
  }
  const valid = await verifyPassword(password, account.password_hash);
  if (!valid) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email atau kata sandi salah');
  }
  if (account.account_status !== 'active') {
    throw new ApiError(403, 'ACCOUNT_INACTIVE', 'Akun tidak aktif');
  }
  return { id: String(account.id), email, role: account.role_code as Role };
}
