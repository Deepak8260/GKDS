import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

type HeadingTag = 'h1' | 'h2' | 'h3';

interface SectionHeadingProps {
  eyebrow?: string;
  /** Dark-green italic words. */
  lead: string;
  /** Orange italic words appended after `lead`. */
  highlight?: string;
  subtitle?: ReactNode;
  /** Right-aligned action (secondary pill with arrow); stacks under the heading on mobile. */
  action?: { label: string; href: string };
  as?: HeadingTag;
  size?: 'sm' | 'md' | 'lg';
  /** `before`: dash inline before the heading. `above`: dash on its own line above the heading. */
  dash?: 'before' | 'above';
  align?: 'left' | 'center';
  className?: string;
}

const sizeClasses = {
  sm: 'text-2xl md:text-[28px] leading-tight',
  md: 'text-[28px] md:text-[40px] leading-[1.1]',
  lg: 'text-[32px] md:text-5xl leading-[1.08]',
} as const;

const Dash = ({ className }: { className?: string }) => (
  <span aria-hidden="true" className={cn('block h-[3px] w-10 shrink-0 rounded bg-orange-500', className)} />
);

/**
 * The shared heading pattern: orange dash + dark-green italic serif words
 * with an orange highlighted tail. Optional eyebrow, subtitle and action.
 */
export function SectionHeading({
  eyebrow,
  lead,
  highlight,
  subtitle,
  action,
  as: Tag = 'h2',
  size = 'md',
  dash = 'above',
  align = 'left',
  className,
}: SectionHeadingProps) {
  const heading = (
    <Tag
      className={cn(
        'font-display font-bold italic text-green-900 text-balance',
        sizeClasses[size],
      )}
    >
      {lead}
      {highlight ? (
        <>
          {' '}
          <span className="text-orange-500">{highlight}</span>
        </>
      ) : null}
    </Tag>
  );

  const body = (
    <div className={cn('min-w-0', align === 'center' && 'text-center')}>
      {eyebrow ? (
        <div className={cn('mb-3 flex items-center gap-3', align === 'center' && 'justify-center')}>
          <Dash />
          <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-ink">{eyebrow}</p>
        </div>
      ) : dash === 'above' ? (
        <Dash className={cn('mb-3', align === 'center' && 'mx-auto')} />
      ) : null}

      {!eyebrow && dash === 'before' ? (
        <div className="flex items-start gap-3">
          <Dash className="mt-[0.9em] w-10 md:w-12" />
          {heading}
        </div>
      ) : (
        heading
      )}

      {subtitle ? (
        <p
          className={cn(
            'mt-3 max-w-xl text-base text-ink/80 md:text-[17px]',
            align === 'center' && 'mx-auto',
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );

  if (!action) return <div className={className}>{body}</div>;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8',
        className,
      )}
    >
      {body}
      <Button href={action.href} variant="secondary" size="sm" arrow className="self-start md:self-auto">
        {action.label}
      </Button>
    </div>
  );
}
