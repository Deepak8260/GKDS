import type { Metadata } from 'next';
import { HomeEditor } from '@/components/admin/editors/home-editor';

export const metadata: Metadata = { title: 'Home Page' };

export default function Page() {
  return <HomeEditor />;
}
