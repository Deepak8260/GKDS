import { mediaUrl } from '@/lib/media';
import { SITE_URL } from '@/lib/site-url';
import type { Site } from '@/lib/validators';

export { SITE_URL };

/** Serialise JSON-LD safely for a <script type="application/ld+json"> tag (no `</script>` breakouts). */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** `@id` of the school entity: every page's structured data points here instead of repeating it. */
export const SCHOOL_ID = `${SITE_URL}/#school`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Phone numbers that are real (placeholders such as "+91 9XXXXXXXXX" are left out), digits and "+" only. */
export function realPhones(site: Pick<Site, 'phones'>): string[] {
  return site.phones.filter((p) => !/x/i.test(p)).map((p) => p.replace(/[^\d+]/g, ''));
}

/** One ContactPoint per real phone number (or one by email while the numbers are still placeholders). */
export function contactPoints(site: Pick<Site, 'phones' | 'email'>) {
  const phones = realPhones(site);
  return (phones.length ? phones : [undefined]).map((telephone) => ({
    '@type': 'ContactPoint',
    contactType: 'customer service',
    ...(telephone ? { telephone } : { email: site.email }),
    areaServed: 'IN-OR',
    availableLanguage: ['en', 'or', 'hi'],
  }));
}

export interface RatingSummary {
  value: number;
  count: number;
}

/**
 * schema.org DrivingSchool (a LocalBusiness) built from site settings, without `@context` (for use in an `@graph`).
 * Rendered ONCE for the whole site (see app/(site)/layout.tsx); pages refer to it by `@id`.
 */
export function drivingSchoolEntity(site: Site, rating?: RatingSummary) {
  const phones = realPhones(site);
  const sameAs = Object.values(site.social).filter((u): u is string => Boolean(u));

  return {
    '@type': 'DrivingSchool',
    '@id': SCHOOL_ID,
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
    contactPoint: contactPoints(site),
    ...(sameAs.length ? { sameAs } : {}),
    ...(rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rating.value,
            reviewCount: rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

/** schema.org WebSite entity (published by the school). */
export function websiteEntity(site: Pick<Site, 'name'>) {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: site.name,
    inLanguage: 'en-IN',
    publisher: { '@id': SCHOOL_ID },
  };
}

/** The site-wide graph: the school (with its rating) and the website. */
export function siteGraph(site: Site, rating?: RatingSummary) {
  return {
    '@context': 'https://schema.org',
    '@graph': [drivingSchoolEntity(site, rating), websiteEntity(site)],
  };
}

export interface BreadcrumbInput {
  label: string;
  href?: string;
}

/** BreadcrumbList for the visible breadcrumb. The current page (last item) has no URL, which Google allows. */
export function breadcrumbJsonLd(items: BreadcrumbInput[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}
