import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const tones = {
  orange: 'bg-orange-500 text-white',
  green: 'bg-green-700 text-white',
  neutral: 'bg-line text-ink',
} as const;

/** Compact count/status badge (admin sidebar counts, etc.). */
export function Badge({
  children,
  tone = 'orange',
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold leading-none',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
