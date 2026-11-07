import type { ReactNode } from 'react';
import { getPublishedCourses, getSite } from '@/lib/content';
import { Header } from './header';
import { Footer } from './footer';
import { FloatingActions } from './floating-actions';

/** Skip link + header + main + footer + floating actions. Used by the site layout and the 404 page. */
export async function SiteShell({ children }: { children: ReactNode }) {
  const [site, courses] = await Promise.all([getSite(), getPublishedCourses()]);
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-[200] rounded-full bg-orange-500 px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Header site={site} courses={courses} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer site={site} />
      <FloatingActions
        phone={site.phones[0]}
        whatsapp={site.whatsapp}
        whatsappMessage={site.whatsappMessage}
      />
    </div>
  );
}
