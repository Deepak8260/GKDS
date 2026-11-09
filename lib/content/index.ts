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

/** Content saved before a section existed has no entry for it: use the bundled default (e.g. the driving video) until it is saved. */
export function withNewSections<T>(name: ContentName, data: T): T {
  const seed = getSeed(name) as Record<string, unknown>;
  const doc = { ...(data as Record<string, unknown>) };
  for (const key of ['ownerMessage', 'videos', 'videosTitle', 'videosSubtitle']) {
    if (doc[key] === undefined && seed[key] !== undefined) doc[key] = seed[key];
  }
  return doc as T;
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
    if (parsed.success) return withNewSections(name, parsed.data) as ContentMap[K];
    const first = parsed.error.issues[0];
    console.warn(
      `[content] ${name}.json failed validation (${first?.path.join('.') || 'root'}: ${first?.message}). Using seed content.`,
    );
  } catch (err) {
    console.warn(`[content] Could not read ${name}.json from GitHub (${(err as Error).message}). Using seed content.`);
  }
  return getSeed(name);
}

export const getSite = cache(() => loadContent('site'));
export const getHome = cache(() => loadContent('home'));
export const getAbout = cache(() => loadContent('about'));
export const getCourses = cache(() => loadContent('courses'));
export const getGallery = cache(() => loadContent('gallery'));
export const getReviews = cache(() => loadContent('reviews'));

/** Published courses, ordered by `order`. */
export const getPublishedCourses = cache(async (): Promise<Course[]> => {
  const { courses } = await getCourses();
  return courses.filter((c) => c.published).sort((a, b) => a.order - b.order);
});

/** `{ title, slug }` pairs for navigation (header dropdown) and anchors. */
export const getAllCourseOptions = cache(async () =>
  (await getPublishedCourses()).map((c) => ({ title: c.title, slug: c.slug })),
);

/** Published gallery photos, ordered by `order`. */
export const getPublishedGallery = cache(async (): Promise<GalleryItem[]> => {
  const { items } = await getGallery();
  return items.filter((i) => i.published).sort((a, b) => a.order - b.order);
});

/** Published reviews, newest first. */
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
