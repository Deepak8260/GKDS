import { cn } from '@/lib/utils';
import { Icon } from './icon';

interface IconTileProps {
  icon: string;
  label: string;
  /** `vertical`: icon above centered label. `horizontal`: icon left of label. */
  variant?: 'vertical' | 'horizontal';
  className?: string;
}

/** White rounded tile with an orange outline icon and a two-line label. */
export function IconTile({ icon, label, variant = 'vertical', className }: IconTileProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-white shadow-card',
        variant === 'vertical'
          ? 'flex min-h-[120px] flex-col items-center justify-center gap-3 px-3 py-5 text-center'
          : 'flex items-center gap-4 px-4 py-4',
        className,
      )}
    >
      <span className="shrink-0 text-orange-500">
        <Icon name={icon} size={variant === 'vertical' ? 36 : 34} />
      </span>
      <span className="text-[14px] font-semibold leading-snug text-green-900 text-balance">{label}</span>
    </div>
  );
}
