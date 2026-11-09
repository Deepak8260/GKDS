import type { Metadata } from 'next';
import { SiteEditor } from '@/components/admin/editors/site-editor';

export const metadata: Metadata = { title: 'Site Settings' };

export default function Page() {
  return <SiteEditor />;
}
