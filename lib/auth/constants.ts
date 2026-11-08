/** Shared, runtime-neutral auth constants (safe to import from the proxy and the browser). */

export const SESSION_COOKIE = 'gkds_admin';
export const SESSION_SECONDS = 12 * 60 * 60;
export const CSRF_HEADER = 'x-requested-with';
export const CSRF_VALUE = 'gkds-admin';
/** Request header the proxy sets so server components know which prefix the visitor used. */
export const ADMIN_BASE_HEADER = 'x-admin-base';

export const CODE_MIN = 4;
export const CODE_MAX = 64;

export type AdminBase = '/admin' | '/malika';

/**
 * `/malika` is ONLY an alias of `/admin` (a rewrite in next.config.ts). The access code is what
 * protects the panel; the prefix gives no extra security.
 */
export function adminBaseOf(pathname: string): AdminBase | null {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return '/admin';
  if (pathname === '/malika' || pathname.startsWith('/malika/')) return '/malika';
  return null;
}

/** A `next` redirect target is accepted only if it is a relative path inside the admin area. */
export function safeNextPath(next: string | null | undefined, base: AdminBase): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\') || /[\r\n]/.test(next)) return base;
  const underAdmin = adminBaseOf(next.split(/[?#]/)[0]);
  if (!underAdmin) return base;
  // keep the visitor on the prefix they entered with
  return `${base}${next.slice(underAdmin.length)}`;
}
