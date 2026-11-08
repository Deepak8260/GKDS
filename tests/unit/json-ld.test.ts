import { describe, expect, it } from 'vitest';
import siteSeed from '@/content-seed/site.json';
import {
  SCHOOL_ID,
  breadcrumbJsonLd,
  contactPoints,
  drivingSchoolEntity,
  jsonLdString,
  realPhones,
  siteGraph,
} from '@/lib/json-ld';
import { resolveSiteUrl } from '@/lib/site-url';
import type { Site } from '@/lib/validators';

const site = siteSeed as unknown as Site;
const withPhones = (phones: string[]): Site => ({ ...site, phones });

describe('jsonLdString', () => {
  it('escapes characters that could close the script tag', () => {
    const s = jsonLdString({ a: '</script><script>alert(1)</script>', b: 'R&D' });
    expect(s).not.toContain('<');
    expect(s).not.toContain('>');
    expect(s).toContain('\\u003c/script\\u003e');
    expect(JSON.parse(s).a).toBe('</script><script>alert(1)</script>');
    expect(JSON.parse(s).b).toBe('R&D');
  });
});

describe('phone numbers in structured data', () => {
  it('leaves out placeholders and keeps digits and + only', () => {
    expect(realPhones(withPhones(['+91 9XXXXXXXXX', '+91 98765 43210']))).toEqual(['+919876543210']);
    expect(realPhones(withPhones(['+91 9XXXXXXXXX']))).toEqual([]);
  });

  it('contactPoint uses telephone numbers when real, email while they are placeholders', () => {
    const real = contactPoints(withPhones(['+91 98765 43210', '0678 222 3333']));
    expect(real).toHaveLength(2);
    expect(real[0]).toMatchObject({ '@type': 'ContactPoint', telephone: '+919876543210', contactType: 'customer service', areaServed: 'IN-OR' });
    expect(real[0].availableLanguage).toEqual(['en', 'or', 'hi']);
    const placeholder = contactPoints(site);
    expect(placeholder).toHaveLength(1);
    expect(placeholder[0]).toMatchObject({ email: 'gopalkrishna.driving@gmail.com' });
    expect('telephone' in placeholder[0]).toBe(false);
  });
});

describe('drivingSchoolEntity', () => {
  const entity = drivingSchoolEntity(site, { value: 4.8, count: 250 });

  it('is a DrivingSchool with a stable @id and the founding year', () => {
    expect(entity['@type']).toBe('DrivingSchool');
    expect(entity['@id']).toBe(SCHOOL_ID);
    expect(entity.foundingDate).toBe('1993');
  });

  it('has a postal address for Baleswar, Odisha, India', () => {
    expect(entity.address).toMatchObject({
      '@type': 'PostalAddress',
      addressLocality: 'Baleswar',
      addressRegion: 'Odisha',
      postalCode: '756001',
      addressCountry: 'IN',
    });
  });

  it('builds opening hours from the open days (0 = Sunday) and times', () => {
    expect(entity.openingHoursSpecification).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '08:00',
        closes: '18:00',
      },
    ]);
  });

  it('includes sameAs for the social links and the aggregate rating', () => {
    expect(entity.sameAs).toEqual(['https://www.youtube.com/', 'https://www.facebook.com/', 'https://www.instagram.com/']);
    expect(entity.aggregateRating).toEqual({ '@type': 'AggregateRating', ratingValue: 4.8, reviewCount: 250, bestRating: 5, worstRating: 1 });
  });

  it('omits the rating when none is given and omits sameAs when no social links are set', () => {
    const bare = drivingSchoolEntity({ ...site, social: {} });
    expect('aggregateRating' in bare).toBe(false);
    expect('sameAs' in bare).toBe(false);
  });

  it('survives a JSON round trip (valid JSON, no undefined values leaking)', () => {
    const parsed = JSON.parse(jsonLdString({ '@context': 'https://schema.org', ...entity }));
    expect(parsed['@type']).toBe('DrivingSchool');
    expect(parsed.name).toBe('Gopal Krushna Driving Training School');
  });
});

describe('siteGraph', () => {
  it('contains the school and the website, linked by @id', () => {
    const g = siteGraph(site, { value: 4.8, count: 250 });
    expect(g['@context']).toBe('https://schema.org');
    expect(g['@graph'].map((n) => n['@type'])).toEqual(['DrivingSchool', 'WebSite']);
    expect(g['@graph'][1]).toMatchObject({ publisher: { '@id': SCHOOL_ID }, inLanguage: 'en-IN' });
  });
});

describe('breadcrumbJsonLd', () => {
  it('numbers the items, gives parents absolute URLs and leaves the current page without one', () => {
    const b = breadcrumbJsonLd([{ label: 'Home', href: '/' }, { label: 'Courses' }]);
    expect(b['@type']).toBe('BreadcrumbList');
    expect(b.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: expect.stringMatching(/^https?:\/\/[^/]+\/$/) },
      { '@type': 'ListItem', position: 2, name: 'Courses' },
    ]);
  });
});

describe('resolveSiteUrl', () => {
  it('prefers NEXT_PUBLIC_SITE_URL and strips trailing slashes', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://www.example.in/' })).toBe('https://www.example.in');
  });
  it('adds https:// when the protocol is missing', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'www.example.in' })).toBe('https://www.example.in');
  });
  it('falls back to the Vercel production URL, then the deployment URL, then localhost', () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'gkds.vercel.app', VERCEL_URL: 'gkds-abc.vercel.app' })).toBe('https://gkds.vercel.app');
    expect(resolveSiteUrl({ VERCEL_URL: 'gkds-abc.vercel.app' })).toBe('https://gkds-abc.vercel.app');
    expect(resolveSiteUrl({})).toBe('http://localhost:3000');
  });
  it('ignores blank values', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: '  ', VERCEL_URL: '' })).toBe('http://localhost:3000');
  });
});
