import type { Review } from '@/lib/validators';

export interface ReviewStats {
  /** Number of published reviews. */
  count: number;
  /** Average rating to one decimal, or null when there are no published reviews. */
  rating: number | null;
  /** Reviewers who rated 4 stars or more (our "Happy Learners"). */
  happyLearners: number;
  /** Share of published reviews rated 4 stars or more (0–100), or null when there are none. */
  recommendPercent: number | null;
}

/**
 * Summary numbers for the Reviews page. Always real: computed from the published reviews only,
 * never from typed-in figures. With no published reviews every number is empty (null / 0).
 */
export function computeReviewStats(reviews: Pick<Review, 'rating' | 'published'>[]): ReviewStats {
  const published = reviews.filter((r) => r.published);
  if (published.length === 0) return { count: 0, rating: null, happyLearners: 0, recommendPercent: null };

  const avg = published.reduce((sum, r) => sum + r.rating, 0) / published.length;
  const happy = published.filter((r) => r.rating >= 4).length;
  return {
    count: published.length,
    rating: Math.round(avg * 10) / 10,
    happyLearners: happy,
    recommendPercent: Math.round((happy / published.length) * 100),
  };
}
