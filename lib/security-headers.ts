/**
 * HTTP security headers, including a conservative Content-Security-Policy.
 * Kept in a plain module (no Next imports) so next.config.ts and the unit tests can both use it.
 *
 * Why 'unsafe-inline' for scripts and styles: Next.js streams small inline <script> tags to hydrate pages and
 * React/next-font emit inline styles. Everything else is locked to this site's own origin, plus the two
 * services the site really uses: the Google Maps embed (frame) and Vercel analytics.
 */

export interface Header {
  key: string;
  value: string;
}

export const CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://va.vercel-scripts.com'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:', 'https://i.ytimg.com'],
  'font-src': ["'self'"],
  'connect-src': ["'self'", 'https://vitals.vercel-insights.com', 'https://va.vercel-scripts.com'],
  'frame-src': ['https://www.google.com', 'https://www.youtube-nocookie.com'],
  'manifest-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
};

/** The CSP header value. */
export function buildCsp(directives: Record<string, string[]> = CSP_DIRECTIVES): string {
  return [...Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`), 'upgrade-insecure-requests'].join('; ');
}

/**
 * Headers for every response.
 * The CSP is sent in production only: the dev server needs eval and websockets for hot reload.
 */
export function securityHeaders({ production }: { production: boolean }): Header[] {
  const headers: Header[] = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  ];
  if (production) headers.push({ key: 'Content-Security-Policy', value: buildCsp() });
  return headers;
}
