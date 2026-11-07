import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/page-hero';

export const metadata: Metadata = { title: 'Gallery' };

/** Placeholder — built in prompt 06. */
export default function GalleryPage() {
  return (
    <PageHero
      title="Gallery"
      subtitle="A glimpse of our training vehicles, premises and practical driving sessions."
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Gallery' }]}
      image="/assets/placeholders/hero-building.svg"
      imageAlt="Gopal Krushna Driving Training School building"
    />
  );
}
