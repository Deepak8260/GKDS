import { GithubNotFoundError, isGithubConfigured, readRaw } from '@/lib/github';
import { validateMediaPath } from '@/lib/media-path';

export const runtime = 'nodejs';

const IMMUTABLE = 'public, max-age=31536000, s-maxage=31536000, immutable';

/**
 * Image proxy for the private data repo: /api/media/media/<folder>/<file>.webp
 * Files are content-hashed, so responses are cached "forever" by the CDN/browser.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const check = validateMediaPath(path);
  if (!check.ok) {
    return new Response('Bad request', { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!isGithubConfigured()) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const bytes = await readRaw(check.path);
    const headers: Record<string, string> = {
      'Content-Type': check.contentType,
      'Cache-Control': IMMUTABLE,
      'X-Content-Type-Options': 'nosniff',
    };
    if (check.contentType === 'image/svg+xml') {
      // SVGs are served as images only; block scripts/embeds if opened directly.
      headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";
    }
    return new Response(new Uint8Array(bytes), { status: 200, headers });
  } catch (err) {
    if (err instanceof GithubNotFoundError) {
      return new Response('Not found', {
        status: 404,
        headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' },
      });
    }
    console.warn(`[media] failed to load ${check.path}: ${(err as Error).message}`);
    return new Response('Bad gateway', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
