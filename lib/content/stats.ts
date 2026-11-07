import type { Review, Site } from '@/lib/validators';

export interface ReviewStats {
  /** e.g. 4.8 */
  rating: number;
  /** Display label, e.g. "250+" (manual) or "6" (auto). */
  ratingCount: string;
  /** e.g. "1000+" */
  trainedDrivers: string;
  /** 0–100 */
  recommendPercent: number;
  mode: 'auto' | 'manual';
}

/**
 * Summary numbers for the Reviews page.
 *  - manual: values entered in site settings (site.stats)
 *  - auto: average rating (1 decimal), review count and share of 4★+ reviews, from published reviews.
 *    Falls back to the manual numbers when there are no published reviews.
 */
export function computeReviewStats(
  reviews: Review[],
  site: Pick<Site, 'stats'>,
  mode: 'auto' | 'manual',
): ReviewStats {
  const manual: ReviewStats = {
    rating: site.stats.rating,
    ratingCount: site.stats.ratingCount,
    trainedDrivers: site.stats.trainedDrivers,
    recommendPercent: site.stats.recommendPercent,
    mode: 'manual',
  };
  if (mode === 'manual') return manual;

  const published = reviews.filter((r) => r.published);
  if (published.length === 0) return manual;

  const avg = published.reduce((sum, r) => sum + r.rating, 0) / published.length;
  const recommend = (published.filter((r) => r.rating >= 4).length / published.length) * 100;
  return {
    rating: Math.round(avg * 10) / 10,
    ratingCount: String(published.length),
    trainedDrivers: site.stats.trainedDrivers,
    recommendPercent: Math.round(recommend),
    mode: 'auto',
  };
}
