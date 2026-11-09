import type { Metadata } from 'next';
import { TranslationsEditor } from '@/components/admin/translations-editor';

export const metadata: Metadata = { title: 'Translations' };

export default function Page() {
  return <TranslationsEditor />;
}
