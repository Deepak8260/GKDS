import type { Site, Course } from '@/lib/content/types';
import { Logo } from './logo';
import { RegdBadge } from './regd-badge';
import { DesktopNav } from './desktop-nav';
import { MobileNav } from './mobile-nav';
import { ScrollShadow } from './scroll-shadow';

interface HeaderProps {
  site: Site;
  courses: Course[];
}

/** Sticky site header. Data comes from site settings + published courses. */
export function Header({ site, courses }: HeaderProps) {
  const navCourses = courses.map((c) => ({ title: c.title, slug: c.slug }));
  return (
    <header
      id="site-header"
      data-scrolled="false"
      className="sticky top-0 z-50 border-b border-line bg-white transition-shadow data-[scrolled=true]:shadow-card"
    >
      <ScrollShadow targetId="site-header" />
      <div className="container-x flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <Logo src={site.logo} name={site.shortName} />
        <div className="flex items-center gap-6">
          <DesktopNav courses={navCourses} />
          <RegdBadge regNo={site.regNo} className="hidden lg:flex" />
          <MobileNav
            courses={navCourses}
            phone={site.phones[0]}
            whatsapp={site.whatsapp}
            whatsappMessage={site.whatsappMessage}
            badge={<RegdBadge regNo={site.regNo} />}
          />
        </div>
      </div>
    </header>
  );
}
