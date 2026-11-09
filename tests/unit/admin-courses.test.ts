import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { duplicateSlugs, moveItem, newCourse, renumber, slugify, uniqueSlug } from '@/lib/admin/courses';
import { parseContent } from '@/lib/validators';
import coursesSeed from '@/content-seed/courses.json';

describe('slugify', () => {
  it('makes lowercase hyphenated slugs the schema accepts', () => {
    expect(slugify('Car Driving Course')).toBe('car-driving-course');
    expect(slugify('  Two-Wheeler & Scooter!  ')).toBe('two-wheeler-and-scooter');
    expect(slugify('Café Ünïcode 101')).toBe('cafe-unicode-101');
    expect(slugify('!!!')).toBe('');
  });
  it('never exceeds 60 characters or ends with a hyphen', () => {
    const s = slugify('a'.repeat(40) + ' ' + 'b'.repeat(40));
    expect(s.length).toBeLessThanOrEqual(60);
    expect(s.endsWith('-')).toBe(false);
  });
});

describe('uniqueSlug', () => {
  it('keeps a free slug and numbers a taken one', () => {
    expect(uniqueSlug('car', ['bike'])).toBe('car');
    expect(uniqueSlug('car', ['car'])).toBe('car-2');
    expect(uniqueSlug('car', ['car', 'car-2'])).toBe('car-3');
    expect(uniqueSlug('', [])).toBe('course');
  });
});

describe('renumber / moveItem', () => {
  const list = [{ id: 'a', order: 5 }, { id: 'b', order: 2 }, { id: 'c', order: 9 }];
  it('renumbers 1..n in list order', () => {
    expect(renumber(list).map((c) => c.order)).toEqual([1, 2, 3]);
  });
  it('moves an item and ignores out-of-range moves', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    const same = ['a', 'b'];
    expect(moveItem(same, 0, 5)).toBe(same);
    expect(moveItem(same, 1, 1)).toBe(same);
  });
});

describe('newCourse', () => {
  it('is a hidden draft placed last with a fresh id and a free slug', () => {
    const existing = [{ slug: 'new-course' }, { slug: 'car-driving' }];
    const c = newCourse(existing);
    expect(c.published).toBe(false);
    expect(c.order).toBe(3);
    expect(c.slug).toBe('new-course-2');
    expect(c.id).toMatch(/^course-[a-z0-9]{9}$/);
    expect(newCourse(existing).id).not.toBe(c.id);
  });
});

describe('duplicateSlugs', () => {
  it('finds repeated slugs', () => {
    expect([...duplicateSlugs([{ slug: 'a' }, { slug: 'b' }, { slug: 'a' }])]).toEqual(['a']);
    expect(duplicateSlugs([{ slug: 'a' }]).size).toBe(0);
  });
});

describe('courses document rules the editor relies on', () => {
  const doc = () => structuredClone(coursesSeed) as typeof coursesSeed;

  it('rejects two courses with the same slug and more than 8 courses', () => {
    const d = doc();
    d.courses[1].slug = d.courses[0].slug;
    expect(parseContent('courses', d).ok).toBe(false);

    const many = doc();
    many.courses = Array.from({ length: 9 }, (_, i) => ({ ...many.courses[0], id: `c${i}`, slug: `c-${i}`, order: i + 1 }));
    expect(parseContent('courses', many).ok).toBe(false);
  });

  it('a course needs 1–6 non-empty features', () => {
    const d = doc();
    d.courses[0].features = [];
    expect(parseContent('courses', d).ok).toBe(false);
    d.courses[0].features = Array.from({ length: 7 }, (_, i) => `f${i}`);
    expect(parseContent('courses', d).ok).toBe(false);
    d.courses[0].features = ['ok'];
    expect(parseContent('courses', d).ok).toBe(true);
  });

  it('zero published courses is still a valid document (the page shows an empty state)', () => {
    const d = doc();
    d.courses.forEach((c) => (c.published = false));
    expect(parseContent('courses', d).ok).toBe(true);
  });
});

describe('every place that lists courses derives from getPublishedCourses()', () => {
  const read = (p: string) => readFileSync(p, 'utf8');
  it('header dropdown (site shell), home teaser and the courses page', () => {
    for (const file of ['components/layout/site-shell.tsx', 'app/(site)/page.tsx', 'app/(site)/courses/page.tsx']) {
      const src = read(file);
      expect(src, file).toContain('getPublishedCourses');
      // never reads the raw list (which includes hidden drafts) for display
      expect(src, file).not.toMatch(/getCourses\(\)\)?\.courses|\.courses\.map/);
    }
  });
});
