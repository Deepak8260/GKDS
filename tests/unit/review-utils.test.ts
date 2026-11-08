import { describe, expect, it } from 'vitest';
import {
  PAGE_SIZE,
  countLabel,
  formatRating,
  parseCount,
  resolveSort,
  sortReviews,
} from '@/components/sections/reviews/review-utils';
import type { Review } from '@/lib/validators';

const r = (id: string, rating: number, date: string): Review => ({
  id,
  name: id,
  rating,
  text: 'text',
  date,
  published: true,
  featured: false,
});

const list = [
  r('old5', 5, '2026-08-01T00:00:00.000Z'),
  r('new4', 4, '2026-10-20T00:00:00.000Z'),
  r('mid5', 5, '2026-09-15T00:00:00.000Z'),
  r('new5', 5, '2026-10-30T00:00:00.000Z'),
  r('half', 4.5, '2026-10-01T00:00:00.000Z'),
  r('low2', 2, '2026-10-25T00:00:00.000Z'),
];
const ids = (xs: Review[]) => xs.map((x) => x.id);

describe('sortReviews', () => {
  it('recent: newest first', () => {
    expect(ids(sortReviews(list, 'recent'))).toEqual(['new5', 'low2', 'new4', 'half', 'mid5', 'old5']);
  });

  it('highest: rating high → low, ties newest first', () => {
    expect(ids(sortReviews(list, 'highest'))).toEqual(['new5', 'mid5', 'old5', 'half', 'new4', 'low2']);
  });

  it('lowest: rating low → high, ties newest first', () => {
    expect(ids(sortReviews(list, 'lowest'))).toEqual(['low2', 'new4', 'half', 'new5', 'mid5', 'old5']);
  });

  it('treats a half star as between 4 and 5', () => {
    const top = sortReviews(list, 'highest');
    expect(top.findIndex((x) => x.id === 'half')).toBeGreaterThan(top.findIndex((x) => x.id === 'old5'));
    expect(top.findIndex((x) => x.id === 'half')).toBeLessThan(top.findIndex((x) => x.id === 'new4'));
  });

  it('breaks full ties (same rating AND date) by id, so the order is stable', () => {
    const tied = [r('b', 5, '2026-10-01T00:00:00.000Z'), r('a', 5, '2026-10-01T00:00:00.000Z'), r('c', 5, '2026-10-01T00:00:00.000Z')];
    for (const mode of ['recent', 'highest', 'lowest'] as const) expect(ids(sortReviews(tied, mode))).toEqual(['a', 'b', 'c']);
  });

  it('does not change the input array', () => {
    const copy = [...list];
    sortReviews(list, 'lowest');
    expect(list).toEqual(copy);
  });

  it('handles empty and single lists', () => {
    expect(sortReviews([], 'highest')).toEqual([]);
    expect(ids(sortReviews([list[0]], 'lowest'))).toEqual(['old5']);
  });
});

describe('resolveSort', () => {
  it('accepts the three modes', () => {
    expect(resolveSort('recent')).toBe('recent');
    expect(resolveSort('highest')).toBe('highest');
    expect(resolveSort('lowest')).toBe('lowest');
  });
  it('defaults to recent for anything else', () => {
    for (const v of [null, '', 'best', 'HIGHEST', '<script>']) expect(resolveSort(v)).toBe('recent');
  });
});

describe('helpers', () => {
  it('pages 9 at a time', () => expect(PAGE_SIZE).toBe(9));
  it('countLabel', () => {
    expect(countLabel(9, 20)).toBe('Showing 9 of 20 reviews');
    expect(countLabel(6, 6)).toBe('Showing 6 reviews');
    expect(countLabel(1, 1)).toBe('Showing 1 review');
    expect(countLabel(0, 0)).toBe('No reviews yet');
  });
  it('formatRating keeps one decimal', () => {
    expect(formatRating(4.8)).toBe('4.8');
    expect(formatRating(5)).toBe('5.0');
    expect(formatRating(4.55)).toBe('4.6');
  });
  it('parseCount reads "250+" and falls back when there are no digits', () => {
    expect(parseCount('250+', 3)).toBe(250);
    expect(parseCount('1,200 reviews', 3)).toBe(1200);
    expect(parseCount('many', 3)).toBe(3);
    expect(parseCount('0', 3)).toBe(3);
  });
});
