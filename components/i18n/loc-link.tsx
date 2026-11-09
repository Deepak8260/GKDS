'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { localizePath } from '@/lib/i18n/locales';
import { useLocale } from './locale-context';

/** `next/link` that keeps the visitor in their language: "/courses" becomes "/or/courses" on the Odia site. */
export function LocLink({ href, ...rest }: ComponentProps<typeof Link>) {
  const locale = useLocale();
  return <Link href={typeof href === 'string' ? localizePath(href, locale) : href} {...rest} />;
}
