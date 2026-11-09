import type { Metadata } from 'next';
import { AboutTeaser } from '@/components/sections/home/about-teaser';
import { ContactTeaser } from '@/components/sections/home/contact-teaser';
import { CoursesTeaser } from '@/components/sections/home/courses-teaser';
import { OwnerMessage } from '@/components/sections/home/owner-message';
import { Hero } from '@/components/sections/home/hero';
import { Journey } from '@/components/sections/home/journey';
import { ReviewsTeaser } from '@/components/sections/home/reviews-teaser';
import { TrustBar } from '@/components/sections/home/trust-bar';
import { WhyChoose } from '@/components/sections/home/why-choose';
import { mediaUrl } from '@/lib/media';
import { getFeaturedReviews, getHome, getPublishedCourses, getSite } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    ...buildMetadata({
      title: site.seo.title,
      description: site.seo.description,
      path: '/',
      image: site.ogImage ? mediaUrl(site.ogImage) : undefined,
      siteName: site.name,
    }),
    // the home title is already complete: no " | site name" suffix
    title: { absolute: site.seo.title },
    keywords: site.seo.keywords,
  };
}

export default async function HomePage() {
  const [home, site, courses, reviews] = await Promise.all([
    getHome(),
    getSite(),
    getPublishedCourses(),
    getFeaturedReviews(3),
  ]);

  return (
    <>
      <Hero hero={home.hero} phone={site.phones[0]} />
      <TrustBar items={home.trustBar} />
      <AboutTeaser about={home.aboutTeaser} />
      <OwnerMessage message={home.ownerMessage} />
      <WhyChoose why={home.whyChoose} />
      <CoursesTeaser intro={home.coursesIntro} courses={courses} />
      <Journey journey={home.journey} />
      <ReviewsTeaser intro={home.reviewsIntro} reviews={reviews} />
      <ContactTeaser contact={home.contactTeaser} site={site} />
    </>
  );
}
