import { describe, expect, it } from 'vitest';
import {
  FEATURED_LIMIT_MESSAGE,
  MAX_FEATURED,
  NO_REVIEW_FILTERS,
  RATING_OPTIONS,
  canFeature,
  dateInputValue,
  featuredCount,
  filterReviews,
  isoFromDateInput,
  newReview,
  sortReviews,
} from '@/lib/admin/reviews';
import { computeReviewStats } from '@/lib/content/stats';
import { parseContent } from '@/lib/validators';
import reviewsSeed from '@/content-seed/reviews.json';

const r = (id: string, over: Partial<{ name: string; text: string; rating: number; date: string; published: boolean; featured: boolean }> = {}) => ({
  id,
  name: over.name ?? `Name ${id}`,
  text: over.text ?? `Text of ${id}`,
  rating: over.rating ?? 5,
  date: over.date ?? '2026-10-01T12:00:00.000Z',
  published: over.published ?? true,
  featured: over.featured ?? false,
});

describe('featured limit', () => {
  it('counts only published featured reviews', () => {
    expect(featuredCount([r('a', { featured: true }), r('b', { featured: true, published: false }), r('c')])).toBe(1);
  });

  it('allows featuring until three are taken, then explains', () => {
    const three = [r('a', { featured: true }), r('b', { featured: true }), r('c', { featured: true }), r('d')];
    expect(MAX_FEATURED).toBe(3);
    expect(canFeature(three, 'd')).toEqual({ ok: false, message: FEATURED_LIMIT_MESSAGE });
    const two = [r('a', { featured: true }), r('b', { featured: true }), r('d')];
    expect(canFeature(two, 'd')).toEqual({ ok: true });
  });

  it('a review that is already featured does not block itself', () => {
    const three = [r('a', { featured: true }), r('b', { featured: true }), r('c', { featured: true })];
    expect(canFeature(three, 'a')).toEqual({ ok: true });
  });

  it('un-hiding a featured review needs a free slot too', () => {
    const items = [r('a', { featured: true }), r('b', { featured: true }), r('c', { featured: true }), r('h', { featured: true, published: false })];
    expect(canFeature(items, 'h').ok).toBe(false);
  });

  it('the schema agrees: a 4th featured published review is invalid', () => {
    const doc = { ...structuredClone(reviewsSeed), items: ['a', 'b', 'c', 'd'].map((id) => ({ ...r(id), featured: true })) };
    expect(parseContent('reviews', doc).ok).toBe(false);
    doc.items[3].published = false;
    expect(parseContent('reviews', doc).ok).toBe(true);
  });
});

describe('search, filter and sort', () => {
  const items = [
    r('a', { name: 'Amit Sahoo', text: 'Great instructors', rating: 5, date: '2026-10-05T12:00:00.000Z', featured: true }),
    r('b', { name: 'Priya', text: 'Patient and friendly', rating: 3.5, date: '2026-09-01T12:00:00.000Z', published: false }),
    r('c', { name: 'Rohit', text: 'Passed first time', rating: 4, date: '2026-11-01T12:00:00.000Z' }),
  ];

  it('searches name and text, and filters featured and hidden', () => {
    expect(filterReviews(items, NO_REVIEW_FILTERS)).toHaveLength(3);
    expect(filterReviews(items, { ...NO_REVIEW_FILTERS, query: 'amit' }).map((x) => x.id)).toEqual(['a']);
    expect(filterReviews(items, { ...NO_REVIEW_FILTERS, query: 'FRIENDLY' }).map((x) => x.id)).toEqual(['b']);
    expect(filterReviews(items, { ...NO_REVIEW_FILTERS, featuredOnly: true }).map((x) => x.id)).toEqual(['a']);
    expect(filterReviews(items, { ...NO_REVIEW_FILTERS, hiddenOnly: true }).map((x) => x.id)).toEqual(['b']);
  });

  it('sorts newest, oldest, highest and lowest rated', () => {
    expect(sortReviews(items, 'newest').map((x) => x.id)).toEqual(['c', 'a', 'b']);
    expect(sortReviews(items, 'oldest').map((x) => x.id)).toEqual(['b', 'a', 'c']);
    expect(sortReviews(items, 'highest').map((x) => x.id)).toEqual(['a', 'c', 'b']);
    expect(sortReviews(items, 'lowest').map((x) => x.id)).toEqual(['b', 'c', 'a']);
    expect(items.map((x) => x.id)).toEqual(['a', 'b', 'c']); // the input is not changed
  });
});

describe('new reviews and dates', () => {
  it('a manual review starts published, not featured, 5 stars, dated now', () => {
    const n = newReview(new Date('2026-11-09T08:00:00Z'));
    expect(n).toMatchObject({ rating: 5, published: true, featured: false, name: '', text: '', date: '2026-11-09T08:00:00.000Z' });
    expect(n.id).toMatch(/^[a-z0-9]{9}$/);
  });

  it('rating choices are the half-star steps the schema allows', () => {
    expect(RATING_OPTIONS).toEqual([1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]);
    for (const v of RATING_OPTIONS) {
      expect(parseContent('reviews', { ...structuredClone(reviewsSeed), items: [r('x', { rating: v })] }).ok).toBe(true);
    }
  });

  it('date input values round-trip and stay on the same calendar day', () => {
    expect(dateInputValue('2026-10-05T12:00:00.000Z')).toBe('2026-10-05');
    expect(isoFromDateInput('2026-10-05')).toBe('2026-10-05T12:00:00.000Z');
    expect(dateInputValue(isoFromDateInput('2024-02-29'))).toBe('2024-02-29');
    expect(isoFromDateInput('')).toBe('');
    expect(isoFromDateInput('05/10/2026')).toBe('');
    expect(dateInputValue('nonsense')).toBe('');
  });
});

describe('the Reviews page summary is always real', () => {
  it('hiding a review changes the numbers; zero published shows empty values', () => {
    const base = [r('a', { rating: 5 }), r('b', { rating: 3 })];
    expect(computeReviewStats(base)).toMatchObject({ count: 2, rating: 4, happyLearners: 1, recommendPercent: 50 });
    expect(computeReviewStats([base[0], { ...base[1], published: false }])).toMatchObject({ count: 1, rating: 5, recommendPercent: 100 });
    expect(computeReviewStats([{ ...base[0], published: false }])).toEqual({ count: 0, rating: null, happyLearners: 0, recommendPercent: null });
  });
});
