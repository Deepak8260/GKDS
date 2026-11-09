import type { ReactNode } from 'react';
import { LocaleLayout } from '@/components/layout/locale-layout';

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <LocaleLayout locale="en">{children}</LocaleLayout>;
}
