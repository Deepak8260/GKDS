import type { Metadata } from 'next';
import { GalleryEditor } from '@/components/admin/editors/gallery-editor';

export const metadata: Metadata = { title: 'Gallery' };

export default function Page() {
  return <GalleryEditor />;
}
