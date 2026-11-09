import { SafeImage as Image } from '@/components/ui/safe-image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Pill } from '@/components/ui/pill';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { mediaUrl } from '@/lib/media';
import type { Course, Home } from '@/lib/validators';

interface CoursesTeaserProps {
  intro: Home['coursesIntro'];
  /** Published courses, already sorted by `order`. At most two are shown. */
  courses: Course[];
}

/** Heading + up to two horizontal course cards linking to their anchors on /courses. */
export function CoursesTeaser({ intro, courses }: CoursesTeaserProps) {
  if (courses.length === 0) return null;
  return (
    <Reveal as="section" className="section-y pb-8 pt-10 md:pb-8 md:pt-10">
      <Container>
        <SectionHeading
          eyebrow={intro.eyebrow}
          lead={intro.lead}
          highlight={intro.highlight}
          subtitle={intro.subtitle}
          action={{ label: 'View All Courses', href: '/courses' }}
        />

        <ul className="mt-8 grid gap-5 lg:grid-cols-2">
          {courses.slice(0, 2).map((course) => (
            <li key={course.id}>
              <Card
                hover
                className="relative flex h-full items-center gap-4 p-4 sm:gap-6 sm:p-5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orange-500"
              >
                <div className="relative aspect-[4/3] w-[42%] shrink-0 overflow-hidden rounded-xl bg-green-50">
                  <Image
                    src={mediaUrl(course.image)}
                    alt={course.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 20vw, 40vw"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-green-900 md:text-[17px]">
                    <Link
                      href={`/courses#${course.slug}`}
                      className="outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']"
                    >
                      {course.title}
                    </Link>
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-snug text-muted">{course.description}</p>
                  <Pill className="mt-3">{course.vehicle}</Pill>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </Reveal>
  );
}
