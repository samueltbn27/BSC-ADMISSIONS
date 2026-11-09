import crypto from 'node:crypto';
import { env } from '../config/env.js';

export type Role = 'applicant' | 'committee' | 'admin';

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}

interface SessionRecord extends SessionUser {
  sid: string;
  createdAt: number;
  expiresAt: number;
}

const TTL_MS = env.SESSION_TTL_HOURS * 60 * 60 * 1000;
const sessions = new Map<string, SessionRecord>();

export const sessionStore = {
  create(user: SessionUser): SessionRecord {
    const record: SessionRecord = {
      ...user,
      sid: crypto.randomBytes(32).toString('hex'),
      createdAt: Date.now(),
      expiresAt: Date.now() + TTL_MS,
    };
    sessions.set(record.sid, record);
    return record;
  },

  get(sid: string): SessionRecord | null {
    const record = sessions.get(sid);
    if (!record) return null;
    if (record.expiresAt <= Date.now()) {
      sessions.delete(sid);
      return null;
    }
    record.expiresAt = Date.now() + TTL_MS;
    return record;
  },

  delete(sid: string): void {
    sessions.delete(sid);
  },

  deleteAllForUser(userId: string): void {
    for (const [sid, record] of sessions) {
      if (record.id === userId) sessions.delete(sid);
    }
  },

  size(): number {
    return sessions.size;
  },
};
