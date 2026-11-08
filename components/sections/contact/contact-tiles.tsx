import type { ReactNode } from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { addressLines } from '@/lib/address';
import { cn, telHref } from '@/lib/utils';
import type { Site } from '@/lib/validators';

interface TileProps {
  id: string;
  title: string;
  icon: ReactNode;
  /** Checkerboard tone: green / peach, exactly as designed. */
  tone: 'green' | 'peach';
  children: ReactNode;
}

function Tile({ id, title, icon, tone, children }: TileProps) {
  return (
    <section
      aria-labelledby={id}
      className={cn('flex items-start gap-4 rounded-2xl p-5', tone === 'green' ? 'bg-green-50' : 'bg-orange-50')}
    >
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h3 id={id} className="text-lg font-bold text-ink">
          {title}
        </h3>
        <div className="mt-1 text-[15px] leading-relaxed text-ink">{children}</div>
      </div>
    </section>
  );
}

const link =
  'focus-ring inline-flex min-h-11 items-center rounded font-medium text-ink hover:text-orange-700 hover:underline';

/** 2×2 grid: Phone · Email · Address · Working Hours (tiles with nothing to show are skipped). */
export function ContactTiles({ site }: { site: Site }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {site.phones.length > 0 ? (
        <Tile id="contact-phone" title="Phone" tone="green" icon={<Phone className="size-6" strokeWidth={2} />}>
          <ul>
            {site.phones.map((phone, i) => (
              <li key={`${phone}-${i}`}>
                <a href={telHref(phone)} aria-label={`Call ${phone}`} className={link}>
                  {phone}
                </a>
              </li>
            ))}
          </ul>
        </Tile>
      ) : null}

      {site.email ? (
        <Tile id="contact-email" title="Email" tone="peach" icon={<Mail className="size-6" strokeWidth={2} />}>
          <a
            href={`mailto:${site.email}`}
            aria-label={`Email ${site.email}`}
            className={cn(link, '[overflow-wrap:anywhere]')}
          >
            {/* allow a line break before the "@" instead of splitting a word in the middle */}
            <span>
              {site.email.split('@')[0]}
              {site.email.includes('@') ? (
                <>
                  <wbr />@{site.email.split('@').slice(1).join('@')}
                </>
              ) : null}
            </span>
          </a>
        </Tile>
      ) : null}

      <Tile id="contact-address" title="Address" tone="peach" icon={<MapPin className="size-6" strokeWidth={2} />}>
        <address className="not-italic">
          {addressLines(site.address).map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </address>
      </Tile>

      {site.hours.length > 0 ? (
        <Tile id="contact-hours" title="Working Hours" tone="green" icon={<Clock className="size-6" strokeWidth={2} />}>
          <ul>
            {site.hours.map((h, i) => (
              <li key={`${h.label}-${i}`}>
                {h.label}: {h.value}
              </li>
            ))}
          </ul>
        </Tile>
      ) : null}
    </div>
  );
}
