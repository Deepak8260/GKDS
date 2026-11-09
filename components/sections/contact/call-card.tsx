'use client';

import { useSyncExternalStore } from 'react';
import { Copy, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { getOpenStatus, type Schedule } from '@/lib/open-hours';
import { cn, telHref } from '@/lib/utils';

/* ---- a minute-resolution clock ----
 * The server (and the first client render) get `null`, so the statically generated HTML never contains a
 * time-dependent value and there is nothing to mismatch; after hydration the real minute is read and the
 * badge refreshes every minute. */
const subscribeToMinute = (notify: () => void) => {
  const id = window.setInterval(notify, 15_000);
  return () => window.clearInterval(id);
};
const currentMinute = (): number | null => Math.floor(Date.now() / 60_000);
const serverMinute = (): number | null => null;

function OpenBadge({ schedule }: { schedule: Schedule }) {
  const minute = useSyncExternalStore(subscribeToMinute, currentMinute, serverMinute);
  const status = minute === null ? null : getOpenStatus(new Date(minute * 60_000), schedule);

  return (
    <p
      className={cn(
        'inline-flex min-h-8 items-center gap-2 rounded-full px-3.5 py-1 text-sm font-semibold',
        status === null && 'bg-line/50 text-ink/70',
        status?.open === true && 'bg-green-100 text-green-800',
        status?.open === false && 'bg-line/60 text-ink',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-2.5 shrink-0 rounded-full',
          status === null && 'bg-ink/30',
          status?.open === true && 'bg-green-600',
          status?.open === false && 'bg-red-600',
        )}
      />
      {status === null ? 'Check our working hours' : [status.label, status.detail].filter(Boolean).join(' · ')}
    </p>
  );
}

/** Copy text to the clipboard; falls back to the old method; returns false (silently) if neither works. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function CopyButton({ number }: { number: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      aria-label={`Copy ${number}`}
      onClick={async () => {
        if (await copyText(number)) toast.success('Number copied');
      }}
      className="focus-ring hidden h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-green-800 hover:bg-green-100 md:inline-flex"
    >
      <Copy className="size-4" aria-hidden="true" />
      Copy
    </button>
  );
}

interface CallCardProps {
  phones: string[];
  text: string;
  schedule: Schedule;
}

/**
 * "Call Us Directly": a live Open/Closed badge (India time), one big tap-to-call button per number,
 * and a Copy button on larger screens. This replaces the enquiry form in the design.
 */
export function CallCard({ phones, text, schedule }: CallCardProps) {
  return (
    <ToastProvider>
      <Card as="section" aria-labelledby="call-card-title" className="bg-gradient-to-b from-orange-50 to-white p-7 md:p-8">
        <div id="call-card-title">
          <SectionHeading as="h2" lead="Call Us" highlight="Directly" size="sm" />
        </div>
        <p className="mt-3 text-base leading-relaxed text-ink/80">{text}</p>

        <div className="mt-4">
          <OpenBadge schedule={schedule} />
        </div>

        <ul className="mt-6 space-y-3">
          {phones.map((phone, i) => (
            <li key={`${phone}-${i}`} className="flex items-center gap-2">
              <Button
                href={telHref(phone)}
                size="lg"
                draggable={false}
                icon={<Phone className="size-6 shrink-0" aria-hidden="true" />}
                className="min-w-0 flex-1 select-text justify-start px-5 text-lg font-bold md:px-6 md:text-xl"
              >
                {/* on phones the "Tap to call" hint sits under the number so the button never outgrows the card */}
                <span className="min-w-0 flex-1 text-left leading-tight">
                  {/* the accessible name is built from the visible words ("Call +91 … Tap to call") */}
                  <span className="block">
                    <span className="sr-only">Call </span>
                    {phone}
                  </span>
                  <span className="block text-[11px] font-semibold opacity-90 md:hidden">Tap to call</span>
                </span>
              </Button>
              <CopyButton number={phone} />
            </li>
          ))}
        </ul>
      </Card>
    </ToastProvider>
  );
}
