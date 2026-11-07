import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { cn, isExternalHref } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Border/text colour for the secondary variant. */
  tone?: 'orange' | 'green';
  /** Left icon. */
  icon?: ReactNode;
  /** Right icon (overrides `arrow`). */
  iconRight?: ReactNode;
  /** Show the trailing arrow. */
  arrow?: boolean;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
}

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & { href?: undefined };
type ButtonAsLink = BaseProps & {
  href: string;
  target?: string;
  rel?: string;
  'aria-label'?: string;
  onClick?: () => void;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const sizes: Record<ButtonSize, string> = {
  sm: 'h-11 px-4 text-sm gap-2', // 44px minimum touch target
  md: 'h-12 px-6 text-base gap-2.5',
  lg: 'h-14 px-8 text-base gap-3',
};

function variantClasses(variant: ButtonVariant, tone: 'orange' | 'green') {
  switch (variant) {
    case 'primary':
      return 'bg-brand-orange text-white shadow-orange hover:bg-none hover:bg-orange-600 hover:-translate-y-px';
    case 'secondary':
      return tone === 'green'
        ? 'border-[1.5px] border-green-800 bg-white text-green-800 hover:bg-green-50'
        : 'border-[1.5px] border-orange-500 bg-white text-orange-600 hover:bg-orange-50';
    case 'ghost':
      return 'bg-transparent text-green-800 hover:bg-green-50';
  }
}

/** Pill button / link. Renders `next/link` for internal hrefs and `<a>` for tel:, mailto:, external. */
export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    tone = 'orange',
    icon,
    iconRight,
    arrow,
    loading,
    className,
    children,
    ...rest
  } = props;

  const classes = cn(
    'focus-ring inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-60 aria-disabled:pointer-events-none aria-disabled:opacity-60',
    sizes[size],
    variantClasses(variant, tone),
    className,
  );

  const content = (
    <>
      {loading ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : icon}
      {children}
      {iconRight ?? (arrow ? <ArrowRight className="size-5" aria-hidden="true" /> : null)}
    </>
  );

  if ('href' in rest && rest.href !== undefined) {
    const { href, target, rel, ...anchorRest } = rest;
    if (isExternalHref(href)) {
      const newTab = target === '_blank' || (/^https?:/.test(href) && target === undefined);
      return (
        <a
          href={href}
          target={newTab ? '_blank' : target}
          rel={newTab ? (rel ?? 'noopener noreferrer') : rel}
          className={classes}
          {...anchorRest}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} target={target} rel={rel} {...anchorRest}>
        {content}
      </Link>
    );
  }

  const { type = 'button', disabled, ...buttonRest } = rest as ButtonAsButton;
  return (
    <button type={type} disabled={disabled || loading} className={classes} {...buttonRest}>
      {content}
    </button>
  );
}
