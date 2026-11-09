import path from 'node:path';
import crypto from 'node:crypto';

export type SafeMime = 'application/pdf' | 'image/jpeg' | 'image/png';

export const EXT_BY_MIME: Record<SafeMime, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export function sniffMime(buf: Buffer): SafeMime | null {
  if (buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') {
    return 'application/pdf';
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.length >= 8 && buf.subarray(0, 8).equals(pngMagic)) {
    return 'image/png';
  }
  return null;
}

export function randomObjectKey(): string {
  return crypto.randomUUID();
}

export function resolveStoragePath(storageKey: string, uploadRoot: string): string {
  if (!/^applications\/[a-f0-9-]{36}\/[a-f0-9-]{36}$/.test(storageKey)) {
    throw new Error('Invalid storage key');
  }
  return path.join(uploadRoot, storageKey);
}
