import { createHash } from 'node:crypto';

/** Pure helpers for the admin image upload API (no server-only imports, easy to unit test). */

/** Folders the admin may upload into. (`reviews` holds visitors' photos and is listed read-only.) */
export const UPLOAD_FOLDERS = ['branding', 'pages', 'courses', 'gallery', 'avatars'] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];
export const LIST_FOLDERS = [...UPLOAD_FOLDERS, 'reviews'] as const;
export type MediaFolder = (typeof LIST_FOLDERS)[number];

export function isUploadFolder(value: unknown): value is UploadFolder {
  return typeof value === 'string' && (UPLOAD_FOLDERS as readonly string[]).includes(value);
}
export function isMediaFolder(value: unknown): value is MediaFolder {
  return typeof value === 'string' && (LIST_FOLDERS as readonly string[]).includes(value);
}

/** Largest base64 payload accepted (3 MB of image ≈ 4 MB of base64; Vercel's request limit is 4.5 MB). */
export const MAX_BASE64_LENGTH = 4_300_000;

/** "My Photo (1).JPG" → "my-photo-1" : lowercase letters, numbers and hyphens, at most 40 characters. */
export function sanitizeFileName(name: string): string {
  const base = name.replace(/\.[a-z0-9]{1,5}$/i, '');
  const slug = base
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return slug || 'image';
}

export type DetectedImage = 'webp' | 'png' | 'jpeg';

/** Look at the first bytes: never trust the MIME type or extension the client sent. */
export function detectImageType(bytes: Uint8Array): DetectedImage | null {
  if (bytes.length < 12) return null;
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG' && bytes[4] === 0x0d && bytes[5] === 0x0a) return 'png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  return null;
}

/** First 8 hex characters of the SHA-1 of the stored bytes (the same picture always gets the same name). */
export function contentHash(bytes: Uint8Array): string {
  return createHash('sha1').update(bytes).digest('hex').slice(0, 8);
}

/** `media/<folder>/<hash>-<slug>.webp` */
export function mediaPathFor(folder: UploadFolder, bytes: Uint8Array, fileName: string): string {
  return `media/${folder}/${contentHash(bytes)}-${sanitizeFileName(fileName)}.webp`;
}

/** True only for a path this API would have produced: `media/<known folder>/<name>.webp|png|jpg|jpeg`. */
export function isManagedMediaPath(path: unknown): path is string {
  if (typeof path !== 'string') return false;
  const m = /^media\/([a-z]+)\/([a-z0-9][a-z0-9.-]{0,80})\.(webp|png|jpe?g)$/.exec(path);
  return Boolean(m && isMediaFolder(m[1]) && !m[2].includes('..'));
}

/* ---------------------------- usage scanning ---------------------------- */

export interface UsageRef {
  file: string;
  jsonPath: string;
}

/** Every place in a content document that holds exactly `path`, as dotted JSON paths. */
export function findUsage(docs: Record<string, unknown>, path: string): UsageRef[] {
  const found: UsageRef[] = [];
  const walk = (value: unknown, trail: string[], file: string) => {
    if (typeof value === 'string') {
      if (value === path) found.push({ file, jsonPath: trail.join('.') });
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, [...trail, String(i)], file));
    } else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) walk(v, [...trail, k], file);
    }
  };
  for (const [file, doc] of Object.entries(docs)) walk(doc, [], file);
  return found;
}

/** One pass over all documents: media path → where it is used. */
export function buildUsageIndex(docs: Record<string, unknown>): Map<string, UsageRef[]> {
  const index = new Map<string, UsageRef[]>();
  const walk = (value: unknown, trail: string[], file: string) => {
    if (typeof value === 'string') {
      if (isManagedMediaPath(value)) {
        const list = index.get(value) ?? [];
        list.push({ file, jsonPath: trail.join('.') });
        index.set(value, list);
      }
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, [...trail, String(i)], file));
    } else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) walk(v, [...trail, k], file);
    }
  };
  for (const [file, doc] of Object.entries(docs)) walk(doc, [], file);
  return index;
}

/** "gallery.items.3.src" → "Gallery"; "home.hero.image" → "Home page". Used for the "Used in" labels. */
export function usageLabel(ref: UsageRef): string {
  const names: Record<string, string> = { site: 'Site settings', home: 'Home page', about: 'About page', courses: 'Courses', gallery: 'Gallery', reviews: 'Reviews' };
  return names[ref.file] ?? ref.file;
}
