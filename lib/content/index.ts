import 'server-only';
import { cache } from 'react';
import siteSeed from '@/content-seed/site.json';
import homeSeed from '@/content-seed/home.json';
import aboutSeed from '@/content-seed/about.json';
import coursesSeed from '@/content-seed/courses.json';
import gallerySeed from '@/content-seed/gallery.json';
import reviewsSeed from '@/content-seed/reviews.json';
import { isGithubConfigured, readJson } from '@/lib/github';
import {
  contentSchemas,
  type ContentMap,
  type ContentName,
  type Course,
  type GalleryItem,
  type Review,
} from '@/lib/validators';
import { localize } from '@/lib/i18n/content';
import type { Locale } from '@/lib/i18n/locales';
import { computeReviewStats, type ReviewStats } from './stats';

const seedFiles: Record<ContentName, unknown> = {
  site: siteSeed,
  home: homeSeed,
  about: aboutSeed,
  courses: coursesSeed,
  gallery: gallerySeed,
  reviews: reviewsSeed,
};

/** Validated seed (throws if a bundled seed file is invalid — caught by the unit tests/build). */
export function getSeed<K extends ContentName>(name: K): ContentMap[K] {
  return contentSchemas[name].parse(seedFiles[name]) as ContentMap[K];
}

/**
 * Load one content document:
 *   GitHub (data branch) → zod-validate → return; on ANY failure
 *   (not configured, 404, invalid JSON/schema, network, rate limit) → warn and return the seed.
 * The site therefore runs with no environment variables at all.
 */
export async function loadContent<K extends ContentName>(name: K): Promise<ContentMap[K]> {
  if (!isGithubConfigured()) return getSeed(name);

  try {
    const raw = await readJson(`content/${name}.json`, { tags: ['content', `content:${name}`] });
    const parsed = contentSchemas[name].safeParse(raw);
    if (parsed.success) return parsed.data as ContentMap[K];
    const first = parsed.error.issues[0];
    console.warn(
      `[content] ${name}.json failed validation (${first?.path.join('.') || 'root'}: ${first?.message}). Using seed content.`,
    );
  } catch (err) {
    console.warn(`[content] Could not read ${name}.json from GitHub (${(err as Error).message}). Using seed content.`);
  }
  return getSeed(name);
}

// Every reader takes the language (default English). The Odia pages get the same document with the translated
// strings swapped in (see lib/i18n); everything that is not text is shared.
const localized = <K extends ContentName>(name: K) =>
  cache(async (locale: Locale = 'en'): Promise<ContentMap[K]> => localize(name, await loadContent(name), locale));

export const getSite = localized('site');
export const getHome = localized('home');
export const getAbout = localized('about');
export const getCourses = localized('courses');
export const getGallery = localized('gallery');
export const getReviews = localized('reviews');

/** Published courses, ordered by `order`. */
export const getPublishedCourses = cache(async (locale: Locale = 'en'): Promise<Course[]> => {
  const { courses } = await getCourses(locale);
  return courses.filter((c) => c.published).sort((a, b) => a.order - b.order);
});

/** `{ title, slug }` pairs for navigation (header dropdown) and anchors. */
export const getAllCourseOptions = cache(async (locale: Locale = 'en') =>
  (await getPublishedCourses(locale)).map((c) => ({ title: c.title, slug: c.slug })),
);

/** Published gallery photos, ordered by `order`. */
export const getPublishedGallery = cache(async (locale: Locale = 'en'): Promise<GalleryItem[]> => {
  const { items } = await getGallery(locale);
  return items.filter((i) => i.published).sort((a, b) => a.order - b.order);
});

/** Published reviews, newest first. (The reviews themselves are the visitors' own words and are never translated.) */
export const getPublishedReviews = cache(async (): Promise<Review[]> => {
  const { items } = await getReviews();
  return items.filter((r) => r.published).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
});

/** Featured published reviews (Home teaser), newest first. */
export const getFeaturedReviews = cache(async (limit = 3): Promise<Review[]> => {
  const reviews = await getPublishedReviews();
  return reviews.filter((r) => r.featured).slice(0, limit);
});

/** Summary numbers for the Reviews page: real figures from the published reviews. */
export const getReviewStats = cache(async (): Promise<ReviewStats> => {
  const reviews = await getReviews();
  return computeReviewStats(reviews.items);
});
