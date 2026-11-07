import type { Metadata } from 'next';
import { AboutTeaser } from '@/components/sections/home/about-teaser';
import { ContactTeaser } from '@/components/sections/home/contact-teaser';
import { CoursesTeaser } from '@/components/sections/home/courses-teaser';
import { Hero } from '@/components/sections/home/hero';
import { Journey } from '@/components/sections/home/journey';
import { ReviewsTeaser } from '@/components/sections/home/reviews-teaser';
import { TrustBar } from '@/components/sections/home/trust-bar';
import { WhyChoose } from '@/components/sections/home/why-choose';
import { drivingSchoolJsonLd, jsonLdString } from '@/lib/json-ld';
import { mediaUrl } from '@/lib/media';
import { getFeaturedReviews, getHome, getPublishedCourses, getSite } from '@/lib/content';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const image = site.ogImage ? [{ url: mediaUrl(site.ogImage) }] : undefined;
  return {
    title: { absolute: site.seo.title },
    description: site.seo.description,
    keywords: site.seo.keywords,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      url: '/',
      title: site.seo.title,
      description: site.seo.description,
      siteName: site.name,
      locale: 'en_IN',
      images: image,
    },
    twitter: { card: 'summary_large_image', title: site.seo.title, description: site.seo.description },
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
      <script
        type="application/ld+json"
        // Interim: prompt 09 moves this to one global entity in the root layout.
        dangerouslySetInnerHTML={{ __html: jsonLdString(drivingSchoolJsonLd(site)) }}
      />
      <Hero hero={home.hero} phone={site.phones[0]} />
      <TrustBar items={home.trustBar} />
      <AboutTeaser about={home.aboutTeaser} />
      <WhyChoose why={home.whyChoose} />
      <CoursesTeaser intro={home.coursesIntro} courses={courses} />
      <Journey journey={home.journey} />
      <ReviewsTeaser intro={home.reviewsIntro} reviews={reviews} />
      <ContactTeaser contact={home.contactTeaser} site={site} />
    </>
  );
}
