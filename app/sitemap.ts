import type { MetadataRoute } from 'next';
import { localizePath } from '@/lib/i18n/locales';
import { absoluteUrl } from '@/lib/json-ld';

// Public pages only. Admin, API and the style guide are never listed.
export const SITEMAP_ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/courses', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/gallery', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/reviews', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/contact', priority: 0.8, changeFrequency: 'yearly' },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  // every page twice (English and Odia), each pointing at its twin so search engines show the right language
  return SITEMAP_ROUTES.flatMap((r) =>
    (['en', 'or'] as const).map((locale) => ({
      url: absoluteUrl(localizePath(r.path, locale)),
      lastModified,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: { languages: { 'en-IN': absoluteUrl(r.path), 'or-IN': absoluteUrl(localizePath(r.path, 'or')) } },
    })),
  );
}
