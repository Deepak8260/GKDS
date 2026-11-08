import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/constants';
import { csrfOk } from '@/lib/auth/csrf';
import { NO_STORE } from '@/lib/auth/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/admin/logout — clears the session cookie. */
export async function POST(request: Request) {
  if (!csrfOk(request.headers, 'POST')) return NextResponse.json({ ok: false }, { status: 403, headers: NO_STORE });
  const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
