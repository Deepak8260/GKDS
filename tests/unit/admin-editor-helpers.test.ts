import { describe, expect, it } from 'vitest';
import { getAt, prettyPath, setAt } from '@/lib/admin/path';
import { extractMapSrc } from '@/lib/admin/map';

describe('getAt / setAt', () => {
  const doc = { hero: { title: 'A', tags: ['x', 'y'] }, list: [{ n: 1 }, { n: 2 }] };

  it('reads nested objects and array items', () => {
    expect(getAt(doc, 'hero.title')).toBe('A');
    expect(getAt(doc, 'list.1.n')).toBe(2);
    expect(getAt(doc, 'hero.missing.deeper')).toBeUndefined();
  });

  it('sets a value without mutating the original', () => {
    const next = setAt(doc, 'hero.title', 'B');
    expect(next.hero.title).toBe('B');
    expect(doc.hero.title).toBe('A');
    expect(next.list).toBe(doc.list); // untouched branches are shared
  });

  it('sets inside arrays and keeps them arrays', () => {
    const next = setAt(doc, 'list.0.n', 9);
    expect(Array.isArray(next.list)).toBe(true);
    expect(next.list[0].n).toBe(9);
    expect(doc.list[0].n).toBe(1);
  });

  it('replaces whole arrays and creates missing parents', () => {
    expect(setAt(doc, 'hero.tags', ['z']).hero.tags).toEqual(['z']);
    expect(setAt({} as Record<string, unknown>, 'a.b', 1)).toEqual({ a: { b: 1 } });
    expect(setAt({} as Record<string, unknown>, 'a.0', 1)).toEqual({ a: [1] });
  });
});

describe('prettyPath', () => {
  it('turns schema paths into readable labels', () => {
    expect(prettyPath('trustBar.2.title')).toBe('Trust Bar › item 3 › Title');
    expect(prettyPath('address.pin')).toBe('Address › Pin');
  });
});

describe('extractMapSrc', () => {
  const url = 'https://www.google.com/maps/embed?pb=!1m18!1m12&hl=en';
  it('returns a plain URL trimmed', () => {
    expect(extractMapSrc(`  ${url}  `)).toBe(url);
  });
  it('pulls the src out of a pasted iframe (double or single quotes)', () => {
    const iframe = `<iframe src="${url}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`;
    expect(extractMapSrc(iframe)).toBe(url);
    expect(extractMapSrc(`<iframe width='1' src='${url}'></iframe>`)).toBe(url);
  });
  it('decodes &amp; inside the pasted snippet', () => {
    expect(extractMapSrc('<iframe src="https://www.google.com/maps/embed?pb=1&amp;hl=en"></iframe>')).toBe('https://www.google.com/maps/embed?pb=1&hl=en');
  });
  it('leaves non-iframe junk for the schema to reject', () => {
    expect(extractMapSrc('not a url')).toBe('not a url');
    expect(extractMapSrc('<iframe></iframe>')).toBe('');
  });
});
