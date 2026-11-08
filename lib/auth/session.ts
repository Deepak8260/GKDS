import { SignJWT, jwtVerify } from 'jose';
import { SESSION_SECONDS } from './constants';

/**
 * Admin session token (HS256 JWT). Uses `jose` only, so it also runs in the Edge-style proxy.
 * In production ADMIN_JWT_SECRET is required: without it nobody can log in (fail closed).
 */

type Env = Record<string, string | undefined>;

const DEV_FALLBACK = 'gkds-dev-only-secret-change-me-0123456789';

export function getSessionSecret(env: Env = process.env): Uint8Array | null {
  const secret = env.ADMIN_JWT_SECRET?.trim();
  if (secret && secret.length >= 16) return new TextEncoder().encode(secret);
  if (env.NODE_ENV !== 'production') return new TextEncoder().encode(DEV_FALLBACK);
  return null;
}

export async function signSession(
  sessionVersion: number,
  env: Env = process.env,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<string> {
  const secret = getSessionSecret(env);
  if (!secret) throw new Error('ADMIN_JWT_SECRET is not configured');
  return new SignJWT({ sub: 'admin', sv: sessionVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + SESSION_SECONDS)
    .sign(secret);
}

export interface SessionClaims {
  sv: number;
}

/** Returns the claims for a valid, unexpired token, otherwise null. */
export async function verifySession(token: string | undefined, env: Env = process.env): Promise<SessionClaims | null> {
  if (!token) return null;
  const secret = getSessionSecret(env);
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    if (payload.sub !== 'admin') return null;
    const sv = typeof payload.sv === 'number' && Number.isInteger(payload.sv) ? payload.sv : null;
    return sv === null ? null : { sv };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(production = process.env.NODE_ENV === 'production') {
  return {
    httpOnly: true,
    secure: production,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: SESSION_SECONDS,
  };
}
