import { describe, expect, it } from 'vitest';
import { computeReviewStats } from '@/lib/content/stats';
import { newId } from '@/lib/utils';

const review = (rating: number, published = true) => ({ rating, published });

describe('computeReviewStats', () => {
  it('is empty when there are no published reviews', () => {
    expect(computeReviewStats([])).toEqual({ count: 0, rating: null, happyLearners: 0, recommendPercent: null });
    expect(computeReviewStats([review(5, false)]).count).toBe(0);
  });

  it('a single review gives exactly that review as the numbers', () => {
    expect(computeReviewStats([review(5)])).toEqual({ count: 1, rating: 5, happyLearners: 1, recommendPercent: 100 });
    expect(computeReviewStats([review(2)])).toEqual({ count: 1, rating: 2, happyLearners: 0, recommendPercent: 0 });
  });

  it('averages published reviews to one decimal', () => {
    expect(computeReviewStats([review(5), review(5), review(4), review(4)]).rating).toBe(4.5);
    expect(computeReviewStats([review(5), review(5), review(4), review(5)]).rating).toBe(4.8);
  });

  it('counts 4-star and above as happy learners / would recommend', () => {
    const s = computeReviewStats([review(5), review(4), review(3), review(2)]);
    expect(s.happyLearners).toBe(2);
    expect(s.recommendPercent).toBe(50);
  });

  it('ignores unpublished reviews', () => {
    const s = computeReviewStats([review(5), review(1, false)]);
    expect(s).toMatchObject({ count: 1, rating: 5 });
  });
});

describe('newId', () => {
  it('produces unique, URL-safe ids', () => {
    const ids = new Set(Array.from({ length: 500 }, () => newId()));
    expect(ids.size).toBe(500);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]{9}$/);
  });
});
