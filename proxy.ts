import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_BASE_HEADER, SESSION_COOKIE, adminBaseOf } from '@/lib/auth/constants';
import { verifySession } from '@/lib/auth/session';
import { LANG_COOKIE, localizePath } from '@/lib/i18n/locales';

/**
 * Gatekeeper for the admin area: /admin, /malika (an alias of /admin) and /api/admin.
 * It also sends returning Odia readers from the English pages to the Odia ones (cookie `gkds_lang=or`).
 * Checks the session cookie's signature and expiry only (fast, Edge-safe); the admin layout and every
 * admin API handler ALSO verify the session version against GitHub (defence in depth).
 */
/** The public pages that also exist in Odia (see app/(site)/or). */
const PUBLIC_PAGES = new Set(['/', '/about', '/courses', '/gallery', '/reviews', '/contact']);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // A visitor who chose Odia earlier is sent to the Odia version of the page they asked for.
  if (PUBLIC_PAGES.has(pathname)) {
    if (request.cookies.get(LANG_COOKIE)?.value === 'or') {
      const url = request.nextUrl.clone();
      url.pathname = localizePath(pathname, 'or');
      return NextResponse.redirect(url, 307);
    }
    return NextResponse.next();
  }

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
  matcher: ['/', '/about', '/courses', '/gallery', '/reviews', '/contact', '/admin', '/admin/:path*', '/malika', '/malika/:path*', '/api/admin/:path*'],
};
