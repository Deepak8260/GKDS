import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '@/lib/utils';

type ContainerProps<T extends ElementType> = {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

/** Page container: max 1200px, responsive gutters. */
export function Container<T extends ElementType = 'div'>({
  as,
  className,
  ...rest
}: ContainerProps<T>) {
  const Tag: ElementType = as ?? 'div';
  return <Tag className={cn('container-x', className)} {...rest} />;
}
