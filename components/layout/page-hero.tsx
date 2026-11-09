import { SafeImage as Image } from '@/components/ui/safe-image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbJsonLd } from '@/lib/json-ld';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/container';
import { WaveDivider } from './wave-divider';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeroProps {
  title: string;
  subtitle: string;
  breadcrumb: BreadcrumbItem[];
  image: string;
  imageAlt: string;
  /** CSS object-position for the photo (e.g. "center 30%"). */
  imagePosition?: string;
  className?: string;
}

/**
 * Inner-page hero: dark-green gradient, breadcrumb, serif title, orange-barred
 * subtitle, a photo fading in from the right and a wavy orange-swoosh bottom edge.
 */
export function PageHero({
  title,
  subtitle,
  breadcrumb,
  image,
  imageAlt,
  imagePosition = 'center',
  className,
}: PageHeroProps) {
  return (
    <section className={cn('relative isolate overflow-hidden bg-green-900 text-white', className)}>
      {/* photo (right ~62% on desktop, full-bleed and dimmed on mobile) */}
      <div
        className="absolute inset-y-0 right-0 -z-10 w-full opacity-40 md:opacity-100 lg:w-[62%]"
        style={{
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 38%)',
          maskImage: 'linear-gradient(to right, transparent 0%, #000 38%)',
        }}
      >
        <Image
          src={mediaUrl(image)}
          alt={imageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 62vw, 100vw"
          className="object-cover"
          style={{ objectPosition: imagePosition }}
        />
      </div>
      {/* readability overlay + brand gradient */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-hero-green" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-green-900/55 md:hidden" />

      <Container className="relative flex flex-col justify-center pb-10 pt-6 md:pb-12 md:pt-7">
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-white/80">
          <ol className="flex flex-wrap items-center gap-1.5">
            {breadcrumb.map((item, i) => {
              const last = i === breadcrumb.length - 1;
              return (
                <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
                  {item.href && !last ? (
                    // py-3 / -my-3 gives a 44px-tall touch target without changing the layout
                    <Link
                      href={item.href}
                      className="focus-ring -my-3 inline-flex min-w-11 items-center rounded py-3 hover:text-white hover:underline"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? 'page' : undefined} className={last ? 'text-white' : undefined}>
                      {item.label}
                    </span>
                  )}
                  {!last ? <ChevronRight className="size-3.5" aria-hidden="true" /> : null}
                </li>
              );
            })}
          </ol>
        </nav>

        <h1 className="font-display text-3xl font-bold leading-[1.05] md:text-[36px]">{title}</h1>
        <p className="mt-3 max-w-xl border-l-[3px] border-orange-500 pl-4 text-base text-white md:text-[15.5px]">
          {subtitle}
        </p>
      </Container>

      <WaveDivider className="absolute inset-x-0 bottom-[-1px] h-8 md:h-12" />
      <JsonLd data={breadcrumbJsonLd(breadcrumb)} />
    </section>
  );
}
