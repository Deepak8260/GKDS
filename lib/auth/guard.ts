import 'server-only';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { clientIp, hashIp } from '@/lib/rate-limit';
import { currentSessionVersion } from './admin-config';
import { ADMIN_BASE_HEADER, SESSION_COOKIE, type AdminBase } from './constants';
import { csrfOk } from './csrf';
import { verifySession } from './session';

export const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/** Which prefix (/admin or /malika) the visitor came in with; set by the proxy. */
export async function getAdminBase(): Promise<AdminBase> {
  const value = (await headers()).get(ADMIN_BASE_HEADER);
  return value === '/malika' ? '/malika' : '/admin';
}

/**
 * Is the current request logged in? Verifies the signature/expiry AND that the token's session
 * version still matches (so changing the code signs every other device out).
 */
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const claims = await verifySession(token);
  if (!claims) return false;
  try {
    return claims.sv === (await currentSessionVersion());
  } catch {
    return false;
  }
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...NO_STORE, ...extra } });
}

/**
 * Guard for every admin API handler: logged in (defence in depth behind the proxy) + CSRF for mutations.
 * Returns an error response to send, or null when the request may proceed.
 */
export async function guardAdminApi(request: Request): Promise<NextResponse | null> {
  if (!csrfOk(request.headers, request.method)) return json({ ok: false, message: 'Request blocked.' }, 403);
  if (!(await isAdmin())) return json({ ok: false, message: 'Please sign in again.' }, 401);
  return null;
}

/** Short, non-reversible caller id for logs and limiters. */
export function callerId(request: Request): { ip: string; id: string } {
  const ip = clientIp(request.headers);
  return { ip, id: hashIp(ip) };
}
