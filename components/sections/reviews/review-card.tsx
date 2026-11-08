import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Stars } from '@/components/ui/stars';
import type { ReviewItem } from './review-utils';

/** One learner review: avatar, name, stars, "3 weeks ago", a faint quote mark and the text. */
export function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <Card as="article" className="relative flex h-full flex-col p-6">
      {/* decorative quote mark */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-5 top-1 select-none font-display text-[80px] font-bold leading-none text-green-100"
      >
        “
      </span>

      <header className="relative flex items-center gap-4 pr-12">
        <Avatar name={review.name} src={review.avatar} size={64} />
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-ink">{review.name}</h3>
          <Stars value={review.rating} size={20} className="mt-1" />
          <p className="mt-0.5 text-sm text-muted">
            <time dateTime={review.date}>{review.relative}</time>
          </p>
        </div>
      </header>

      <blockquote className="mt-4 text-[15.5px] leading-[1.6] text-ink">“{review.text}”</blockquote>
    </Card>
  );
}
