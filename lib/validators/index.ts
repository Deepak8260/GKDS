import type { ZodType } from 'zod';
import { aboutSchema, type About } from './about';
import { coursesSchema, type Courses } from './courses';
import { gallerySchema, type Gallery } from './gallery';
import { homeSchema, type Home } from './home';
import { reviewsSchema, type Reviews } from './reviews';
import { siteSchema, type Site } from './site';

export * from './common';
export * from './site';
export * from './home';
export * from './about';
export * from './courses';
export * from './gallery';
export * from './reviews';
export * from './admin-config';

/** The six content documents stored in `content/<name>.json` on the data branch. */
export const contentNames = ['site', 'home', 'about', 'courses', 'gallery', 'reviews'] as const;
export type ContentName = (typeof contentNames)[number];

export interface ContentMap {
  site: Site;
  home: Home;
  about: About;
  courses: Courses;
  gallery: Gallery;
  reviews: Reviews;
}

export const contentSchemas: { [K in ContentName]: ZodType<ContentMap[K]> } = {
  site: siteSchema,
  home: homeSchema,
  about: aboutSchema,
  courses: coursesSchema,
  gallery: gallerySchema,
  reviews: reviewsSchema as unknown as ZodType<Reviews>,
};

export function isContentName(value: string): value is ContentName {
  return (contentNames as readonly string[]).includes(value);
}

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: Record<string, string> };

/**
 * Validate a content document. On failure returns field-level errors keyed by
 * dotted path (e.g. "courses.0.slug") for the admin forms.
 */
export function parseContent<K extends ContentName>(name: K, data: unknown): ParseResult<ContentMap[K]> {
  const result = contentSchemas[name].safeParse(data);
  if (result.success) return { ok: true, data: result.data as ContentMap[K] };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!(path in errors)) errors[path] = issue.message;
  }
  return { ok: false, errors };
}
