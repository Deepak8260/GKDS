import type { ReactNode } from 'react';
import { LanguagePrompt } from '@/components/i18n/language-prompt';
import { LocaleProvider } from '@/components/i18n/locale-context';
import { JsonLd } from '@/components/seo/json-ld';
import { getReviewStats, getSite } from '@/lib/content';
import type { Locale } from '@/lib/i18n/locales';
import { siteGraph } from '@/lib/json-ld';
import { SiteShell } from './site-shell';

/** Everything both languages share: language context, structured data, header + footer, the first-visit language question. */
export async function LocaleLayout({ locale, className, children }: { locale: Locale; className?: string; children: ReactNode }) {
  const [site, stats] = await Promise.all([getSite(locale), getReviewStats()]);
  // ONE school entity for the whole site; pages refer to it by @id.
  const graph = siteGraph(site, stats.rating !== null ? { value: stats.rating, count: stats.count } : undefined);
  return (
    <LocaleProvider locale={locale}>
      <JsonLd data={graph} />
      <SiteShell locale={locale} className={className}>
        {children}
      </SiteShell>
      <LanguagePrompt />
    </LocaleProvider>
  );
}
