'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from '@/lib/i18n/locales';

const LocaleContext = createContext<Locale>('en');

/** Tells every client component below which language the page is in. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = (): Locale => useContext(LocaleContext);
