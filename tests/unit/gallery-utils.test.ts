import { describe, expect, it } from 'vitest';
import {
  ALL,
  PAGE_SIZE,
  countLabel,
  filterByCategory,
  resolveCategory,
  swipeDirection,
  wrapIndex,
} from '@/components/sections/gallery/gallery-utils';
import type { GalleryItem } from '@/lib/validators';

const item = (id: string, category: string): GalleryItem => ({
  id,
  src: `/assets/photos/${id}.webp`,
  alt: `Photo ${id}`,
  category,
  order: 1,
  published: true,
  createdAt: '2026-09-01T10:00:00.000Z',
});
const items = [item('a', 'vehicles'), item('b', 'training'), item('c', 'vehicles'), item('d', 'premises')];
const categories = [{ id: 'vehicles' }, { id: 'training' }, { id: 'premises' }];

describe('resolveCategory', () => {
  it('accepts a real category id', () => {
    expect(resolveCategory('training', categories)).toBe('training');
  });
  it('falls back to "all" for unknown, empty or missing values', () => {
    expect(resolveCategory('nope', categories)).toBe(ALL);
    expect(resolveCategory('', categories)).toBe(ALL);
    expect(resolveCategory(null, categories)).toBe(ALL);
  });
  it('does not let "all" or odd strings through as categories', () => {
    expect(resolveCategory('<script>', categories)).toBe(ALL);
    expect(resolveCategory('VEHICLES', categories)).toBe(ALL);
  });
});

describe('filterByCategory', () => {
  it('returns everything for "all"', () => expect(filterByCategory(items, ALL)).toHaveLength(4));
  it('returns only the matching category, keeping order', () => {
    expect(filterByCategory(items, 'vehicles').map((i) => i.id)).toEqual(['a', 'c']);
  });
  it('returns an empty list for a category with no photos', () => {
    expect(filterByCategory(items, 'facilities')).toEqual([]);
  });
});

describe('wrapIndex', () => {
  it('wraps forwards and backwards', () => {
    expect(wrapIndex(5, 5)).toBe(0);
    expect(wrapIndex(-1, 5)).toBe(4);
    expect(wrapIndex(2, 5)).toBe(2);
    expect(wrapIndex(-6, 5)).toBe(4);
  });
  it('is safe for an empty list', () => expect(wrapIndex(3, 0)).toBe(0));
});

describe('swipeDirection', () => {
  it('swipe left (negative dx) goes next, swipe right goes previous', () => {
    expect(swipeDirection(-80)).toBe(1);
    expect(swipeDirection(80)).toBe(-1);
  });
  it('ignores movements under the 50px threshold', () => {
    expect(swipeDirection(30)).toBe(0);
    expect(swipeDirection(-49)).toBe(0);
    expect(swipeDirection(0)).toBe(0);
  });
  it('treats exactly 50px as a swipe', () => {
    expect(swipeDirection(-50)).toBe(1);
    expect(swipeDirection(50)).toBe(-1);
  });
});

describe('countLabel / paging', () => {
  it('describes what is shown', () => {
    expect(countLabel(9, 9)).toBe('Showing 9 photos');
    expect(countLabel(1, 1)).toBe('Showing 1 photo');
    expect(countLabel(12, 30)).toBe('Showing 12 of 30 photos');
    expect(countLabel(0, 0)).toBe('No photos');
  });
  it('pages 12 at a time', () => expect(PAGE_SIZE).toBe(12));
});
