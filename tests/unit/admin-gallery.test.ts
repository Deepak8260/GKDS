import { describe, expect, it } from 'vitest';
import {
  categoryCounts,
  categoryDeleteBlock,
  filterItems,
  filtersActive,
  galleryStats,
  moveBefore,
  newCategory,
  newPhoto,
  NO_FILTERS,
  renumberItems,
} from '@/lib/admin/gallery';
import { parseContent } from '@/lib/validators';
import gallerySeed from '@/content-seed/gallery.json';

const item = (id: string, over: Partial<{ alt: string; category: string; published: boolean }> = {}) => ({
  id,
  src: `media/gallery/${id}.webp`,
  alt: over.alt ?? `Photo ${id}`,
  category: over.category ?? 'vehicles',
  order: 0,
  published: over.published ?? true,
  createdAt: '2026-10-01T00:00:00.000Z',
});

describe('gallery stats and filters', () => {
  const items = [item('a'), item('b', { alt: '  ', category: 'training' }), item('c', { published: false }), item('d', { alt: '', published: false })];

  it('counts photos, published, hidden and missing alt text', () => {
    expect(galleryStats(items)).toEqual({ total: 4, published: 2, hidden: 2, missingAlt: 2 });
    expect(categoryCounts(items)).toEqual({ vehicles: 3, training: 1 });
  });

  it('filters by category, search text, missing alt and hidden', () => {
    expect(filterItems(items, NO_FILTERS)).toHaveLength(4);
    expect(filterItems(items, { ...NO_FILTERS, category: 'training' }).map((i) => i.id)).toEqual(['b']);
    expect(filterItems(items, { ...NO_FILTERS, query: 'photo c' }).map((i) => i.id)).toEqual(['c']);
    expect(filterItems(items, { ...NO_FILTERS, missingAlt: true }).map((i) => i.id)).toEqual(['b', 'd']);
    expect(filterItems(items, { ...NO_FILTERS, hiddenOnly: true }).map((i) => i.id)).toEqual(['c', 'd']);
    expect(filterItems(items, { ...NO_FILTERS, hiddenOnly: true, missingAlt: true }).map((i) => i.id)).toEqual(['d']);
  });

  it('knows when any filter is on', () => {
    expect(filtersActive(NO_FILTERS)).toBe(false);
    expect(filtersActive({ ...NO_FILTERS, query: ' x ' })).toBe(true);
    expect(filtersActive({ ...NO_FILTERS, query: '   ' })).toBe(false);
  });
});

describe('ordering', () => {
  it('renumbers 1..n', () => {
    expect(renumberItems([item('a'), item('b'), item('c')]).map((i) => i.order)).toEqual([1, 2, 3]);
  });
  it('moveBefore puts a photo where the target was', () => {
    const list = [item('a'), item('b'), item('c'), item('d')];
    expect(moveBefore(list, 'd', 'b').map((i) => i.id)).toEqual(['a', 'd', 'b', 'c']);
    expect(moveBefore(list, 'a', 'c').map((i) => i.id)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveBefore(list, 'a', 'a')).toBe(list);
    expect(moveBefore(list, 'zzz', 'a')).toBe(list);
  });
});

describe('uploads and categories', () => {
  it('a new photo is published, last in line and needs alt text', () => {
    const p = newPhoto('media/gallery/aaaa1111-x.webp', 'events', new Date('2026-11-01T10:00:00Z'));
    expect(p).toMatchObject({ src: 'media/gallery/aaaa1111-x.webp', category: 'events', published: true, alt: '', createdAt: '2026-11-01T10:00:00.000Z' });
    expect(p.id).toMatch(/^[a-z0-9]{9}$/);
  });

  it('a non-empty category cannot be deleted', () => {
    const items = [item('a'), item('b'), item('c', { category: 'training' })];
    expect(categoryDeleteBlock('vehicles', items)).toBe('Move or delete those 2 photos first.');
    expect(categoryDeleteBlock('training', items)).toBe('Move or delete those 1 photo first.');
    expect(categoryDeleteBlock('premises', items)).toBeNull();
  });

  it('new categories get a unique slug id', () => {
    expect(newCategory('Road Safety Week', [{ id: 'vehicles' }])).toMatchObject({ id: 'road-safety-week', label: 'Road Safety Week' });
    expect(newCategory('Training', [{ id: 'training' }]).id).toBe('training-2');
    expect(newCategory('!!!', []).id).toBe('category');
  });
});

describe('gallery document rules the editor relies on', () => {
  const doc = () => structuredClone(gallerySeed) as typeof gallerySeed;

  it('a photo without alt text blocks the save (and an uploaded one starts without it)', () => {
    const d = doc();
    d.items.push({ ...newPhoto('media/gallery/aaaa1111-x.webp', 'vehicles'), order: d.items.length + 1 });
    const r = parseContent('gallery', d);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).some((k) => k.endsWith('.alt'))).toBe(true);
    d.items[d.items.length - 1].alt = 'Learner at the wheel';
    expect(parseContent('gallery', d).ok).toBe(true);
  });

  it('a photo must belong to an existing category', () => {
    const d = doc();
    d.items[0].category = 'nope';
    expect(parseContent('gallery', d).ok).toBe(false);
  });
});
