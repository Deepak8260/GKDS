import { cn } from '@/lib/utils';

const STAR_PATH =
  'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z';

interface StarsProps {
  /** 0–5, halves supported. */
  value: number;
  size?: number;
  className?: string;
  /** Accessible text in the page language, e.g. "4.5 out of 5 stars" (English by default). */
  label?: string;
}

/** Orange star rating with half-star support and an accessible label. */
export function Stars({ value, size = 18, className, label: labelOverride }: StarsProps) {
  const v = Math.max(0, Math.min(5, value));
  const label = labelOverride ?? `${Number.isInteger(v) ? v : v.toFixed(1)} out of 5 stars`;
  return (
    <span
      role="img"
      aria-label={label}
      className={cn('inline-flex items-center gap-0.5', className)}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, v - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }} aria-hidden="true">
            <svg viewBox="0 0 24 24" width={size} height={size} className="absolute inset-0 text-orange-100" fill="currentColor">
              <path d={STAR_PATH} />
            </svg>
            {fill > 0 ? (
              <svg
                viewBox="0 0 24 24"
                width={size}
                height={size}
                className="absolute inset-0 text-orange-500"
                fill="currentColor"
                style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}
              >
                <path d={STAR_PATH} />
              </svg>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
