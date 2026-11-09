import { newId } from '@/lib/utils';
import type { Course } from '@/lib/validators';

/** "Car Driving Course!" → "car-driving-course" (the format the schema accepts: lowercase letters, numbers, hyphens). */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

/** `base` if free, otherwise base-2, base-3 … (compared against the other courses' slugs). */
export function uniqueSlug(base: string, taken: string[]): string {
  const root = base || 'course';
  if (!taken.includes(root)) return root;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${root}-${n}`.slice(0, 60);
    if (!taken.includes(candidate)) return candidate;
  }
  return `${root}-${newId().slice(0, 4)}`;
}

/** Numbers courses 1..n in their current list order (what "order" means everywhere on the site). */
export function renumber<T extends { order: number }>(courses: T[]): T[] {
  return courses.map((c, i) => (c.order === i + 1 ? c : { ...c, order: i + 1 }));
}

/** Move one item (immutable). Out-of-range moves return the list unchanged. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export const MAX_COURSES = 8;

/** A blank hidden course, ready to be filled in (placed last). Needs a title before it can be saved. */
export function newCourse(existing: Pick<Course, 'slug'>[]): Course {
  return {
    id: `course-${newId()}`,
    slug: uniqueSlug('new-course', existing.map((c) => c.slug)),
    title: '',
    description: '',
    vehicle: '',
    image: '',
    imageAlt: '',
    features: [''],
    order: existing.length + 1,
    published: false,
  };
}

/** Slugs used by more than one course (the schema reports this only as one error on the whole list). */
export function duplicateSlugs(courses: Pick<Course, 'slug'>[]): Set<string> {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const c of courses) {
    if (seen.has(c.slug)) dup.add(c.slug);
    seen.add(c.slug);
  }
  return dup;
}
