import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/page-hero';
import { ReviewsClient } from '@/components/sections/reviews/reviews-client';
import { formatRating, type ReviewItem } from '@/components/sections/reviews/review-utils';
import { ShareBanner } from '@/components/sections/reviews/share-banner';
import { JsonLd } from '@/components/seo/json-ld';
import { Container } from '@/components/ui/container';
import { StatBar } from '@/components/ui/stat-bar';
import { getPublishedReviews, getReviewStats, getReviews, getSite } from '@/lib/content';
import { formatRelative } from '@/lib/date';
import { tFor } from '@/lib/i18n';
import { fmt, type Locale } from '@/lib/i18n/locales';
import { SCHOOL_ID } from '@/lib/json-ld';
import { mediaUrl } from '@/lib/media';
import { buildMetadata, truncate } from '@/lib/seo';

export async function reviewsMetadata(locale: Locale): Promise<Metadata> {
  const [doc, site, stats] = await Promise.all([getReviews(locale), getSite(locale), getReviewStats()]);
  const t = tFor(locale).meta;
  const rated =
    stats.rating !== null
      ? fmt(t.reviewsDescription, { rating: formatRating(stats.rating), name: site.name, city: site.address.city })
      : fmt(t.reviewsDescriptionNone, { name: site.name, city: site.address.city });
  return buildMetadata({
    title: t.reviews,
    description: truncate(`${doc.hero.subtitle} ${rated}`, 155),
    path: '/reviews',
    image: mediaUrl(doc.hero.image || site.ogImage),
    siteName: site.name,
    locale,
  });
}

export async function ReviewsPageView({ locale }: { locale: Locale }) {
  const [doc, site, stats, published] = await Promise.all([
    getReviews(locale),
    getSite(locale),
    getReviewStats(),
    getPublishedReviews(),
  ]);
  const t = tFor(locale);

  // "3 weeks ago" is worked out here, on the server, so what the browser hydrates always matches.
  const now = new Date();
  const items: ReviewItem[] = published.map((r) => ({ ...r, relative: formatRelative(r.date, now, t.time) }));

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

  const formTexts = { reviews: t.reviews, reviewForm: t.reviewForm };

  return (
    <>
      {published.length ? <JsonLd data={jsonLd} /> : null}

      <PageHero
        title={doc.hero.title}
        subtitle={doc.hero.subtitle}
        breadcrumb={[{ label: t.nav.home, href: '/' }, { label: t.nav.reviews }]}
        image={doc.hero.image}
        imageAlt={doc.hero.imageAlt}
        imagePosition="center 65%"
        locale={locale}
      />

      <Container className="relative z-10">
        <StatBar
          large
          overlap
          className="mx-auto max-w-[1040px]"
          items={[
            {
              icon: 'star',
              title:
                stats.rating !== null ? (
                  <>
                    {formatRating(stats.rating)} <span className="text-xl font-semibold text-ink/70 md:text-2xl">/ 5</span>
                  </>
                ) : (
                  '–'
                ),
              subtitle: stats.count > 0 ? (stats.count === 1 ? t.reviews.basedOnOne : fmt(t.reviews.basedOnMany, { n: stats.count })) : t.reviews.noneYet,
            },
            { icon: 'users', title: stats.count > 0 ? String(stats.happyLearners) : '–', subtitle: t.reviews.happyLearners },
            {
              icon: 'shield-check',
              title: stats.recommendPercent !== null ? `${stats.recommendPercent}%` : '–',
              subtitle: t.reviews.wouldRecommend,
            },
          ]}
        />
      </Container>

      <ShareBanner doc={doc} schoolName={site.name} accepting={doc.acceptSubmissions} t={formTexts} />

      <section className="pb-12 pt-0 md:pb-16" aria-label={t.reviews.sectionLabel}>
        <Container>
          <ReviewsClient
            titleLead={doc.titleLead}
            reviews={items}
            schoolName={site.name}
            accepting={doc.acceptSubmissions}
            t={{ reviews: t.reviews, reviewForm: t.reviewForm, stars: t.stars }}
          />
        </Container>
      </section>
    </>
  );
}
