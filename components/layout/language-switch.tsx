'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { rememberLocale } from '@/components/i18n/lang-preference';
import { useLocale } from '@/components/i18n/locale-context';
import { alternatePath, type Locale } from '@/lib/i18n/locales';
import { cn } from '@/lib/utils';

interface LanguageSwitchProps {
  /** Visible text, written in the language it switches TO ("ଓଡ଼ିଆ" on the English site, "English" on the Odia site). */
  label: string;
  /** Screen-reader text in the current page language. */
  ariaLabel: string;
  className?: string;
}

/** The language button in the top bar: opens the same page in the other language and remembers the choice. */
export function LanguageSwitch({ label, ariaLabel, className }: LanguageSwitchProps) {
  const pathname = usePathname() ?? '/';
  const locale = useLocale();
  const target: Locale = locale === 'or' ? 'en' : 'or';
  return (
    <Link
      href={alternatePath(pathname, target)}
      hrefLang={target === 'or' ? 'or' : 'en'}
      lang={target === 'or' ? 'or' : 'en'}
      aria-label={`${label} – ${ariaLabel}`}
      onClick={() => rememberLocale(target)}
      className={cn(
        'focus-ring inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-green-800/25 bg-white px-3 text-[14px] font-semibold sm:px-3.5 text-green-900 transition-colors hover:border-orange-500 hover:text-orange-600',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="hidden size-4 sm:block" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18" />
      </svg>
      {label}
    </Link>
  );
}
