import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/page-hero';
import { ReviewsClient } from '@/components/sections/reviews/reviews-client';
import { formatRating, type ReviewItem } from '@/components/sections/reviews/review-utils';
import { ShareBanner } from '@/components/sections/reviews/share-banner';
import { Container } from '@/components/ui/container';
import { StatBar } from '@/components/ui/stat-bar';
import { getPublishedReviews, getReviewStats, getReviews, getSite } from '@/lib/content';
import { formatRelative } from '@/lib/date';
import { JsonLd } from '@/components/seo/json-ld';
import { SCHOOL_ID } from '@/lib/json-ld';
import { mediaUrl } from '@/lib/media';
import { buildMetadata, truncate } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const [doc, site, stats] = await Promise.all([getReviews(), getSite(), getReviewStats()]);
  return buildMetadata({
    title: 'Student Reviews',
    description: truncate(
      `${doc.hero.subtitle} Rated ${formatRating(stats.rating)}/5 by learners of ${site.name} in ${site.address.city}.`,
      155,
    ),
    path: '/reviews',
    image: mediaUrl(doc.hero.image || site.ogImage),
    siteName: site.name,
  });
}

export default async function ReviewsPage() {
  const [doc, site, stats, published] = await Promise.all([
    getReviews(),
    getSite(),
    getReviewStats(),
    getPublishedReviews(),
  ]);

  // "3 weeks ago" is worked out here, on the server, so what the browser hydrates always matches.
  const now = new Date();
  const items: ReviewItem[] = published.map((r) => ({ ...r, relative: formatRelative(r.date, now) }));

  // The school and its aggregate rating are in the site-wide graph; here we add only the individual reviews.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@id': SCHOOL_ID,
    '@type': 'DrivingSchool',
    review: published.slice(0, 5).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.name },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      reviewBody: r.text,
      datePublished: r.date.slice(0, 10),
      itemReviewed: { '@id': SCHOOL_ID },
    })),
  };

  return (
    <>
      {published.length ? <JsonLd data={jsonLd} /> : null}

      <PageHero
        title={doc.hero.title}
        subtitle={doc.hero.subtitle}
        breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Reviews' }]}
        image={doc.hero.image}
        imageAlt={doc.hero.imageAlt}
        imagePosition="center 65%"
      />

      <Container className="relative z-10">
        <StatBar
          large
          overlap
          className="mx-auto max-w-[1040px]"
          items={[
            {
              icon: 'star',
              title: (
                <>
                  {formatRating(stats.rating)} <span className="text-xl font-semibold text-ink/70 md:text-2xl">/ 5</span>
                </>
              ),
              subtitle: `Based on ${stats.ratingCount} Reviews`,
            },
            { icon: 'users', title: stats.trainedDrivers, subtitle: 'Happy Learners' },
            { icon: 'shield-check', title: `${stats.recommendPercent}%`, subtitle: 'Would Recommend' },
          ]}
        />
      </Container>

      <section className="section-y pb-10 pt-10 md:pb-10 md:pt-10" aria-label="Student reviews">
        <Container>
          <ReviewsClient
            titleLead={doc.titleLead}
            reviews={items}
            schoolName={site.name}
            accepting={doc.acceptSubmissions}
          />
        </Container>
      </section>

      <ShareBanner doc={doc} schoolName={site.name} accepting={doc.acceptSubmissions} />
    </>
  );
}
