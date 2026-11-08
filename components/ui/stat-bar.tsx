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
      {/* below lg: 2-column grid with dividers; lg and up: one row with vertical dividers */}
      <ul className="grid grid-cols-2 gap-y-0 lg:flex lg:items-center lg:justify-between lg:px-4">
        {items.map((item, i) => (
          <li
            key={`${item.title}-${i}`}
            className={cn(
              'flex items-center gap-3 px-4 py-4 lg:flex-1 lg:justify-center lg:px-4 lg:py-5',
              i % 2 === 1 && 'border-l border-line lg:border-l-0',
              i >= 2 && 'border-t border-line lg:border-t-0',
              i > 0 &&
                'lg:relative lg:before:absolute lg:before:left-0 lg:before:top-1/2 lg:before:h-10 lg:before:w-px lg:before:-translate-y-1/2 lg:before:bg-line lg:before:content-[""]',
            )}
          >
            <span className="shrink-0 text-orange-500">
              <Icon name={item.icon} size={32} />
            </span>
            <span className="min-w-0 text-left leading-tight">
              <span className="block text-[15px] font-bold text-ink lg:text-base">{item.title}</span>
              {item.subtitle ? (
                <span className="block text-[15px] font-semibold text-ink/80 lg:text-base">
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
