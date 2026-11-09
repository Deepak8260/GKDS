import type { ReactNode } from 'react';
import { getPublishedCourses, getSite } from '@/lib/content';
import { tFor } from '@/lib/i18n';
import { LANG_TAG, type Locale } from '@/lib/i18n/locales';
import { Header } from './header';
import { Footer } from './footer';
import { FloatingActions } from './floating-actions';

/** Skip link + header + main + footer + floating actions. Used by the site layouts (both languages) and the 404 page. */
export async function SiteShell({ children, locale = 'en', className }: { children: ReactNode; locale?: Locale; className?: string }) {
  const [site, courses] = await Promise.all([getSite(locale), getPublishedCourses(locale)]);
  const t = tFor(locale);
  return (
    // `lang` marks the language of everything inside, for screen readers and search engines
    <div lang={LANG_TAG[locale]} className={`flex min-h-dvh flex-col ${className ?? ''}`.trim()}>
      <a
        href="#main"
        className="sr-only z-[200] rounded-full bg-orange-500 px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t.site.skip}
      </a>
      <Header site={site} courses={courses} locale={locale} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer site={site} locale={locale} />
      <FloatingActions
        phone={site.phones[0]}
        whatsapp={site.whatsapp}
        whatsappMessage={site.whatsappMessage}
        locale={locale}
      />
    </div>
  );
}
