import Image from 'next/image';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

const COLORS = ['bg-green-700', 'bg-orange-600', 'bg-green-800', 'bg-orange-700'] as const;

function hash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

interface AvatarProps {
  name: string;
  src?: string;
  /** Pixel size (width = height). */
  size?: number;
  className?: string;
}

/** Circular avatar; falls back to coloured initials (deterministic per name) when there is no image. */
export function Avatar({ name, src, size = 56, className }: AvatarProps) {
  const style = { width: size, height: size };
  if (src) {
    return (
      <span
        className={cn('relative inline-block shrink-0 overflow-hidden rounded-full bg-green-50', className)}
        style={style}
      >
        <Image src={mediaUrl(src)} alt="" fill sizes={`${size}px`} className="object-cover" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        COLORS[hash(name) % COLORS.length],
        className,
      )}
      style={{ ...style, fontSize: Math.round(size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}
