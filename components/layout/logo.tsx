import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** Image path from site.logo (defaults to the placeholder emblem). */
  src?: string;
  /** Short brand name, e.g. "Gopal Krushna". */
  name?: string;
  /** `light`: on white (header). `dark`: on green (footer). */
  variant?: 'light' | 'dark';
  className?: string;
}

/** Emblem + vertical divider + two-line brand text. Links to the home page. */
export function Logo({ src = '/assets/brand/logo.svg', name = 'Gopal Krushna', variant = 'light', className }: LogoProps) {
  const dark = variant === 'dark';
  return (
    <Link
      href="/"
      aria-label={`${name} Driving Training School – Home`}
      className={cn('focus-ring flex items-center gap-3 rounded-lg', className)}
    >
      <Image
        src={src}
        alt=""
        width={128}
        height={128}
        priority
        // The emblem PNG has transparent margins, so the box is oversized and scaled to make the artwork prominent.
        className="size-12 shrink-0 scale-125 object-contain md:size-16"
      />
      <span aria-hidden="true" className={cn('h-10 w-px shrink-0 md:h-12', dark ? 'bg-white/30' : 'bg-line')} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display text-[22px] font-bold italic md:text-[28px]',
            dark ? 'text-white' : 'text-green-900',
          )}
        >
          {name}
        </span>
        <span
          className={cn(
            'mt-1 font-display text-xs font-semibold italic md:text-[15px]',
            dark ? 'text-orange-100' : 'text-orange-500',
          )}
        >
          Driving Training School
        </span>
      </span>
    </Link>
  );
}
