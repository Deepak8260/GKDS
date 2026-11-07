import { cn } from '@/lib/utils';

/** Loading placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-line/70', className)} />;
}
