import { NextResponse } from 'next/server';
import { getAdminConfig } from '@/lib/auth/admin-config';
import { verifyAccessCode } from '@/lib/auth/code';
import { SESSION_COOKIE } from '@/lib/auth/constants';
import { csrfOk } from '@/lib/auth/csrf';
import { callerId, NO_STORE } from '@/lib/auth/guard';
import { sessionCookieOptions, signSession } from '@/lib/auth/session';
import { loginThrottle } from '@/lib/auth/throttle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GENERIC = 'Incorrect code. Please try again.';
const reply = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

/** POST /api/admin/login  { code } → sets the session cookie. Same behaviour under /admin and /malika. */
export async function POST(request: Request) {
  if (!csrfOk(request.headers, 'POST')) return reply({ ok: false, message: 'Request blocked.' }, 403);

  const { ip, id } = callerId(request);
  const wait = loginThrottle.blockedFor(ip);
  if (wait > 0) {
    const minutes = Math.max(1, Math.ceil(wait / 60));
    return reply({ ok: false, message: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`, retryAfterSec: wait }, 429);
  }

  let code = '';
  try {
    const raw = await request.text();
    if (raw.length > 1024) return reply({ ok: false, message: GENERIC }, 400);
    const body = JSON.parse(raw) as { code?: unknown };
    if (typeof body.code === 'string') code = body.code;
  } catch {
    return reply({ ok: false, message: GENERIC }, 400);
  }

  let loaded;
  try {
    loaded = await getAdminConfig();
  } catch {
    // never fall back to the default code when the stored one cannot be read
    return reply({ ok: false, message: 'Sign-in is temporarily unavailable. Please try again shortly.' }, 503);
  }

  const valid = await verifyAccessCode(code, { config: loaded.config });
  if (!valid) {
    const delay = loginThrottle.fail(ip);
    console.warn(`[admin] failed login (caller ${id})`);
    await new Promise((r) => setTimeout(r, delay));
    return reply({ ok: false, message: GENERIC }, 401);
  }

  let token: string;
  try {
    token = await signSession(loaded.config?.sessionVersion ?? 0);
  } catch {
    return reply({ ok: false, message: 'Sign-in is not set up on the server (missing ADMIN_JWT_SECRET).' }, 500);
  }
  loginThrottle.succeed(ip);

  const res = reply({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
