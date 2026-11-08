'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { useQueryParam } from '@/lib/hooks/use-query-param';
import { LeaveReviewButton } from './leave-review-button';
import { ReviewCard } from './review-card';
import { PAGE_SIZE, countLabel, resolveSort, sortReviews, type ReviewItem } from './review-utils';
import { SortSelect } from './sort-select';

interface ReviewsClientProps {
  titleLead: string;
  /** Published reviews with their relative-time text. */
  reviews: ReviewItem[];
  schoolName: string;
  accepting: boolean;
}

/** Heading + sort dropdown + review grid + Load more. The sort lives in `?sort=`. */
export function ReviewsClient({ titleLead, reviews, schoolName, accepting }: ReviewsClientProps) {
  const [param, setParam] = useQueryParam('sort');
  const sort = resolveSort(param);
  const sorted = useMemo(() => sortReviews(reviews, sort), [reviews, sort]);

  const [limit, setLimit] = useState(PAGE_SIZE);
  const visible = sorted.slice(0, limit);

  return (
    <>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
        <SectionHeading lead={titleLead} dash="before" size="lg" />
        {reviews.length > 1 ? (
          <SortSelect value={sort} onChange={(next) => setParam(next === 'recent' ? null : next)} />
        ) : null}
      </div>

      {reviews.length > 0 ? (
        <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((review) => (
            <li key={review.id} className="min-w-0">
              <ReviewCard review={review} />
            </li>
          ))}
        </ul>
      ) : (
        <Card tone="green-soft" className="mt-8 flex flex-col items-center gap-4 px-6 py-14 text-center">
          <p className="font-display text-2xl font-bold italic text-green-900">
            No reviews yet — be the first to share your experience!
          </p>
          <LeaveReviewButton schoolName={schoolName} accepting={accepting} />
        </Card>
      )}

      {reviews.length > 0 ? (
        <div className="mt-8 flex flex-col items-center gap-4">
          <p role="status" aria-live="polite" className="text-sm text-muted">
            {countLabel(visible.length, sorted.length)}
          </p>
          {visible.length < sorted.length ? (
            <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
              Load more reviews
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
