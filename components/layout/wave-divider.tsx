import { useId } from 'react';
import { cn } from '@/lib/utils';

interface WaveDividerProps {
  /** Flip vertically (wave rising from the top, used above the footer). */
  flip?: boolean;
  className?: string;
}

/**
 * Cream wave with an orange swoosh and a thin green wave on the left.
 * Place absolutely at the bottom of a green block (or flipped above the footer).
 */
export function WaveDivider({ flip, className }: WaveDividerProps) {
  const gid = useId();
  return (
    <svg
      viewBox="0 0 1440 96"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn('block h-12 w-full md:h-20', flip && '-scale-y-100', className)}
    >
      <defs>
        <linearGradient id={`${gid}-o`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="rgb(var(--color-orange-500))" stopOpacity="0" />
          <stop offset="0.18" stopColor="rgb(var(--color-orange-500))" />
          <stop offset="1" stopColor="rgb(var(--color-orange-500))" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* thin green wave (left) */}
      <path
        d="M0 56 C200 22 380 30 560 56 C760 86 980 80 1180 56 C1300 42 1380 36 1440 40"
        fill="none"
        stroke="rgb(var(--color-green-700))"
        strokeOpacity="0.55"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* cream wave */}
      <path
        d="M0 62 C220 18 470 30 700 62 C940 96 1190 78 1440 30 L1440 96 L0 96 Z"
        fill="rgb(var(--color-cream))"
      />
      {/* orange swoosh riding the crest */}
      <path
        d="M0 58 C220 14 470 26 700 58 C940 92 1190 74 1440 26"
        fill="none"
        stroke={`url(#${gid}-o)`}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}
