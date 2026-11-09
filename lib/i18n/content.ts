import 'server-only';
import aboutOr from '@/content-seed/or/about.json';
import coursesOr from '@/content-seed/or/courses.json';
import galleryOr from '@/content-seed/or/gallery.json';
import homeOr from '@/content-seed/or/home.json';
import reviewsOr from '@/content-seed/or/reviews.json';
import siteOr from '@/content-seed/or/site.json';
import { isGithubConfigured, readJson } from '@/lib/github';
import type { ContentName } from '@/lib/validators';
import type { Locale } from './locales';
import { applyOverlay, mergeOverlays, normalizeOverlay, type Overlay } from './overlay';
import { isTranslatablePath } from './translatable';

/** The built-in Odia translations (what the site shows before anyone edits a translation in the admin). */
const SEED_OVERLAYS: Record<ContentName, Overlay> = {
  site: normalizeOverlay(siteOr),
  home: normalizeOverlay(homeOr),
  about: normalizeOverlay(aboutOr),
  courses: normalizeOverlay(coursesOr),
  gallery: normalizeOverlay(galleryOr),
  reviews: normalizeOverlay(reviewsOr),
};

export const seedOverlay = (name: ContentName): Overlay => SEED_OVERLAYS[name];

export const overlayPath = (name: ContentName) => `content/or/${name}.json`;

/**
 * Odia translations of one document: the built-in ones, with whatever was saved in the admin on top.
 * A missing or unreadable file simply means "use the built-in ones".
 */
export async function loadOverlay(name: ContentName): Promise<Overlay> {
  const seed = SEED_OVERLAYS[name];
  if (!isGithubConfigured()) return seed;
  try {
    const raw = await readJson(overlayPath(name), { tags: ['content', `content:or:${name}`] });
    return mergeOverlays(seed, normalizeOverlay(raw));
  } catch {
    return seed;
  }
}

/** English document → the same document in `locale`. Pictures, links, numbers and ids always stay as they are. */
export async function localize<T>(name: ContentName, base: T, locale: Locale): Promise<T> {
  if (locale === 'en') return base;
  return applyOverlay(base, await loadOverlay(name), (path) => isTranslatablePath(name, path));
}
