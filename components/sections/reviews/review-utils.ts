import { fmt } from '@/lib/i18n/locales';
import type { Review } from '@/lib/validators';

/** A review plus its "3 weeks ago" text, computed on the server so server and browser always agree. */
export type ReviewItem = Review & { relative: string };

export type SortMode = 'recent' | 'highest' | 'lowest';

export const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'highest', label: 'Highest Rated' },
  { id: 'lowest', label: 'Lowest Rated' },
];

/** Reviews shown per "page" before the Load more button. */
export const PAGE_SIZE = 9;

/** Accept a `?sort=` value only if it is a known mode; anything else means the default (most recent). */
export function resolveSort(param: string | null): SortMode {
  return SORT_OPTIONS.some((o) => o.id === param) ? (param as SortMode) : 'recent';
}

const byDateDesc = (a: Review, b: Review) => Date.parse(b.date) - Date.parse(a.date);

/**
 * Sort a copy of the list.
 *  - recent: newest first
 *  - highest: rating high → low, ties newest first
 *  - lowest: rating low → high, ties newest first
 * Remaining ties fall back to the id so the order is always the same.
 */
export function sortReviews<T extends Review>(items: T[], mode: SortMode): T[] {
  const compare = (a: T, b: T): number => {
    if (mode === 'highest') {
      const r = b.rating - a.rating;
      if (r !== 0) return r;
    } else if (mode === 'lowest') {
      const r = a.rating - b.rating;
      if (r !== 0) return r;
    }
    return byDateDesc(a, b) || a.id.localeCompare(b.id);
  };
  return [...items].sort(compare);
}

export interface CountLabels {
  none: string;
  one: string;
  /** "{n}" is replaced by the number. */
  all: string;
  /** "{shown}" and "{total}" are replaced by the numbers. */
  part: string;
}

const EN_COUNT: CountLabels = { none: 'No reviews yet', one: 'Showing 1 review', all: 'Showing {n} reviews', part: 'Showing {shown} of {total} reviews' };

export function countLabel(shown: number, total: number, labels: CountLabels = EN_COUNT): string {
  if (total === 0) return labels.none;
  if (shown === total) return total === 1 ? labels.one : fmt(labels.all, { n: total });
  return fmt(labels.part, { shown, total });
}

// moved to lib/format.ts (also needed by the site-wide structured data); re-exported for existing imports
export { formatRating, parseCount } from '@/lib/format';
