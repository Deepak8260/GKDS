import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/page-hero';

export const metadata: Metadata = { title: 'About Us' };

/** Placeholder — built in prompt 04. */
export default function AboutPage() {
  return (
    <PageHero
      title="About Us"
      subtitle="Know more about Gopal Krushna Driving Training School, our journey, values and commitment to safe driving."
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'About Us' }]}
      image="/placeholders/hero-building.svg"
      imageAlt="Gopal Krushna Driving Training School building"
    />
  );
}
