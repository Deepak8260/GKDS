import { cn } from '@/lib/utils';
import { Icon } from './icon';

export interface StatBarItem {
  icon: string;
  title: string;
  subtitle?: string;
}

interface StatBarProps {
  items: StatBarItem[];
  /** Pull the bar up so it straddles the section above (Home hero). */
  overlap?: boolean;
  className?: string;
}

/** White rounded strip of icon + two-line items separated by thin dividers. */
export function StatBar({ items, overlap, className }: StatBarProps) {
  return (
    <div
      className={cn(
        'relative z-10 rounded-2xl border border-line bg-white shadow-card',
        overlap && '-mt-8 md:-mt-12',
        className,
      )}
    >
      <ul className="grid grid-cols-2 gap-y-0 md:flex md:items-center md:justify-between md:px-4">
        {items.map((item, i) => (
          <li
            key={`${item.title}-${i}`}
            className={cn(
              'flex items-center gap-3 px-4 py-4 md:flex-1 md:justify-center md:px-4 md:py-5',
              // mobile: 2-col grid with dividers; desktop: vertical dividers between items
              i % 2 === 1 && 'border-l border-line md:border-l-0',
              i >= 2 && 'border-t border-line md:border-t-0',
              i > 0 &&
                'md:relative md:before:absolute md:before:left-0 md:before:top-1/2 md:before:h-10 md:before:w-px md:before:-translate-y-1/2 md:before:bg-line md:before:content-[""]',
            )}
          >
            <span className="shrink-0 text-orange-500">
              <Icon name={item.icon} size={32} />
            </span>
            <span className="min-w-0 text-left leading-tight">
              <span className="block text-[15px] font-bold text-ink md:text-base">{item.title}</span>
              {item.subtitle ? (
                <span className="block text-[15px] font-semibold text-ink/80 md:text-base">
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
