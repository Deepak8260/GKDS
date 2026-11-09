import { newId } from '@/lib/utils';
import type { Review } from '@/lib/validators';

/** At most this many published reviews can be featured on the Home page (the schema enforces it too). */
export const MAX_FEATURED = 3;

export const FEATURED_LIMIT_MESSAGE = `Only ${MAX_FEATURED} reviews can be featured on the Home page. Remove the star from another review first.`;

type FeatureFields = Pick<Review, 'id' | 'published' | 'featured'>;

export function featuredCount(items: FeatureFields[]): number {
  return items.filter((r) => r.published && r.featured).length;
}

/**
 * May this review be featured, or shown again while featured? Hidden reviews do not use a slot,
 * so un-hiding a featured one needs a free slot as well.
 */
export function canFeature(items: FeatureFields[], id: string): { ok: true } | { ok: false; message: string } {
  const others = items.filter((r) => r.id !== id);
  return featuredCount(others) >= MAX_FEATURED ? { ok: false, message: FEATURED_LIMIT_MESSAGE } : { ok: true };
}

export type ReviewSort = 'newest' | 'oldest' | 'highest' | 'lowest';

export interface ReviewFilters {
  query: string;
  featuredOnly: boolean;
  hiddenOnly: boolean;
}
export const NO_REVIEW_FILTERS: ReviewFilters = { query: '', featuredOnly: false, hiddenOnly: false };

export function filterReviews<T extends Pick<Review, 'name' | 'text' | 'featured' | 'published'>>(items: T[], f: ReviewFilters): T[] {
  const q = f.query.trim().toLowerCase();
  return items.filter(
    (r) => (!q || r.name.toLowerCase().includes(q) || r.text.toLowerCase().includes(q)) && (!f.featuredOnly || r.featured) && (!f.hiddenOnly || !r.published),
  );
}

export function sortReviews<T extends Pick<Review, 'date' | 'rating'>>(items: T[], sort: ReviewSort): T[] {
  const time = (r: T) => Date.parse(r.date) || 0;
  const copy = items.slice();
  switch (sort) {
    case 'oldest':
      return copy.sort((a, b) => time(a) - time(b));
    case 'highest':
      return copy.sort((a, b) => b.rating - a.rating || time(b) - time(a));
    case 'lowest':
      return copy.sort((a, b) => a.rating - b.rating || time(b) - time(a));
    default:
      return copy.sort((a, b) => time(b) - time(a));
  }
}

/** A blank review for "Add review manually" (reviews that came by WhatsApp or in person). Published, not featured. */
export function newReview(now = new Date()): Review {
  return { id: newId(), name: '', rating: 5, text: '', date: now.toISOString(), published: true, featured: false };
}

/** 1, 1.5, 2 … 5 for the rating picker (the schema allows half stars). */
export const RATING_OPTIONS = Array.from({ length: 9 }, (_, i) => 1 + i * 0.5);

/** ISO date-time → value for a date input (YYYY-MM-DD). */
export function dateInputValue(iso: string): string {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? '' : new Date(t).toISOString().slice(0, 10);
}

/** Date input value → ISO date-time at noon UTC (so the day is the same in India and everywhere else). */
export function isoFromDateInput(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00.000Z` : '';
}
