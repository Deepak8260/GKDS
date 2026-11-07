import 'server-only';
import { cache } from 'react';
import siteSeed from '@/content-seed/site.json';
import coursesSeed from '@/content-seed/courses.json';
import type { Course, Courses, Site } from './types';

/**
 * TEMPORARY stubs (prompt 01): read the bundled seed files.
 * Prompt 02 replaces the bodies with GitHub reads + zod validation + seed fallback,
 * keeping these same function names and return types.
 */
export const getSite = cache(async (): Promise<Site> => siteSeed as Site);

export const getCourses = cache(async (): Promise<Courses> => coursesSeed as Courses);

export const getPublishedCourses = cache(async (): Promise<Course[]> => {
  const { courses } = await getCourses();
  return courses.filter((c) => c.published).sort((a, b) => a.order - b.order);
});
