import type { Metadata } from 'next';
import { GalleryPageView, galleryMetadata } from '@/components/pages/gallery-page';

export const generateMetadata = (): Promise<Metadata> => galleryMetadata('en');

export default function Page() {
  return <GalleryPageView locale="en" />;
}
