import { SafeImage as Image } from '@/components/ui/safe-image';
import { Phone } from 'lucide-react';
import { SteeringWheelIcon } from '@/components/icons/custom-icons';
import { Button } from '@/components/ui/button';
import { mediaUrl } from '@/lib/media';
import { telHref } from '@/lib/utils';
import type { Home } from '@/lib/validators';
import { HeroWaves } from './hero-waves';

interface HeroProps {
  hero: Home['hero'];
  /** First phone number (for the Call Now button). */
  phone: string;
}

/** Home hero: eyebrow, two-line H1, intro, two actions; photo fading in from the right. */
export function Hero({ hero, phone }: HeroProps) {
  return (
    <section aria-labelledby="home-hero-title" className="relative isolate overflow-hidden bg-cream">
      <div className="container-x relative z-10 flex flex-col justify-center pb-4 pt-8 lg:min-h-[430px] lg:py-10">
        <div className="lg:w-[46%]">
          <p className="flex items-center gap-3 text-[12.5px] font-bold uppercase tracking-[0.12em] text-ink">
            <span aria-hidden="true" className="h-4 w-[3px] rounded bg-orange-500" />
            {hero.eyebrow}
          </p>

          <h1
            id="home-hero-title"
            className="mt-5 font-display text-[28px] font-bold italic leading-[1.05] text-green-900 sm:text-5xl lg:text-[42px]"
          >
            <span className="block">{hero.titleLead}</span>{' '}
            <span className="block text-orange-500">{hero.titleHighlight}</span>
          </h1>

          <p className="mt-5 max-w-[440px] text-base text-ink md:text-[14.5px]">{hero.subtitle}</p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              href="/contact"
              size="lg"
              arrow
              icon={<SteeringWheelIcon size={22} />}
              className="w-full sm:w-auto"
            >
              {hero.primaryCta}
            </Button>
            <Button
              href={telHref(phone)}
              variant="secondary"
              tone="green"
              size="lg"
              icon={<Phone className="size-5" aria-hidden="true" />}
              className="w-full sm:w-auto"
            >
              {hero.secondaryCta}
            </Button>
          </div>
        </div>
      </div>

      {/* Photo: right 56% on desktop (fading in from the left); below the text on mobile (fading in from the top) */}
      <div
        className="relative mt-4 aspect-[4/3] w-full lg:absolute lg:inset-y-0 lg:right-0 lg:z-0 lg:mt-0 lg:aspect-auto lg:w-[56%]
          [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_22%)] [mask-image:linear-gradient(to_bottom,transparent,black_22%)]
          lg:[-webkit-mask-image:linear-gradient(to_right,transparent,black_25%)] lg:[mask-image:linear-gradient(to_right,transparent,black_25%)]"
      >
        <Image
          src={mediaUrl(hero.image)}
          alt={hero.imageAlt}
          fill
          priority
          fetchPriority="high"
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover object-center"
        />
        {/* soft fade into the page background under the photo (desktop) */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 hidden h-24 bg-gradient-to-t from-cream to-transparent lg:block" />
      </div>

      <HeroWaves />
    </section>
  );
}
