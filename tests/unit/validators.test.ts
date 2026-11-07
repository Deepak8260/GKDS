import { describe, expect, it } from 'vitest';
import siteSeed from '@/content-seed/site.json';
import homeSeed from '@/content-seed/home.json';
import aboutSeed from '@/content-seed/about.json';
import coursesSeed from '@/content-seed/courses.json';
import gallerySeed from '@/content-seed/gallery.json';
import reviewsSeed from '@/content-seed/reviews.json';
import {
  adminConfigSchema,
  contentNames,
  isGoogleMapsEmbed,
  parseContent,
  pendingReviewSchema,
} from '@/lib/validators';

const seeds = {
  site: siteSeed,
  home: homeSeed,
  about: aboutSeed,
  courses: coursesSeed,
  gallery: gallerySeed,
  reviews: reviewsSeed,
};

const clone = <T>(v: T): T => structuredClone(v);

describe('seed content', () => {
  it.each(contentNames)('%s.json passes its schema', (name) => {
    const result = parseContent(name, seeds[name]);
    expect(result.ok, JSON.stringify(result)).toBe(true);
  });
});

describe('site schema', () => {
  it('accepts placeholder phone numbers with X', () => {
    expect(parseContent('site', seeds.site).ok).toBe(true);
  });

  it('rejects an invalid phone number', () => {
    const data = clone(seeds.site);
    data.phones = ['abc'];
    const r = parseContent('site', data);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors)).toContain('phones.0');
  });

  it('requires at least one phone', () => {
    const data = clone(seeds.site);
    data.phones = [];
    expect(parseContent('site', data).ok).toBe(false);
  });

  it('rejects a map URL that is not a Google Maps embed', () => {
    const data = clone(seeds.site);
    data.map.embedUrl = 'https://example.com/map';
    const r = parseContent('site', data);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors['map.embedUrl']).toMatch(/Embed a map/);
  });

  it('rejects non-https social links but allows empty ones', () => {
    const bad = clone(seeds.site);
    bad.social.facebook = 'http://facebook.com/x';
    expect(parseContent('site', bad).ok).toBe(false);
    const empty = clone(seeds.site);
    empty.social.facebook = '';
    expect(parseContent('site', empty).ok).toBe(true);
  });

  it('validates PIN and time formats', () => {
    const data = clone(seeds.site);
    data.address.pin = '75600';
    data.openFrom = '8am';
    const r = parseContent('site', data);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors['address.pin']).toBeDefined();
      expect(r.errors['openFrom']).toBeDefined();
    }
  });
});

describe('isGoogleMapsEmbed', () => {
  it('accepts only https://www.google.com/maps/embed URLs', () => {
    expect(isGoogleMapsEmbed('https://www.google.com/maps/embed?pb=abc')).toBe(true);
    expect(isGoogleMapsEmbed('http://www.google.com/maps/embed?pb=abc')).toBe(false);
    expect(isGoogleMapsEmbed('https://www.google.com/maps/search/?q=x')).toBe(false);
    expect(isGoogleMapsEmbed('https://evil.com/maps/embed')).toBe(false);
    expect(isGoogleMapsEmbed('not a url')).toBe(false);
  });
});

describe('courses schema', () => {
  it('rejects duplicate slugs', () => {
    const data = clone(seeds.courses);
    data.courses[1].slug = data.courses[0].slug;
    expect(parseContent('courses', data).ok).toBe(false);
  });

  it('rejects slugs that are not URL-safe', () => {
    const data = clone(seeds.courses);
    data.courses[0].slug = 'Car Driving!';
    expect(parseContent('courses', data).ok).toBe(false);
  });

  it('allows adding a third course', () => {
    const data = clone(seeds.courses);
    data.courses.push({ ...data.courses[0], id: 'course-new', slug: 'bike-riding', order: 3 });
    expect(parseContent('courses', data).ok).toBe(true);
  });
});

describe('gallery schema', () => {
  it('rejects a photo whose category does not exist', () => {
    const data = clone(seeds.gallery);
    data.items[0].category = 'nope';
    expect(parseContent('gallery', data).ok).toBe(false);
  });

  it('requires alt text', () => {
    const data = clone(seeds.gallery);
    data.items[0].alt = '  ';
    expect(parseContent('gallery', data).ok).toBe(false);
  });
});

describe('reviews schema', () => {
  it('accepts half-star ratings but not other fractions', () => {
    const ok = clone(seeds.reviews);
    ok.items[0].rating = 4.5;
    expect(parseContent('reviews', ok).ok).toBe(true);
    const bad = clone(seeds.reviews);
    bad.items[0].rating = 4.3;
    expect(parseContent('reviews', bad).ok).toBe(false);
  });

  it('rejects ratings outside 1–5', () => {
    const data = clone(seeds.reviews);
    data.items[0].rating = 6;
    expect(parseContent('reviews', data).ok).toBe(false);
  });

  it('allows at most 3 featured published reviews', () => {
    const data = clone(seeds.reviews);
    data.items.forEach((r) => (r.featured = true));
    expect(parseContent('reviews', data).ok).toBe(false);
  });

  it('defaults acceptSubmissions to true when missing', () => {
    const data: Record<string, unknown> = clone(seeds.reviews);
    delete data.acceptSubmissions;
    const r = parseContent('reviews', data);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.acceptSubmissions).toBe(true);
  });
});

describe('parseContent errors', () => {
  it('returns field-level errors keyed by dotted path', () => {
    const data = clone(seeds.home);
    data.hero.primaryCta = '';
    const r = parseContent('home', data);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors['hero.primaryCta']).toBeDefined();
  });

  it('rejects completely wrong input', () => {
    expect(parseContent('about', null).ok).toBe(false);
    expect(parseContent('site', 'text').ok).toBe(false);
  });
});

describe('other schemas', () => {
  it('validates a pending review', () => {
    const ok = pendingReviewSchema.safeParse({
      id: 'abc123',
      name: 'Test User',
      rating: 5,
      text: 'Great training and very helpful instructors.',
      submittedAt: '2026-11-01T10:00:00.000Z',
      status: 'pending',
    });
    expect(ok.success).toBe(true);
    const bad = pendingReviewSchema.safeParse({ id: 'x', name: 'A', rating: 4.5, text: 't', submittedAt: 'nope', status: 'pending' });
    expect(bad.success).toBe(false);
  });

  it('validates admin config', () => {
    expect(
      adminConfigSchema.safeParse({ hash: 'h', salt: 's', updatedAt: '2026-11-01T00:00:00.000Z', sessionVersion: 0 }).success,
    ).toBe(true);
    expect(adminConfigSchema.safeParse({ hash: '', salt: 's', updatedAt: 'x', sessionVersion: -1 }).success).toBe(false);
  });
});
