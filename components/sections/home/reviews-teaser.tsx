import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { Stars } from '@/components/ui/stars';
import { tFor } from '@/lib/i18n';
import { fmt, type Locale } from '@/lib/i18n/locales';
import type { Home, Review } from '@/lib/validators';

interface ReviewsTeaserProps {
  intro: Home['reviewsIntro'];
  /** Featured, published reviews (max 3). */
  reviews: Review[];
  locale?: Locale;
}

/** Three featured reviews with a link to the full Reviews page. */
export function ReviewsTeaser({ intro, reviews, locale = 'en' }: ReviewsTeaserProps) {
  const t = tFor(locale);
  if (reviews.length === 0) return null;
  return (
    <Reveal as="section" className="section-y pt-4 md:pt-8">
      <Container>
        <SectionHeading
          eyebrow={intro.eyebrow}
          lead={intro.title}
          action={{ label: t.actions.viewAllReviews, href: '/reviews' }}
        />
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {reviews.slice(0, 3).map((review) => (
            <li key={review.id}>
              <Card as="figure" className="flex h-full items-start gap-4 p-5">
                <Avatar name={review.name} src={review.avatar} size={56} />
                <div className="min-w-0">
                  <figcaption>
                    <span className="block text-base font-bold text-ink">{review.name}</span>
                    <Stars value={review.rating} size={16} className="mt-1" label={fmt(t.stars.label, { value: review.rating })} />
                  </figcaption>
                  <blockquote className="mt-2 line-clamp-4 text-[14px] leading-snug text-muted">
                    “{review.text}”
                  </blockquote>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </Reveal>
  );
}
