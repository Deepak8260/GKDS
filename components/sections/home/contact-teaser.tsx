import { Clock, MapPin, Phone } from 'lucide-react';
import { PeacockFeather } from '@/components/layout/peacock-feather';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { telHref } from '@/lib/utils';
import type { Home, Site } from '@/lib/validators';

interface ContactTeaserProps {
  contact: Home['contactTeaser'];
  site: Site;
}

const rowIcon = 'mt-0.5 size-7 shrink-0 text-orange-500';

/** Contact details + lazy Google map, finished with the green wave that leads into the footer. */
export function ContactTeaser({ contact, site }: ContactTeaserProps) {
  const { address } = site;
  return (
    <section className="relative">
      {/* sits on top of the footer wave (the wave strip below is h-12 / md:h-20) */}
      <PeacockFeather className="absolute -left-3 bottom-12 z-0 h-32 md:bottom-20 xl:h-40" />

      <Reveal className="section-y relative z-10">
        <Container className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr_1.3fr] lg:gap-10">
          <div className="lg:pl-12">
            <SectionHeading eyebrow={contact.eyebrow} lead={contact.title} subtitle={contact.body} />
          </div>

          <ul className="space-y-5">
            <li className="flex gap-4">
              <Phone className={rowIcon} strokeWidth={1.75} aria-hidden="true" />
              <div>
                {site.phones.map((p, i) => (
                  <a
                    key={`${p}-${i}`}
                    href={telHref(p)}
                    className="focus-ring flex min-h-11 items-center rounded text-base font-semibold text-ink hover:text-orange-600"
                  >
                    {p}
                  </a>
                ))}
              </div>
            </li>
            <li className="flex gap-4">
              <MapPin className={rowIcon} strokeWidth={1.75} aria-hidden="true" />
              <address className="text-base font-semibold not-italic text-ink">
                {address.city}, {address.state}
                {address.landmark ? <span className="block font-normal">({address.landmark})</span> : null}
              </address>
            </li>
            <li className="flex gap-4">
              <Clock className={rowIcon} strokeWidth={1.75} aria-hidden="true" />
              <div className="text-base font-semibold text-ink">
                {site.hours.map((h, i) => (
                  <p key={`${h.label}-${i}`}>
                    {h.label}: {h.value}
                  </p>
                ))}
              </div>
            </li>
          </ul>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-green-50 shadow-card focus-within:ring-2 focus-within:ring-orange-500 sm:aspect-[16/10]">
            <iframe
              src={site.map.embedUrl}
              title={`Map showing ${site.name}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 size-full border-0"
            />
            <a
              href={site.map.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring absolute bottom-3 left-3 inline-flex min-h-11 items-center rounded-lg bg-white px-3 text-sm font-semibold text-green-800 shadow-card hover:text-orange-600"
            >
              View larger map
            </a>
          </div>
        </Container>
      </Reveal>

    </section>
  );
}
