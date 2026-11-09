import type { Metadata } from 'next';
import { AboutEditor } from '@/components/admin/editors/about-editor';

export const metadata: Metadata = { title: 'About Page' };

export default function Page() {
  return <AboutEditor />;
}
