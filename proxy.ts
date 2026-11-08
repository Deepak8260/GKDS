import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_BASE_HEADER, SESSION_COOKIE, adminBaseOf } from '@/lib/auth/constants';
import { verifySession } from '@/lib/auth/session';

/**
 * Gatekeeper for the admin area: /admin, /malika (an alias of /admin) and /api/admin.
 * Checks the session cookie's signature and expiry only (fast, Edge-safe); the admin layout and every
 * admin API handler ALSO verify the session version against GitHub (defence in depth).
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith('/api/admin');
  const base = adminBaseOf(pathname);

  const loginPath = base ? `${base}/login` : null;
  const isLoginPage = loginPath !== null && (pathname === loginPath || pathname === `${loginPath}/`);
  const isLoginApi = pathname === '/api/admin/login';

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session && !isLoginPage && !isLoginApi) {
    if (isApi) {
      return NextResponse.json(
        { ok: false, message: 'Please sign in again.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = loginPath ?? '/admin/login';
    url.search = '';
    url.searchParams.set('next', `${pathname}${search}`);
    const res = NextResponse.redirect(url);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }

  // pass the entered prefix to server components, and never let anything in the admin area be cached
  const requestHeaders = new Headers(request.headers);
  if (base) requestHeaders.set(ADMIN_BASE_HEADER, base);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/malika', '/malika/:path*', '/api/admin/:path*'],
};
