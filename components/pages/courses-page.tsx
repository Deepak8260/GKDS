import type { Metadata } from 'next';
import { Phone } from 'lucide-react';
import { PageHero } from '@/components/layout/page-hero';
import { AnchorFlash } from '@/components/sections/courses/anchor-flash';
import { CourseCard } from '@/components/sections/courses/course-card';
import { courseGridLayout } from '@/components/sections/courses/grid-layout';
import { Included } from '@/components/sections/courses/included';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { CTABanner } from '@/components/ui/cta-banner';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { getCourses, getPublishedCourses, getSite } from '@/lib/content';
import { tFor } from '@/lib/i18n';
import { fmt, localizePath, type Locale } from '@/lib/i18n/locales';
import { SITE_URL, absoluteUrl, jsonLdString } from '@/lib/json-ld';
import { mediaUrl } from '@/lib/media';
import { buildMetadata, truncate } from '@/lib/seo';
import { cn, telHref } from '@/lib/utils';

export async function coursesMetadata(locale: Locale): Promise<Metadata> {
  const [doc, site] = await Promise.all([getCourses(locale), getSite(locale)]);
  const t = tFor(locale).meta;
  return buildMetadata({
    title: fmt(t.coursesTitle, { city: site.address.city }),
    description: truncate(
      fmt(t.coursesDescription, { city: site.address.city, state: site.address.state, hero: doc.hero.subtitle, intro: doc.intro.subtitle }),
      155,
    ),
    path: '/courses',
    image: mediaUrl(doc.hero.image || site.ogImage),
    siteName: site.name,
    locale,
  });
}

export async function CoursesPageView({ locale }: { locale: Locale }) {
  const [doc, courses, site] = await Promise.all([getCourses(locale), getPublishedCourses(locale), getSite(locale)]);
  const t = tFor(locale);
  const phone = site.phones[0];
  const layout = courseGridLayout(courses.length);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: doc.hero.title,
    itemListElement: courses.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Course',
        name: c.title,
        description: c.description,
        url: absoluteUrl(`${localizePath('/courses', locale)}#${c.slug}`),
        provider: { '@type': 'DrivingSchool', '@id': `${SITE_URL}/#school`, name: site.name },
      },
    })),
  };

  return (
    <>
      {courses.length > 0 ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      ) : null}

      <AnchorFlash />

      <PageHero
        title={doc.hero.title}
        subtitle={doc.hero.subtitle}
        breadcrumb={[{ label: t.nav.home, href: '/' }, { label: t.nav.courses }]}
        image={doc.hero.image}
        imageAlt={doc.hero.imageAlt}
        imagePosition="center 70%"
        locale={locale}
      />

      <Reveal as="section" className="section-y pb-8 pt-10 md:pb-8 md:pt-10">
        <Container>
          <SectionHeading
            lead={doc.intro.lead}
            highlight={doc.intro.highlight}
            subtitle={doc.intro.subtitle}
            dash="before"
            size="lg"
          />

          {courses.length > 0 ? (
            <ul className={cn('mt-8', layout.grid)}>
              {courses.map((course, i) => (
                <li key={course.id} className={cn('min-w-0', i === courses.length - 1 && layout.last)}>
                  <CourseCard course={course} phone={phone} wide={courses.length === 1} locale={locale} className="h-full" />
                </li>
              ))}
            </ul>
          ) : (
            <Card tone="green-soft" className="mt-8 flex flex-col items-center gap-4 px-6 py-12 text-center">
              <p className="font-display text-2xl font-bold italic text-green-900">{t.courses.emptyTitle}</p>
              <p className="max-w-md text-ink/80">{t.courses.emptyText}</p>
              <Button href={telHref(phone)} icon={<Phone className="size-5" aria-hidden="true" />}>
                {t.actions.callNow}
              </Button>
            </Card>
          )}
        </Container>
      </Reveal>

      <Included title={doc.includedTitle} items={doc.included} />

      <Reveal as="section" className="pb-12 md:pb-16">
        <Container>
          <CTABanner
            lead={doc.cta.lead}
            highlight={doc.cta.highlight}
            text={doc.cta.text}
            action={
              <>
                <Button href={telHref(phone)} icon={<Phone className="size-5" aria-hidden="true" />}>
                  {t.actions.callNow}
                </Button>
                <Button href="/contact" variant="ghost" arrow>
                  {t.actions.visitContact}
                </Button>
              </>
            }
          />
        </Container>
      </Reveal>
    </>
  );
}
