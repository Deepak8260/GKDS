import { Fragment } from 'react';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import type { Home } from '@/lib/validators';

/** Five-step learning journey: horizontal with arrows on desktop, vertical timeline on mobile. */
export function Journey({ journey }: { journey: Home['journey'] }) {
  const last = journey.steps.length - 1;
  return (
    <Reveal as="section" className="section-y pt-4 md:pt-8">
      <Container>
        <SectionHeading eyebrow={journey.eyebrow} lead={journey.lead} highlight={journey.highlight} />

        <ol
          className="relative mt-10 space-y-7
            before:absolute before:bottom-8 before:left-8 before:top-8 before:w-0.5 before:bg-orange-100 before:content-['']
            md:flex md:items-start md:space-y-0 md:before:hidden"
        >
          {journey.steps.map((step, i) => (
            <Fragment key={`${step.title}-${i}`}>
              <li className="relative flex items-start gap-4 md:flex-1 md:flex-col md:items-center md:gap-3 md:text-center">
                <span className="relative z-10 flex size-16 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                  <Icon name={step.icon} size={30} />
                </span>
                <span className="min-w-0 pt-1 md:pt-0">
                  <span className="block text-base font-bold text-ink">{step.title}</span>
                  {step.text ? (
                    <span className="mt-1 block max-w-[170px] text-sm leading-snug text-muted md:mx-auto">
                      {step.text}
                    </span>
                  ) : null}
                </span>
              </li>
              {i < last ? (
                <li aria-hidden="true" className="hidden px-1 pt-5 text-orange-500 md:block">
                  <ArrowRight className="size-6" strokeWidth={1.5} />
                </li>
              ) : null}
            </Fragment>
          ))}
        </ol>
      </Container>
    </Reveal>
  );
}
