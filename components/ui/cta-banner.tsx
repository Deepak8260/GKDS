import type { ReactNode } from 'react';
import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CTABannerProps {
  lead: string;
  highlight?: string;
  text?: string;
  /** Right-aligned actions (usually one primary Button). */
  action?: ReactNode;
  /** Left icon; defaults to a green car. */
  icon?: ReactNode;
  /** Thin vertical divider between the icon and the text (large screens). */
  iconDivider?: boolean;
  className?: string;
}

/** Faint road illustration, used as the banner's right-edge decoration. */
function RoadArt() {
  return (
    <svg
      viewBox="0 0 320 160"
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-auto text-green-700/20 lg:block"
      preserveAspectRatio="xMaxYMid slice"
    >
      <path d="M130 160 C170 110 210 70 300 20 L320 20 L320 160 Z" fill="currentColor" opacity="0.5" />
      <path d="M205 160 C235 120 262 92 320 58" fill="none" stroke="white" strokeWidth="5" strokeDasharray="16 14" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

/** Light-green call-to-action banner with title, text and an action. */
export function CTABanner({ lead, highlight, text, action, icon, iconDivider, className }: CTABannerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-green-100 bg-green-50 px-6 py-7 md:px-10 md:py-8',
        className,
      )}
    >
      <RoadArt />
      {/* stacked and centred until lg: side-by-side needs room for the title, text AND the actions */}
      <div className="relative flex flex-col items-center gap-5 text-center lg:flex-row lg:gap-6 lg:text-left">
        <span className="flex size-16 shrink-0 items-center justify-center text-green-700 lg:size-[72px]">
          {icon ?? <Car className="size-14" strokeWidth={1.5} aria-hidden="true" />}
        </span>
        {iconDivider ? <span aria-hidden="true" className="hidden h-16 w-px shrink-0 bg-orange-500/40 lg:block" /> : null}
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-bold italic leading-tight text-green-900 md:text-[23px]">
            {lead}
            {highlight ? (
              <>
                {' '}
                <span className="text-orange-500">{highlight}</span>
              </>
            ) : null}
          </h2>
          {text ? <p className="mt-2 text-base text-ink/80">{text}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 lg:pr-24">{action}</div> : null}
      </div>
    </div>
  );
}
