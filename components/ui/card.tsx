import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '@/lib/utils';

const tones = {
  white: 'bg-white',
  cream: 'bg-cream',
  'green-soft': 'bg-gradient-to-br from-green-50 to-white',
  'orange-soft': 'bg-orange-50',
} as const;

type CardProps<T extends ElementType> = {
  as?: T;
  tone?: keyof typeof tones;
  /** Lift on hover. */
  hover?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

/** Rounded card with warm shadow and 1px line border. */
export function Card<T extends ElementType = 'div'>({
  as,
  tone = 'white',
  hover,
  className,
  ...rest
}: CardProps<T>) {
  const Tag: ElementType = as ?? 'div';
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-line shadow-card',
        tones[tone],
        hover && 'transition duration-200 hover:-translate-y-1 hover:shadow-card-lg',
        className,
      )}
      {...rest}
    />
  );
}
