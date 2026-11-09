import { describe, expect, it } from 'vitest';
import { buildRows, buildSavedOverlay, pathLabel } from '@/lib/i18n/admin';
import { applyOverlay } from '@/lib/i18n/overlay';
import { isTranslatablePath } from '@/lib/i18n/translatable';

const english = {
  hero: { title: 'Our Courses', subtitle: 'Learn well', image: 'media/pages/x.webp', imageAlt: 'A car' },
  courses: [{ id: 'c1', slug: 'car', title: 'Car Course', features: ['Easy', 'Safe'] }],
};

describe('translation rows for the admin table', () => {
  it('lists only translatable strings, with where the Odia text comes from', () => {
    const rows = buildRows('courses', english, { 'hero.title': 'ଆମର ପାଠ୍ୟକ୍ରମ' }, { 'hero.subtitle': { t: 'ଭଲ ଭାବରେ ଶିଖନ୍ତୁ', s: 'Learn well' } });
    expect(rows.map((r) => r.path)).toEqual(['hero.title', 'hero.subtitle', 'hero.imageAlt', 'courses.0.title', 'courses.0.features.0', 'courses.0.features.1']);
    const by = Object.fromEntries(rows.map((r) => [r.path, r]));
    expect(by['hero.title']).toMatchObject({ source: 'built-in', or: 'ଆମର ପାଠ୍ୟକ୍ରମ', stale: false });
    expect(by['hero.subtitle']).toMatchObject({ source: 'saved', or: 'ଭଲ ଭାବରେ ଶିଖନ୍ତୁ', stale: false });
    expect(by['courses.0.title']).toMatchObject({ source: 'none', or: '' });
  });

  it('a saved translation is "stale" once the English text changed afterwards, and the admin one wins over the built-in', () => {
    const rows = buildRows('courses', { ...english, hero: { ...english.hero, subtitle: 'Learn very well' } }, { 'hero.subtitle': 'built-in Odia' }, { 'hero.subtitle': { t: 'ପୁରୁଣା', s: 'Learn well' } });
    const row = rows.find((r) => r.path === 'hero.subtitle')!;
    expect(row).toMatchObject({ source: 'saved', or: 'ପୁରୁଣା', stale: true });
  });

  it('labels paths for people', () => {
    expect(pathLabel('courses.0.features.2')).toBe('Courses › #1 › Features › #3');
    expect(pathLabel('hero.titleLead')).toBe('Hero › Title Lead');
  });
});

describe('saving translations', () => {
  it('keeps text for translatable paths, remembers the English it translates, and drops empty boxes', () => {
    const r = buildSavedOverlay('courses', english, { 'hero.title': '  ଆମର ପାଠ୍ୟକ୍ରମ  ', 'hero.subtitle': '   ', 'courses.0.features.1': 'ସୁରକ୍ଷିତ' });
    expect(r).toEqual({
      ok: true,
      overlay: { 'hero.title': { t: 'ଆମର ପାଠ୍ୟକ୍ରମ', s: 'Our Courses' }, 'courses.0.features.1': { t: 'ସୁରକ୍ଷିତ', s: 'Safe' } },
    });
  });

  it('refuses anything that is not a translatable string of this document', () => {
    for (const bad of [{ 'hero.image': 'media/pages/evil.webp' }, { 'courses.0.slug': 'x' }, { 'courses.0.id': 'x' }, { 'nothing.here': 'x' }, { 'courses.5.title': 'ghost item' }]) {
      const r = buildSavedOverlay('courses', english, bad);
      expect(r.ok, JSON.stringify(bad)).toBe(false);
    }
  });

  it('refuses wrong shapes, over-long text and control characters', () => {
    expect(buildSavedOverlay('courses', english, null).ok).toBe(false);
    expect(buildSavedOverlay('courses', english, ['x']).ok).toBe(false);
    expect(buildSavedOverlay('courses', english, { 'hero.title': 5 }).ok).toBe(false);
    expect(buildSavedOverlay('courses', english, { 'hero.title': 'ଅ'.repeat(2001) }).ok).toBe(false);
    expect(buildSavedOverlay('courses', english, { 'hero.title': 'bad\u0000text' }).ok).toBe(false);
    expect(buildSavedOverlay('courses', english, { 'hero.title': 'ok\nsecond line' }).ok).toBe(true); // line breaks are fine
  });

  it('a saved translation shows up on the Odia site and cannot touch anything else', () => {
    const built = buildSavedOverlay('courses', english, { 'hero.title': 'ଆମର ପାଠ୍ୟକ୍ରମ' });
    if (!built.ok) throw new Error('expected ok');
    const odia = applyOverlay(english, built.overlay, (p) => isTranslatablePath('courses', p));
    expect(odia.hero.title).toBe('ଆମର ପାଠ୍ୟକ୍ରମ');
    expect(odia.hero.image).toBe('media/pages/x.webp');
    expect(odia.courses[0].slug).toBe('car');
  });
});
