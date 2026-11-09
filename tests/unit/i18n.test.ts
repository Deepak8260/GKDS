import { describe, expect, it } from 'vitest';
import { en } from '@/lib/i18n/dict';
import { or } from '@/lib/i18n/dict-or';
import { alternatePath, fmt, localeOfPath, localizePath, stripLocale } from '@/lib/i18n/locales';
import { applyOverlay, entrySource, entryText, mergeOverlays, normalizeOverlay } from '@/lib/i18n/overlay';
import { getAt as getAtPath } from '@/lib/admin/path';
import { isTranslatablePath, listTranslatable, TRANSLATABLE } from '@/lib/i18n/translatable';
import about from '@/content-seed/about.json';
import courses from '@/content-seed/courses.json';
import gallery from '@/content-seed/gallery.json';
import home from '@/content-seed/home.json';
import reviews from '@/content-seed/reviews.json';
import site from '@/content-seed/site.json';
import { seedOverlay } from '@/lib/i18n/content';
import type { ContentName } from '@/lib/validators';

const DOCS: Record<ContentName, unknown> = { site, home, about, courses, gallery, reviews };

describe('language of a path, and links between the two languages', () => {
  it('knows which language a URL belongs to', () => {
    expect(localeOfPath('/')).toBe('en');
    expect(localeOfPath('/about')).toBe('en');
    expect(localeOfPath('/or')).toBe('or');
    expect(localeOfPath('/or/courses')).toBe('or');
    expect(localeOfPath('/order')).toBe('en'); // only the exact /or prefix counts
    expect(localeOfPath('/organisation/or')).toBe('en');
  });

  it('strips and adds the Odia prefix, keeping hashes and queries', () => {
    expect(stripLocale('/or')).toBe('/');
    expect(stripLocale('/or/about')).toBe('/about');
    expect(stripLocale('/or/courses#car-driving')).toBe('/courses#car-driving');
    expect(stripLocale('/or?x=1')).toBe('/?x=1');
    expect(stripLocale('/about')).toBe('/about');
    expect(stripLocale('/order')).toBe('/order');

    expect(localizePath('/', 'or')).toBe('/or');
    expect(localizePath('/about', 'or')).toBe('/or/about');
    expect(localizePath('/courses#car-driving', 'or')).toBe('/or/courses#car-driving');
    expect(localizePath('/gallery?category=training', 'or')).toBe('/or/gallery?category=training');
    expect(localizePath('/or/about', 'or')).toBe('/or/about'); // already Odia
    expect(localizePath('/or/about', 'en')).toBe('/about');
    expect(localizePath('/or', 'en')).toBe('/');
  });

  it('leaves external links, mailto, tel and plain anchors alone', () => {
    for (const href of ['https://wa.me/91', 'mailto:a@b.in', 'tel:+9111', '#main', '//cdn.example/x']) {
      expect(localizePath(href, 'or')).toBe(href);
    }
  });

  it('the switch link goes to the same page in the other language', () => {
    expect(alternatePath('/about', 'or')).toBe('/or/about');
    expect(alternatePath('/or/about', 'en')).toBe('/about');
    expect(alternatePath('/', 'or')).toBe('/or');
    expect(alternatePath('/or', 'en')).toBe('/');
  });

  it('fmt fills {placeholders} and leaves unknown ones visible', () => {
    expect(fmt('Showing {shown} of {total} photos', { shown: 3, total: 9 })).toBe('Showing 3 of 9 photos');
    expect(fmt('Hello {name}')).toBe('Hello {name}');
  });
});

describe('the interface dictionaries', () => {
  const keys = (o: unknown, trail = ''): string[] =>
    o && typeof o === 'object' && !Array.isArray(o)
      ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => keys(v, `${trail}${k}.`))
      : Array.isArray(o)
        ? o.map((_, i) => `${trail}${i}`)
        : [trail.slice(0, -1)];

  it('Odia has exactly the same keys as English (the compiler also checks this)', () => {
    const en_ = keys(en).filter((k) => !k.startsWith('reviewForm.messages.'));
    const or_ = keys(or).filter((k) => !k.startsWith('reviewForm.messages.'));
    expect(or_).toEqual(en_);
  });

  it('every Odia string keeps the same {placeholders} as the English one', () => {
    const flat = (o: unknown, trail = '', out: Record<string, string> = {}) => {
      if (typeof o === 'string') out[trail.slice(0, -1)] = o;
      else if (Array.isArray(o)) o.forEach((v, i) => flat(v, `${trail}${i}.`, out));
      else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) flat(v, `${trail}${k}.`, out);
      return out;
    };
    const holders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
    const e = flat(en);
    const o = flat(or);
    for (const [k, v] of Object.entries(e)) expect(holders(o[k]), k).toBe(holders(v));
  });

  it('no Odia string is left empty (except the unused rating word 0)', () => {
    const empty: string[] = [];
    const walk = (o: unknown, trail = '') => {
      if (typeof o === 'string') {
        if (!o.trim() && trail !== 'reviewForm.words.0') empty.push(trail);
      } else if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${trail}.${i}`));
      else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, trail ? `${trail}.${k}` : k);
    };
    walk(or);
    expect(empty).toEqual([]);
  });

  it('the Odia form messages cover every English message the review API and validators can show', () => {
    const wanted = [
      'Please enter your name (at least 2 letters).',
      'Name must be 60 characters or fewer.',
      'Please choose a star rating.',
      'Please write at least 20 characters.',
      'Please keep your review under 600 characters.',
      'Enter a valid 10-digit mobile number.',
      'Please remove links, email addresses and phone numbers from your review.',
      'Too many reviews were submitted. Please try again later.',
      'Reviews are currently closed.',
      'Could not submit right now. Please try again later.',
    ];
    for (const m of wanted) expect(or.reviewForm.messages[m], m).toBeTruthy();
  });
});

describe('translation overlays', () => {
  const base = { hero: { title: 'Hello', image: 'media/pages/x.webp' }, list: [{ t: 'One' }, { t: 'Two' }], phones: ['+91 99999 99999'] };
  const allowed = (p: string) => /^(hero\.title|list\.\d+\.t)$/.test(p);

  it('replaces only translatable strings that exist', () => {
    const out = applyOverlay(
      base,
      { 'hero.title': 'ନମସ୍କାର', 'list.1.t': { t: 'ଦୁଇ', s: 'Two' }, 'hero.image': 'media/evil.webp', 'phones.0': '000', 'list.9.t': 'ghost' },
      allowed,
    );
    expect(out.hero.title).toBe('ନମସ୍କାର');
    expect(out.list.map((i) => i.t)).toEqual(['One', 'ଦୁଇ']);
    expect(out.hero.image).toBe('media/pages/x.webp'); // not translatable: ignored
    expect(out.phones).toEqual(['+91 99999 99999']);
    expect(out.list).toHaveLength(2); // a path to a missing item does not create one
    expect(base.hero.title).toBe('Hello'); // the original is untouched
  });

  it('keeps well-formed entries only, and the admin layer wins over the built-in one', () => {
    const clean = normalizeOverlay({ a: 'x', b: '  ', c: { t: 'y', s: 'src' }, d: { t: '' }, e: 5, f: null, g: ['no'] });
    expect(Object.keys(clean).sort()).toEqual(['a', 'c']);
    expect(entryText(clean.c)).toBe('y');
    expect(entrySource(clean.c)).toBe('src');
    expect(entrySource(clean.a)).toBeUndefined();
    expect(normalizeOverlay('nonsense')).toEqual({});
    expect(normalizeOverlay([1, 2])).toEqual({});
    expect(mergeOverlays({ a: 'seed', b: 'seed' }, { a: 'admin' })).toEqual({ a: 'admin', b: 'seed' });
  });
});

// fields that the starter content leaves empty or does not have (they are still translatable when filled in)
const OPTIONAL = ['whyChoose.items.*.text', 'trustBar.*.text', 'journey.steps.*.text', 'address.line2', 'address.landmark', 'titleHighlight', 'seo.keywords.*', 'highlights.imageAlt', 'courses.*.imageAlt'];

describe('what can be translated', () => {
  it('every translatable pattern matches something in the real content', () => {
    for (const [doc, patterns] of Object.entries(TRANSLATABLE)) {
      const found = listTranslatable(doc as ContentName, DOCS[doc as ContentName]).map((s) => s.path);
      for (const p of patterns) {
        const re = new RegExp(`^${p.split('.').map((s) => (s === '*' ? '\\d+' : s)).join('\\.')}$`);
        // optional fields may be absent from the seed
        if (OPTIONAL.includes(p)) continue;
        expect(found.some((f) => re.test(f)), `${doc}: "${p}" matches nothing in the content`).toBe(true);
      }
    }
  });

  it('never offers pictures, links, numbers, times, ids or visitors’ reviews', () => {
    const never: Record<string, string[]> = {
      site: ['logo', 'favicon', 'ogImage', 'phones.0', 'whatsapp', 'email', 'map.embedUrl', 'map.directionsUrl', 'social.youtube', 'openFrom', 'address.pin'],
      home: ['hero.image', 'trustBar.0.icon', 'aboutTeaser.image'],
      courses: ['courses.0.id', 'courses.0.slug', 'courses.0.image', 'highlights.image'],
      gallery: ['items.0.id', 'items.0.src', 'items.0.category', 'items.0.createdAt', 'categories.0.id', 'categories.0.icon'],
      reviews: ['items.0.name', 'items.0.text', 'items.0.avatar', 'hero.image'],
    };
    for (const [doc, paths] of Object.entries(never)) for (const p of paths) expect(isTranslatablePath(doc as ContentName, p), `${doc}:${p}`).toBe(false);
  });

  it('lists strings in reading order and skips empty ones', () => {
    const list = listTranslatable('gallery', { titleLead: 'Photo', titleHighlight: '', categories: [{ id: 'a', label: 'Cars', icon: 'car' }], items: [{ id: 'g1', alt: 'A car' }] });
    expect(list).toEqual([
      { path: 'titleLead', text: 'Photo' },
      { path: 'categories.0.label', text: 'Cars' },
      { path: 'items.0.alt', text: 'A car' },
    ]);
  });
});

describe('the built-in Odia translations of the content', () => {
  it('cover every translatable string of the starter content (numbers-only strings stay as they are)', () => {
    const missing: string[] = [];
    for (const doc of Object.keys(DOCS) as ContentName[]) {
      const overlay = seedOverlay(doc);
      for (const { path, text } of listTranslatable(doc, DOCS[doc])) {
        if (!/[A-Za-z]/.test(text)) continue; // "1000+", "250+"
        if (!(path in overlay)) missing.push(`${doc}:${path} = ${text}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('are really Odia text, and only for paths that exist and may be translated', () => {
    for (const doc of Object.keys(DOCS) as ContentName[]) {
      for (const [path, entry] of Object.entries(seedOverlay(doc))) {
        const text = entryText(entry);
        expect(/[଀-୿]/.test(text), `${doc}:${path} has no Odia letters: ${text}`).toBe(true);
        expect(isTranslatablePath(doc, path), `${doc}:${path} is not translatable`).toBe(true);
        expect(typeof getAtPath(DOCS[doc], path), `${doc}:${path} does not exist in the English content`).toBe('string');
      }
    }
  });
});
