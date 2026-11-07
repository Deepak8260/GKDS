import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Small rounded label, e.g. "WagonR" or "Vehicle: Maruti 800". */
export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-orange-100 px-3.5 py-1.5 text-sm font-semibold text-orange-700',
        className,
      )}
    >
      {children}
    </span>
  );
}
