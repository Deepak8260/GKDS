import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckListProps {
  items: ReactNode[];
  columns?: 1 | 2;
  /** Text size: `md` 16px, `lg` 17px. */
  size?: 'md' | 'lg';
  className?: string;
}

/** List with filled green check circles. */
export function CheckList({ items, columns = 1, size = 'md', className }: CheckListProps) {
  return (
    <ul className={cn('grid gap-3', columns === 2 && 'sm:grid-cols-2 sm:gap-x-8', className)}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-green-700 text-white"
          >
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          <span className={cn('text-ink', size === 'lg' ? 'text-[14.5px]' : 'text-base')}>{item}</span>
        </li>
      ))}
    </ul>
  );
}
