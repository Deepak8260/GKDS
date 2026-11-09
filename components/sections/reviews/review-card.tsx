import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Stars } from '@/components/ui/stars';
import type { ReviewItem } from './review-utils';

/** One learner review: avatar, name, stars, "3 weeks ago", a rating badge and the text. */
export function ReviewCard({ review, starsLabel }: { review: ReviewItem; starsLabel?: string }) {
  return (
    <Card as="article" className="relative flex h-full flex-col p-6">
      {/* rating badge, e.g. "5★" (the stars next to the name already announce the rating) */}
      <span
        aria-hidden="true"
        className="absolute right-4 top-4 inline-flex items-center gap-0.5 rounded-full bg-orange-50 px-3 py-1 text-base font-bold leading-none text-orange-700 ring-1 ring-orange-200"
      >
        {Number.isInteger(review.rating) ? review.rating : review.rating.toFixed(1)}
        <span className="text-orange-500">★</span>
      </span>

      <header className="relative flex items-center gap-4 pr-12">
        <Avatar name={review.name} src={review.avatar} size={64} />
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-ink">{review.name}</h3>
          <Stars value={review.rating} size={20} className="mt-1" label={starsLabel} />
          <p className="mt-0.5 text-sm text-muted">
            <time dateTime={review.date}>{review.relative}</time>
          </p>
        </div>
      </header>

      <blockquote className="mt-4 text-[14.5px] leading-[1.6] text-ink">“{review.text}”</blockquote>
    </Card>
  );
}
