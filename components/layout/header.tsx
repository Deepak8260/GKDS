import type { Site, Course } from '@/lib/content/types';
import { tFor } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';
import { LanguageSwitch } from './language-switch';
import { Logo } from './logo';
import { RegdBadge } from './regd-badge';
import { DesktopNav } from './desktop-nav';
import { MobileNav } from './mobile-nav';
import { ScrollShadow } from './scroll-shadow';

interface HeaderProps {
  site: Site;
  courses: Course[];
  locale?: Locale;
}

/** Sticky site header. Data comes from site settings + published courses. */
export function Header({ site, courses, locale = 'en' }: HeaderProps) {
  const t = tFor(locale);
  const navCourses = courses.map((c) => ({ title: c.title, slug: c.slug }));
  return (
    <header
      id="site-header"
      data-scrolled="false"
      className="group sticky top-0 z-50 px-3 pb-3 pt-3 sm:px-5 lg:px-8"
    >
      <ScrollShadow targetId="site-header" />
      {/* floating, rounded bar: never touches the left or right edge of the screen */}
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 rounded-full border border-line/70 bg-white/95 pl-4 pr-3 shadow-[0_6px_24px_-8px_rgba(11,61,30,0.18)] backdrop-blur transition-shadow group-data-[scrolled=true]:shadow-[0_10px_30px_-8px_rgba(11,61,30,0.28)] sm:pl-6 sm:pr-4 md:h-20 lg:pl-8 lg:pr-5">
        <Logo src={site.logo} name={site.shortName} eager locale={locale} />
        <div className="flex items-center gap-6">
          <DesktopNav courses={navCourses} t={t.nav} />
          <LanguageSwitch label={t.lang.other} ariaLabel={t.lang.switchLabel} className="hidden lg:inline-flex" />
          <RegdBadge regNo={site.regNo} className="hidden lg:flex" />
          {/* phones and tablets: the language button stays in the bar, next to the menu button */}
          <LanguageSwitch label={t.lang.other} ariaLabel={t.lang.switchLabel} className="-mr-3 lg:hidden" />
          <MobileNav
            courses={navCourses}
            phone={site.phones[0]}
            whatsapp={site.whatsapp}
            whatsappMessage={site.whatsappMessage}
            badge={<RegdBadge regNo={site.regNo} />}
            t={t.nav}
            callNow={t.actions.callNow}
            whatsappLabel={t.actions.whatsapp}
          />
        </div>
      </div>
    </header>
  );
}
