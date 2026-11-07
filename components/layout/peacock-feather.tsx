import { cn } from '@/lib/utils';

/**
 * Decorative peacock feather (placeholder illustration). Position it with `className`,
 * e.g. "absolute bottom-0 left-0". Hidden on small screens.
 */
export function PeacockFeather({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 240"
      aria-hidden="true"
      focusable="false"
      className={cn('pointer-events-none hidden h-48 w-auto select-none md:block', className)}
    >
      {/* stem */}
      <path d="M12 238 C30 190 50 130 60 74" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
      {/* barbs */}
      {Array.from({ length: 14 }).map((_, i) => {
        const t = i / 13;
        const x = 12 + (60 - 12) * t;
        const y = 238 - (238 - 74) * t;
        const len = 28 - t * 6;
        return (
          <g key={i} stroke="#2E8B57" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
            <line x1={x} y1={y} x2={x - len} y2={y - 10 - t * 6} />
            <line x1={x} y1={y} x2={x + len * 0.9} y2={y - 12 - t * 6} />
          </g>
        );
      })}
      {/* eye */}
      <ellipse cx="62" cy="52" rx="26" ry="38" fill="#2E8B57" transform="rotate(8 62 52)" />
      <ellipse cx="62" cy="52" rx="19" ry="29" fill="#C9A227" transform="rotate(8 62 52)" />
      <ellipse cx="62" cy="52" rx="14" ry="22" fill="#0E7C86" transform="rotate(8 62 52)" />
      <ellipse cx="62" cy="54" rx="7" ry="12" fill="#10325C" transform="rotate(8 62 52)" />
    </svg>
  );
}
