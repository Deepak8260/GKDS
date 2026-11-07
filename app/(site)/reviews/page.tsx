import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/page-hero';

export const metadata: Metadata = { title: 'Student Reviews' };

/** Placeholder — built in prompt 07. */
export default function ReviewsPage() {
  return (
    <PageHero
      title="Student Reviews"
      subtitle="Hear from our learners about their experience with us."
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Reviews' }]}
      image="/placeholders/car-wagonr.svg"
      imageAlt="White WagonR training car"
    />
  );
}
