import { fmt } from '@/lib/i18n/locales';
import type { GalleryCategory, GalleryItem } from '@/lib/validators';

/** Photos shown per "page" before the Load more button. */
export const PAGE_SIZE = 12;
/** Minimum horizontal movement (px) that counts as a swipe in the lightbox. */
export const SWIPE_THRESHOLD = 50;

export const ALL = 'all';

/** Accept a `?category=` value only if it names a real category; anything else means "all". */
export function resolveCategory(param: string | null, categories: Pick<GalleryCategory, 'id'>[]): string {
  return param && categories.some((c) => c.id === param) ? param : ALL;
}

export function filterByCategory(items: GalleryItem[], category: string): GalleryItem[] {
  return category === ALL ? items : items.filter((i) => i.category === category);
}

/** Wrap an index around a list of `length` items (previous from 0 → last, next from last → 0). */
export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

/** -1 = swipe right (go to previous), 1 = swipe left (go to next), 0 = too short to count. */
export function swipeDirection(deltaX: number, threshold = SWIPE_THRESHOLD): -1 | 0 | 1 {
  if (deltaX <= -threshold) return 1;
  if (deltaX >= threshold) return -1;
  return 0;
}

export interface CountLabels {
  none: string;
  one: string;
  all: string;
  part: string;
}

const EN_COUNT: CountLabels = { none: 'No photos', one: 'Showing 1 photo', all: 'Showing {n} photos', part: 'Showing {shown} of {total} photos' };

export function countLabel(shown: number, total: number, labels: CountLabels = EN_COUNT): string {
  if (total === 0) return labels.none;
  if (shown === total) return total === 1 ? labels.one : fmt(labels.all, { n: total });
  return fmt(labels.part, { shown, total });
}
