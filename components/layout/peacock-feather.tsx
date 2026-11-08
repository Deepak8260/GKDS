import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Decorative peacock feather (real artwork, transparent background). Position it with `className`,
 * e.g. "absolute bottom-0 left-0". Only shown from `lg` up: on tablets the single-column text
 * would run into it.
 */
export function PeacockFeather({ className }: { className?: string }) {
  return (
    <Image
      src="/assets/decor/peacock-feather.webp"
      alt=""
      aria-hidden="true"
      width={480}
      height={424}
      sizes="260px"
      className={cn('pointer-events-none hidden h-44 w-auto select-none lg:block', className)}
    />
  );
}
