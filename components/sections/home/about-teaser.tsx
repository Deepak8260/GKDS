import { SafeImage as Image } from '@/components/ui/safe-image';
import { LocLink as Link } from '@/components/i18n/loc-link';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { tFor } from '@/lib/i18n';
import { fmt, type Locale } from '@/lib/i18n/locales';
import { mediaUrl } from '@/lib/media';
import type { Home } from '@/lib/validators';

/** Photo · story text · quick-stats card. */
export function AboutTeaser({ about, locale = 'en' }: { about: Home['aboutTeaser']; locale?: Locale }) {
  const t = tFor(locale).actions;
  return (
    <Reveal as="section" className="section-y">
      <Container className="grid items-center gap-8 md:grid-cols-2 lg:grid-cols-[1fr_1.5fr_1fr] lg:gap-10">
        <div className="relative aspect-[16/11] overflow-hidden rounded-2xl shadow-card">
          <Image
            src={mediaUrl(about.image)}
            alt={about.imageAlt}
            fill
            sizes="(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 100vw"
            className="object-cover"
          />
        </div>

        <div>
          <SectionHeading eyebrow={about.eyebrow} lead={about.title} size="sm" />
          <p className="mt-4 text-base leading-relaxed text-ink">{about.body}</p>
          <Link
            href="/about"
            className="focus-ring mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-md text-[14px] font-semibold text-orange-700 hover:text-orange-600"
          >
            {t.readMore}
            <span className="sr-only">{fmt(t.readMoreAbout, { title: about.title })}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <Card tone="orange-soft" className="p-2 shadow-none md:col-span-2 lg:col-span-1">
          <ul>
            {about.stats.map((s, i) => (
              <li
                key={`${s.title}-${i}`}
                className="flex items-center gap-4 border-line px-4 py-4 [&:not(:first-child)]:border-t"
              >
                <span className="shrink-0 text-orange-500">
                  <Icon name={s.icon} size={34} />
                </span>
                <span className="leading-tight">
                  <span className="block text-base font-bold text-ink">{s.title}</span>
                  <span className="block text-sm text-ink/75">{s.subtitle}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </Container>
    </Reveal>
  );
}
