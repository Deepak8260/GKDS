/**
 * Map a stored media path to a URL the browser can load.
 *  - "media/gallery/ab12cd-front.webp"  -> "/api/media/media/gallery/ab12cd-front.webp" (private-repo proxy, prompt 02)
 *  - "/placeholders/x.svg" | "https://…" -> unchanged
 */
export function mediaUrl(path: string | undefined | null): string {
  if (!path) return '/placeholders/hero-building.svg';
  if (path.startsWith('/') || /^https?:\/\//.test(path)) return path;
  return `/api/media/${path.replace(/^\/+/, '')}`;
}
