/**
 * The public base URL of the site (no trailing slash), used for canonical links, the sitemap, Open Graph
 * and structured data. Order of preference:
 *   1. NEXT_PUBLIC_SITE_URL            (set this to your real domain, e.g. https://www.gopalkrushna.in)
 *   2. VERCEL_PROJECT_PRODUCTION_URL   (set automatically by Vercel; the *.vercel.app or custom domain)
 *   3. VERCEL_URL                      (the current deployment, e.g. a preview)
 *   4. http://localhost:3000           (local development)
 */
export function resolveSiteUrl(env: Record<string, string | undefined> = process.env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return withProtocol(explicit).replace(/\/+$/, '');
  const production = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return withProtocol(production).replace(/\/+$/, '');
  const deployment = env.VERCEL_URL?.trim();
  if (deployment) return withProtocol(deployment).replace(/\/+$/, '');
  return 'http://localhost:3000';
}

function withProtocol(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export const SITE_URL = resolveSiteUrl();
