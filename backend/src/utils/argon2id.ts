import crypto from 'node:crypto';
import { argon2id } from 'hash-wasm';

const MEMORY_KIB = 65536;
const ITERATIONS = 3;
const PARALLELISM = 1;
const HASH_LENGTH = 32;

export function generateSalt(): Buffer {
  return crypto.randomBytes(16);
}

function toBase64Unpadded(buf: Buffer): string {
  return buf.toString('base64').replace(/=+$/, '');
}

export async function hashPassword(password: string, salt: Buffer = generateSalt()): Promise<string> {
  const raw = await argon2id({
    password,
    salt,
    parallelism: PARALLELISM,
    iterations: ITERATIONS,
    memorySize: MEMORY_KIB,
    hashLength: HASH_LENGTH,
    outputType: 'binary',
  });
  return (
    `$argon2id$v=19$m=${MEMORY_KIB},t=${ITERATIONS},p=${PARALLELISM}$` +
    `${toBase64Unpadded(salt)}$` +
    toBase64Unpadded(Buffer.from(raw))
  );
}

const PHC_RE = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;

export async function verifyPassword(password: string, phc: string): Promise<boolean> {
  const match = PHC_RE.exec(phc);
  if (!match) return false;
  const memory = Number(match[1]);
  const iterations = Number(match[2]);
  const parallelism = Number(match[3]);
  const salt = Buffer.from(match[4], 'base64');
  const expected = Buffer.from(match[5], 'base64');

  const raw = await argon2id({
    password,
    salt,
    parallelism,
    iterations,
    memorySize: memory,
    hashLength: expected.length,
    outputType: 'binary',
  });
  const actual = Buffer.from(raw);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
