import type { Metadata } from 'next';
import { AboutTeaser } from '@/components/sections/home/about-teaser';
import { ContactTeaser } from '@/components/sections/home/contact-teaser';
import { CoursesTeaser } from '@/components/sections/home/courses-teaser';
import { Hero } from '@/components/sections/home/hero';
import { Journey } from '@/components/sections/home/journey';
import { ReviewsTeaser } from '@/components/sections/home/reviews-teaser';
import { TrustBar } from '@/components/sections/home/trust-bar';
import { WhyChoose } from '@/components/sections/home/why-choose';
import { getFeaturedReviews, getHome, getPublishedCourses, getSite } from '@/lib/content';
import type { Locale } from '@/lib/i18n/locales';
import { mediaUrl } from '@/lib/media';
import { buildMetadata } from '@/lib/seo';

export async function homeMetadata(locale: Locale): Promise<Metadata> {
  const site = await getSite(locale);
  return {
    ...buildMetadata({
      title: site.seo.title,
      description: site.seo.description,
      path: '/',
      image: site.ogImage ? mediaUrl(site.ogImage) : undefined,
      siteName: site.name,
      locale,
    }),
    // the home title is already complete: no " | site name" suffix
    title: { absolute: site.seo.title },
    keywords: site.seo.keywords,
  };
}

export async function HomePageView({ locale }: { locale: Locale }) {
  const [home, site, courses, reviews] = await Promise.all([
    getHome(locale),
    getSite(locale),
    getPublishedCourses(locale),
    getFeaturedReviews(3),
  ]);

  return (
    <>
      <Hero hero={home.hero} phone={site.phones[0]} />
      <TrustBar items={home.trustBar} />
      <AboutTeaser about={home.aboutTeaser} locale={locale} />
      <WhyChoose why={home.whyChoose} />
      <CoursesTeaser intro={home.coursesIntro} courses={courses} locale={locale} />
      <Journey journey={home.journey} />
      <ReviewsTeaser intro={home.reviewsIntro} reviews={reviews} locale={locale} />
      <ContactTeaser contact={home.contactTeaser} site={site} locale={locale} />
    </>
  );
}
