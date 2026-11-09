import { newId } from '@/lib/utils';
import type { GalleryCategory, GalleryItem, GalleryVideo } from '@/lib/validators';
import { slugify, uniqueSlug } from './courses';

/** Numbers photos 1..n in list order. */
export function renumberItems<T extends { order: number }>(items: T[]): T[] {
  return items.map((it, i) => (it.order === i + 1 ? it : { ...it, order: i + 1 }));
}

export interface GalleryFilters {
  category: string; // '' = all
  query: string;
  missingAlt: boolean;
  hiddenOnly: boolean;
}

export const NO_FILTERS: GalleryFilters = { category: '', query: '', missingAlt: false, hiddenOnly: false };

export function filtersActive(f: GalleryFilters): boolean {
  return Boolean(f.category || f.query.trim() || f.missingAlt || f.hiddenOnly);
}

export function filterItems(items: GalleryItem[], f: GalleryFilters): GalleryItem[] {
  const q = f.query.trim().toLowerCase();
  return items.filter(
    (it) =>
      (!f.category || it.category === f.category) &&
      (!q || it.alt.toLowerCase().includes(q)) &&
      (!f.missingAlt || !it.alt.trim()) &&
      (!f.hiddenOnly || !it.published),
  );
}

export interface GalleryStats {
  total: number;
  published: number;
  hidden: number;
  missingAlt: number;
}

export function galleryStats(items: Pick<GalleryItem, 'published' | 'alt'>[]): GalleryStats {
  const published = items.filter((i) => i.published).length;
  return { total: items.length, published, hidden: items.length - published, missingAlt: items.filter((i) => !i.alt.trim()).length };
}

export function categoryCounts(items: Pick<GalleryItem, 'category'>[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const it of items) counts[it.category] = (counts[it.category] ?? 0) + 1;
  return counts;
}

/** A just-uploaded photo, appended after the last one, published, alt text still to be written. */
export function newPhoto(src: string, category: string, now = new Date()): GalleryItem {
  return { id: newId(), src, alt: '', category, order: 0, published: true, createdAt: now.toISOString() };
}

/**
 * Move `id` so that it takes the place of `targetId` (dragging, or ↑/↓ inside a filtered view: the neighbour in
 * the filtered list is the target, so the photo jumps over it in the full list).
 */
export function moveBefore<T extends { id: string }>(items: T[], id: string, targetId: string): T[] {
  const from = items.findIndex((i) => i.id === id);
  const to = items.findIndex((i) => i.id === targetId);
  if (from < 0 || to < 0 || from === to) return items;
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Why a category cannot be deleted yet (null when it can). */
export function categoryDeleteBlock(categoryId: string, items: Pick<GalleryItem, 'category'>[]): string | null {
  const n = items.filter((i) => i.category === categoryId).length;
  if (n === 0) return null;
  return `Move or delete those ${n} photo${n === 1 ? '' : 's'} first.`;
}

export const MAX_CATEGORIES = 12;

/** A new category from its label: unique slug id, a default icon. */
export function newCategory(label: string, existing: Pick<GalleryCategory, 'id'>[]): GalleryCategory {
  return { id: uniqueSlug(slugify(label) || 'category', existing.map((c) => c.id)), label, icon: 'camera' };
}

/** A new, empty driving-video entry (the admin fills in the link and title). */
export function newVideo(): GalleryVideo {
  return { id: newId(), url: '', title: '', published: true };
}
