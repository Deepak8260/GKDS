import type { Metadata } from 'next';
import { Phone } from 'lucide-react';
import { PageHero } from '@/components/layout/page-hero';
import { AnchorFlash } from '@/components/sections/courses/anchor-flash';
import { CourseCard } from '@/components/sections/courses/course-card';
import { courseGridLayout } from '@/components/sections/courses/grid-layout';
import { Highlights } from '@/components/sections/courses/highlights';
import { Included } from '@/components/sections/courses/included';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { CTABanner } from '@/components/ui/cta-banner';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { getCourses, getPublishedCourses, getSite } from '@/lib/content';
import { SITE_URL, absoluteUrl, jsonLdString } from '@/lib/json-ld';
import { mediaUrl } from '@/lib/media';
import { buildMetadata, truncate } from '@/lib/seo';
import { cn, telHref } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const [doc, site] = await Promise.all([getCourses(), getSite()]);
  return buildMetadata({
    title: `Driving Courses in ${site.address.city}`,
    description: truncate(
      `Car and small-car driving courses in ${site.address.city}, ${site.address.state}. ${doc.hero.subtitle} ${doc.intro.subtitle}`,
      155,
    ),
    path: '/courses',
    image: mediaUrl(doc.hero.image || site.ogImage),
    siteName: site.name,
  });
}

export default async function CoursesPage() {
  const [doc, courses, site] = await Promise.all([getCourses(), getPublishedCourses(), getSite()]);
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
        url: absoluteUrl(`/courses#${c.slug}`),
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
        breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Courses' }]}
        image={doc.hero.image}
        imageAlt={doc.hero.imageAlt}
        imagePosition="center 70%"
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
                  <CourseCard course={course} phone={phone} wide={courses.length === 1} className="h-full" />
                </li>
              ))}
            </ul>
          ) : (
            <Card tone="green-soft" className="mt-8 flex flex-col items-center gap-4 px-6 py-12 text-center">
              <p className="font-display text-2xl font-bold italic text-green-900">
                Courses will be updated soon
              </p>
              <p className="max-w-md text-ink/80">
                Call us for course details, fees and timings — we are happy to help.
              </p>
              <Button href={telHref(phone)} icon={<Phone className="size-5" aria-hidden="true" />}>
                Call Now
              </Button>
            </Card>
          )}
        </Container>
      </Reveal>

      <Included title={doc.includedTitle} items={doc.included} />
      <Highlights highlights={doc.highlights} />

      <Reveal as="section" className="pb-12 md:pb-16">
        <Container>
          <CTABanner
            lead={doc.cta.lead}
            highlight={doc.cta.highlight}
            text={doc.cta.text}
            action={
              <>
                <Button href={telHref(phone)} icon={<Phone className="size-5" aria-hidden="true" />}>
                  Call Now
                </Button>
                <Button href="/contact" variant="ghost" arrow>
                  Visit Contact Page
                </Button>
              </>
            }
          />
        </Container>
      </Reveal>
    </>
  );
}
