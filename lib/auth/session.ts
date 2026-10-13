import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const SESSION_SECRET = process.env.SESSION_SECRET || 'the-date-crew-secret-session-key-2026-production-ready';
const COOKIE_NAME = 'tdc_session';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SessionData {
  user: SessionUser;
  expiresAt: number;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

export function signToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifyToken<T>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const jsonStr = Buffer.from(data, 'base64url').toString('utf8');
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser): Promise<string> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const sessionData: SessionData = { user, expiresAt };
  const token = signToken(sessionData);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  return token;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const session = verifyToken<SessionData>(token);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      await clearSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // Ignore cookie store errors in non-request contexts
  }
}
