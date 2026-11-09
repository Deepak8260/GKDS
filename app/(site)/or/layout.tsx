import type { ReactNode } from 'react';
import { Noto_Sans_Oriya } from 'next/font/google';
import { HtmlLang } from '@/components/i18n/html-lang';
import { LocaleLayout } from '@/components/layout/locale-layout';

// The Odia script needs its own font (Inter has no Odia letters). Variable font, loaded only on the Odia pages.
const odia = Noto_Sans_Oriya({
  subsets: ['oriya'],
  display: 'swap',
  variable: '--font-odia',
});

export default function OdiaLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HtmlLang lang="or-IN" className={`${odia.variable} lang-or`} />
      {/* the class on the wrapper means the Odia font is there from the very first paint */}
      <LocaleLayout locale="or" className={`${odia.variable} lang-or`}>
        {children}
      </LocaleLayout>
    </>
  );
}
