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

export function countLabel(shown: number, total: number): string {
  if (total === 0) return 'No reviews yet';
  return shown === total
    ? `Showing ${total} ${total === 1 ? 'review' : 'reviews'}`
    : `Showing ${shown} of ${total} reviews`;
}

/** "4.8" — one decimal place, so a perfect score reads "5.0". */
export function formatRating(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

/** "250+" → 250 (for structured data); falls back to `fallback` when there are no digits. */
export function parseCount(label: string, fallback: number): number {
  const n = parseInt(label.replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
