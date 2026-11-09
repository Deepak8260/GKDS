import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './icon';

export interface StatBarItem {
  icon: string;
  /** Usually text; may be rich (e.g. "4.8" plus a smaller "/ 5"). */
  title: ReactNode;
  subtitle?: string;
}

interface StatBarProps {
  items: StatBarItem[];
  /** Pull the bar up so it straddles the section above (Home hero). */
  overlap?: boolean;
  /** Big numerals (Reviews summary): one column on phones, one row from `md`. */
  large?: boolean;
  /** No white card around the strip: it sits directly on a coloured band (Contact page). */
  flat?: boolean;
  /** Icon size in px (default 32, or 42 when `large`). */
  iconSize?: number;
  className?: string;
}

// Tailwind only generates classes it can read literally in the source, so these are written out in full.
const DIVIDER_FROM_MD =
  'md:relative md:before:absolute md:before:left-0 md:before:top-1/2 md:before:h-10 md:before:w-px md:before:-translate-y-1/2 md:before:bg-line md:before:content-[""]';
const DIVIDER_FROM_LG =
  'lg:relative lg:before:absolute lg:before:left-0 lg:before:top-1/2 lg:before:h-10 lg:before:w-px lg:before:-translate-y-1/2 lg:before:bg-line lg:before:content-[""]';

/** White rounded strip of icon + two-line items separated by thin dividers. */
export function StatBar({ items, overlap, large, flat, iconSize, className }: StatBarProps) {
  return (
    <div
      className={cn(
        'relative z-10',
        !flat && 'rounded-2xl border border-line bg-white shadow-card',
        overlap && '-mt-8 md:-mt-12',
        className,
      )}
    >
      <ul
        className={
          large
            ? 'grid grid-cols-1 md:flex md:items-center md:justify-between md:px-4'
            : // below lg: 2-column grid with dividers; lg and up: one row with vertical dividers
              'grid grid-cols-2 gap-y-0 lg:flex lg:items-center lg:justify-between lg:px-4'
        }
      >
        {items.map((item, i) => (
          <li
            key={i}
            className={cn(
              large
                ? [
                    'flex items-center gap-4 px-5 py-5 md:flex-1 md:justify-center md:px-4 md:py-6',
                    i > 0 && 'border-t border-line md:border-t-0',
                    i > 0 && DIVIDER_FROM_MD,
                  ]
                : [
                    'flex items-center gap-3 px-4 py-4 lg:flex-1 lg:justify-center lg:px-4 lg:py-5',
                    i % 2 === 1 && 'border-l border-line lg:border-l-0',
                    i >= 2 && 'border-t border-line lg:border-t-0',
                    i > 0 && DIVIDER_FROM_LG,
                  ],
            )}
          >
            <span className="shrink-0 text-orange-500">
              <Icon name={item.icon} size={iconSize ?? (large ? 42 : 32)} />
            </span>
            <span className="min-w-0 text-left leading-tight">
              <span
                className={cn(
                  'block font-bold text-ink',
                  large ? 'text-[23px] font-extrabold leading-none md:text-4xl' : 'text-[14px] lg:text-base',
                )}
              >
                {item.title}
              </span>
              {item.subtitle ? (
                <span
                  className={cn(
                    'block text-ink/80',
                    large ? 'mt-1.5 text-base font-medium' : 'text-[14px] font-semibold lg:text-base',
                  )}
                >
                  {item.subtitle}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
