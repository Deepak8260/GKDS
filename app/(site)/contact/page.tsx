import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/page-hero';

export const metadata: Metadata = { title: 'Contact Us' };

/** Placeholder — built in prompt 08. */
export default function ContactPage() {
  return (
    <PageHero
      title="Contact Us"
      subtitle="Have a question or need assistance? We're here to help you!"
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
      image="/assets/placeholders/car-wagonr.svg"
      imageAlt="White WagonR training car"
    />
  );
}
