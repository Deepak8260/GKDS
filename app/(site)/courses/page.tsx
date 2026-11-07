import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/page-hero';
import { getCourses } from '@/lib/content';

export const metadata: Metadata = { title: 'Our Courses' };

/** Placeholder — built in prompt 05. */
export default async function CoursesPage() {
  const { hero } = await getCourses();
  return (
    <PageHero
      title={hero.title}
      subtitle={hero.subtitle}
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Courses' }]}
      image={hero.image}
      imageAlt={hero.imageAlt}
    />
  );
}
