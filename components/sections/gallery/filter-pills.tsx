'use client';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export interface FilterPill {
  id: string;
  label: string;
  icon: string;
}

interface FilterPillsProps {
  pills: FilterPill[];
  active: string;
  onChange: (id: string) => void;
}

/**
 * Category filter: "All Photos" (solid green when active) + one white pill per category with an orange icon.
 * A horizontally scrollable row on small screens.
 */
export function FilterPills({ pills, active, onChange }: FilterPillsProps) {
  return (
    <div
      role="group"
      aria-label="Filter photos by category"
      className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 py-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:py-0"
    >
      {pills.map((pill) => {
        const isActive = pill.id === active;
        return (
          <button
            key={pill.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(pill.id)}
            className={cn(
              'focus-ring inline-flex h-11 shrink-0 snap-start items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-colors',
              isActive
                ? 'bg-green-800 text-white shadow-card'
                : 'border border-line bg-white text-green-900 shadow-card hover:border-orange-500',
            )}
          >
            <span className={isActive ? 'text-white' : 'text-orange-500'}>
              <Icon name={pill.icon} size={18} />
            </span>
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}
