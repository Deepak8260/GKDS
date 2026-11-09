import type { Metadata } from 'next';

/** Collapse whitespace and cut to `max` characters on a word boundary, adding an ellipsis. */
export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  const base = space > max * 0.6 ? cut.slice(0, space) : cut;
  return `${base.replace(/[\s,;:.\-–]+$/, '')}…`;
}

interface BuildMetadataInput {
  /** Page title; the root layout's template adds " | Gopal Krushna Driving Training School". */
  title: string;
  description: string;
  /** Path starting with "/" (used for the canonical URL and og:url). */
  path: string;
  /** Social-share image URL (already resolved with mediaUrl). */
  image?: string;
  siteName?: string;
  noindex?: boolean;
}

/**
 * One place that builds page metadata (title, description, canonical, Open Graph, Twitter).
 * Note: a page's `openGraph` replaces the root one entirely, so everything is set here.
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  siteName = 'Gopal Krushna Driving Training School',
  noindex,
}: BuildMetadataInput): Metadata {
  const fullTitle = `${title} | ${siteName}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url: path,
      title: fullTitle,
      description,
      siteName,
      locale: 'en_IN',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
