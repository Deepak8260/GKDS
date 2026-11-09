import { getAt, setAt } from '@/lib/admin/path';

/**
 * A translation overlay holds only the translated text of one content document, keyed by dotted path:
 *   { "hero.titleLead": "ଗୋପାଳ", "courses.0.title": { "t": "…", "s": "English text at translation time" } }
 * The Odia site shows the English document with those strings replaced. Nothing else (pictures, links,
 * numbers, ids) can be changed by an overlay.
 */
export type OverlayEntry = string | { t: string; s?: string };
export type Overlay = Record<string, OverlayEntry>;

export const entryText = (e: OverlayEntry): string => (typeof e === 'string' ? e : e.t);
export const entrySource = (e: OverlayEntry): string | undefined => (typeof e === 'string' ? undefined : e.s);

/** Keep only well-formed entries (a plain object of short strings), whatever was stored. */
export function normalizeOverlay(raw: unknown): Overlay {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Overlay = {};
  for (const [path, value] of Object.entries(raw as Record<string, unknown>)) {
    if (path.length > 200) continue;
    if (typeof value === 'string' && value.trim()) out[path] = value;
    else if (value && typeof value === 'object') {
      const v = value as { t?: unknown; s?: unknown };
      if (typeof v.t === 'string' && v.t.trim()) out[path] = typeof v.s === 'string' ? { t: v.t, s: v.s } : { t: v.t };
    }
  }
  return out;
}

/** Seed translations first, then the admin's saved ones on top. */
export function mergeOverlays(...layers: Overlay[]): Overlay {
  return Object.assign({}, ...layers);
}

/**
 * Replace strings of `base` by their translations. Only paths that `allowed` accepts are used, and only where
 * `base` really has a string (an item that was deleted in English simply loses its translation).
 */
export function applyOverlay<T>(base: T, overlay: Overlay, allowed: (path: string) => boolean): T {
  let out: unknown = base;
  for (const [path, entry] of Object.entries(overlay)) {
    if (!allowed(path)) continue;
    if (typeof getAt(out, path) !== 'string') continue;
    out = setAt(out, path, entryText(entry));
  }
  return out as T;
}
