import { describe, expect, it } from 'vitest';
import { buildMetadata, truncate } from '@/lib/seo';

describe('truncate', () => {
  it('returns short text unchanged and collapses whitespace', () => {
    expect(truncate('  Hello   world \n there ')).toBe('Hello world there');
  });

  it('cuts at a word boundary and adds an ellipsis within the limit', () => {
    const long = 'Established in 1993, Gopal Krushna Driving Training School has been a trusted name in Baleswar for quality driving training. For over 30 years we have helped learners.';
    const out = truncate(long, 100);
    expect(out.length).toBeLessThanOrEqual(100);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/\s…$/);
    expect(long.startsWith(out.slice(0, -1))).toBe(true);
  });

  it('does not leave dangling punctuation before the ellipsis', () => {
    expect(truncate('One, two, three, four, five, six, seven', 20)).not.toMatch(/[,;:.]…$/);
  });
});

describe('buildMetadata', () => {
  const meta = buildMetadata({ title: 'About Us', description: 'Desc', path: '/about', image: '/img.webp' });

  it('sets canonical, title and description', () => {
    expect(meta.title).toBe('About Us');
    expect(meta.description).toBe('Desc');
    expect(meta.alternates?.canonical).toBe('/about');
  });

  it('builds Open Graph and Twitter cards with the site name', () => {
    expect(meta.openGraph).toMatchObject({
      url: '/about',
      title: 'About Us | Gopal Krushna Driving Training School',
      locale: 'en_IN',
      images: [{ url: '/img.webp' }],
    });
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('can mark a page noindex', () => {
    expect(buildMetadata({ title: 'x', description: 'y', path: '/x', noindex: true }).robots).toEqual({
      index: false,
      follow: false,
    });
  });
});
