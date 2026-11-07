import { mediaUrl } from '@/lib/media';
import type { Site } from '@/lib/validators';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

/** Serialise JSON-LD safely for a <script type="application/ld+json"> tag (no `</script>` breakouts). */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** schema.org DrivingSchool (a LocalBusiness) built from site settings. Placeholder phone numbers (with "X") are omitted. */
export function drivingSchoolJsonLd(site: Site) {
  const phones = site.phones.filter((p) => !/x/i.test(p)).map((p) => p.replace(/[^\d+]/g, ''));
  const sameAs = Object.values(site.social).filter((u): u is string => Boolean(u));

  return {
    '@context': 'https://schema.org',
    '@type': 'DrivingSchool',
    '@id': `${SITE_URL}/#school`,
    name: site.name,
    url: SITE_URL,
    description: site.seo.description,
    logo: absoluteUrl(mediaUrl(site.logo)),
    image: absoluteUrl(mediaUrl(site.ogImage || site.logo)),
    ...(phones.length ? { telephone: phones[0] } : {}),
    email: site.email,
    foundingDate: String(site.stats.sinceYear),
    address: {
      '@type': 'PostalAddress',
      streetAddress: [site.address.line1, site.address.line2].filter(Boolean).join(', '),
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.pin,
      addressCountry: 'IN',
    },
    ...(site.map.lat !== undefined && site.map.lng !== undefined
      ? { geo: { '@type': 'GeoCoordinates', latitude: site.map.lat, longitude: site.map.lng } }
      : {}),
    openingHoursSpecification: site.openDays.length
      ? [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: site.openDays.map((d) => DAY_NAMES[d]),
            opens: site.openFrom,
            closes: site.openTo,
          },
        ]
      : undefined,
    areaServed: { '@type': 'City', name: site.address.city },
    ...(sameAs.length ? { sameAs } : {}),
  };
}
