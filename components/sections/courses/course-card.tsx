import { SafeImage as Image } from '@/components/ui/safe-image';
import { Phone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CheckList } from '@/components/ui/check-list';
import { Pill } from '@/components/ui/pill';
import { tFor } from '@/lib/i18n';
import { fmt, type Locale } from '@/lib/i18n/locales';
import { mediaUrl } from '@/lib/media';
import { cn, telHref } from '@/lib/utils';
import type { Course } from '@/lib/validators';

interface CourseCardProps {
  course: Course;
  /** First phone number, for the "Call to enrol" link. */
  phone: string;
  /** The only course on the page: photo beside the text on large screens instead of above it. */
  wide?: boolean;
  locale?: Locale;
  className?: string;
}

/**
 * One course: photo, title, description, vehicle pill, feature check-list and a call link.
 * `id` = slug so `/courses#car-driving` scrolls here (and the `:target` style highlights it).
 * Photo on top (so the whole car is visible); beside the text on tablets and for a single wide card.
 */
export function CourseCard({ course, phone, wide = false, locale = 'en', className }: CourseCardProps) {
  const t = tFor(locale);
  return (
    <Card
      as="article"
      id={course.slug}
      tone="green-soft"
      className={cn(
        // html already has scroll-padding-top (sticky header); a small scroll-mt adds just a little breathing room
        'target-highlight flex scroll-mt-4 flex-col gap-5 p-5 md:flex-row md:items-start md:gap-6 md:p-6',
        wide ? 'lg:flex-row' : 'lg:flex-col',
        className,
      )}
    >
      <div
        className={cn(
          'relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-xl bg-green-50 md:aspect-[4/3] md:w-[44%]',
          wide ? 'lg:aspect-[4/3] lg:w-[44%]' : 'lg:aspect-[2/1] lg:w-full',
        )}
      >
        <Image
          src={mediaUrl(course.image)}
          alt={course.imageAlt}
          fill
          sizes={wide ? '(min-width: 1024px) 500px, 100vw' : '(min-width: 1024px) 520px, (min-width: 768px) 300px, 100vw'}
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-2xl font-bold leading-tight text-green-900">{course.title}</h3>
        <p className="mt-2 text-base leading-relaxed text-ink">{course.description}</p>
        <Pill className="mt-4 text-[14px]">{fmt(t.courses.vehicle, { vehicle: course.vehicle })}</Pill>
        <CheckList className="mt-5" items={course.features} />
        <a
          href={telHref(phone)}
          className="focus-ring mt-4 inline-flex min-h-11 items-center gap-2 rounded-md text-[14px] font-semibold text-orange-700 hover:text-orange-600 hover:underline"
        >
          <Phone className="size-4" aria-hidden="true" />
          {t.actions.callToEnrol}
          <span className="sr-only">{fmt(t.courses.callToEnrolSr, { title: course.title })}</span>
        </a>
      </div>
    </Card>
  );
}
