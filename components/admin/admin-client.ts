'use client';

import { usePathname } from 'next/navigation';
import { CSRF_HEADER, CSRF_VALUE, type AdminBase } from '@/lib/auth/constants';

/**
 * The prefix the user entered with (`/admin` or `/malika`). The browser URL keeps it even though
 * `/malika` is rewritten to `/admin` on the server, so every admin link is built from this.
 */
export function useAdminBase(): AdminBase {
  const pathname = usePathname() ?? '';
  return pathname === '/malika' || pathname.startsWith('/malika/') ? '/malika' : '/admin';
}

export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  data: T & { ok?: boolean; message?: string; errors?: Record<string, string>; conflict?: boolean };
}

/** fetch wrapper for /api/admin/*: JSON in/out, CSRF header, never throws (network errors become `ok:false`). */
export async function adminFetch<T = Record<string, unknown>>(
  url: string,
  options: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
      headers: { [CSRF_HEADER]: CSRF_VALUE, ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
      credentials: 'same-origin',
    });
    const data = (await res.json().catch(() => ({}))) as ApiResult<T>['data'];
    // the session ended: go to the login page (keeps the prefix)
    if (res.status === 401 && !url.endsWith('/login')) {
      const base = window.location.pathname.startsWith('/malika') ? '/malika' : '/admin';
      // full page load on purpose: it also clears any stale client state
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`${base}/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
    return { ok: res.ok && data.ok !== false, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { ok: false, message: 'Network problem. Check your connection and try again.' } as ApiResult<T>['data'] };
  }
}
