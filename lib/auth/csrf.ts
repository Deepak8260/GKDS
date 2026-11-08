import { CSRF_HEADER, CSRF_VALUE } from './constants';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence for mutating admin requests, on top of SameSite=Strict:
 * needs the custom header (cannot be set cross-site without CORS) AND a same-origin signal.
 */
export function csrfOk(headers: Headers, method: string): boolean {
  if (SAFE.has(method.toUpperCase())) return true;
  if (headers.get(CSRF_HEADER) !== CSRF_VALUE) return false;

  const fetchSite = headers.get('sec-fetch-site');
  if (fetchSite) return fetchSite === 'same-origin';

  const origin = headers.get('origin');
  const host = headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}
