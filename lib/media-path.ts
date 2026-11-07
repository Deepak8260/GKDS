/** Pure helpers for the private-repo image proxy (no server-only imports, easy to unit test). */

export const MEDIA_EXTENSIONS: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  gif: 'image/gif',
};

export type MediaPathResult =
  | { ok: true; path: string; contentType: string }
  | { ok: false; reason: string };

/**
 * Validate the catch-all segments of /api/media/[...path].
 * Must resolve to `media/<folder>/<file>.<allowed ext>`; no traversal, no odd characters.
 */
export function validateMediaPath(segments: string[] | undefined): MediaPathResult {
  if (!segments || segments.length < 2 || segments.length > 6) {
    return { ok: false, reason: 'bad-length' };
  }
  for (const seg of segments) {
    if (!seg || seg === '.' || seg === '..') return { ok: false, reason: 'bad-segment' };
    if (/[\\\0:*?"<>|]/.test(seg) || seg.includes('%')) return { ok: false, reason: 'bad-character' };
    if (seg.startsWith('.')) return { ok: false, reason: 'hidden-file' };
  }
  if (segments[0] !== 'media') return { ok: false, reason: 'outside-media' };

  const file = segments[segments.length - 1];
  const dot = file.lastIndexOf('.');
  const ext = dot === -1 ? '' : file.slice(dot + 1).toLowerCase();
  const contentType = MEDIA_EXTENSIONS[ext];
  if (!contentType) return { ok: false, reason: 'bad-extension' };

  return { ok: true, path: segments.join('/'), contentType };
}
