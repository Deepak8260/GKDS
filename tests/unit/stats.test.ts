import { describe, expect, it } from 'vitest';
import { computeReviewStats } from '@/lib/content/stats';
import { newId } from '@/lib/utils';
import type { Review } from '@/lib/validators';

const site = {
  stats: {
    sinceYear: 1993,
    yearsLabel: '30+ Years',
    trainedDrivers: '1000+',
    successRateLabel: 'High Success Rate',
    rating: 4.8,
    ratingCount: '250+',
    recommendPercent: 95,
  },
};

const review = (rating: number, published = true): Review => ({
  id: String(Math.random()),
  name: 'T',
  rating,
  text: 'text',
  date: '2026-10-01T00:00:00.000Z',
  published,
  featured: false,
});

describe('computeReviewStats', () => {
  it('manual mode uses the numbers from site settings', () => {
    const s = computeReviewStats([review(1)], site, 'manual');
    expect(s).toMatchObject({ rating: 4.8, ratingCount: '250+', recommendPercent: 95, mode: 'manual' });
  });

  it('auto mode averages published reviews to one decimal', () => {
    const s = computeReviewStats([review(5), review(5), review(4), review(4.5)], site, 'auto');
    expect(s.rating).toBe(4.6); // (5+5+4+4.5)/4 = 4.625 → 4.6
    expect(s.ratingCount).toBe('4');
    expect(s.mode).toBe('auto');
  });

  it('auto mode computes recommend % as share of 4★+ reviews', () => {
    const s = computeReviewStats([review(5), review(4), review(3), review(2)], site, 'auto');
    expect(s.recommendPercent).toBe(50);
  });

  it('auto mode ignores unpublished reviews', () => {
    const s = computeReviewStats([review(5), review(1, false)], site, 'auto');
    expect(s.rating).toBe(5);
    expect(s.ratingCount).toBe('1');
  });

  it('auto mode falls back to manual numbers when there are no published reviews', () => {
    const s = computeReviewStats([review(5, false)], site, 'auto');
    expect(s.mode).toBe('manual');
    expect(s.rating).toBe(4.8);
  });

  it('keeps the trained-drivers label from site settings', () => {
    expect(computeReviewStats([review(5)], site, 'auto').trainedDrivers).toBe('1000+');
  });
});

describe('newId', () => {
  it('produces unique, URL-safe ids', () => {
    const ids = new Set(Array.from({ length: 500 }, () => newId()));
    expect(ids.size).toBe(500);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]{9}$/);
  });
});
