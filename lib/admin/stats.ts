import 'server-only';
import { getCourses, getGallery, getReviews } from '@/lib/content';
import { computeReviewStats } from '@/lib/content/stats';
import { getGithubConfig } from '@/lib/github';
import { getCommits } from '@/lib/github-write';

export interface AdminCounts {
  courses: number;
  coursesPublished: number;
  photos: number;
  photosPublished: number;
  reviewsPublished: number;
  reviewsHidden: number;
  /** Average of the published reviews, or null when there are none. */
  rating: number | null;
  lastUpdate: string | null;
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const [courses, gallery, reviews] = await Promise.all([getCourses(), getGallery(), getReviews()]);
  const reviewStats = computeReviewStats(reviews.items);

  let lastUpdate: string | null = null;
  if (getGithubConfig()) {
    try {
      lastUpdate = (await getCommits(undefined, 1))[0]?.date ?? null;
    } catch {
      lastUpdate = null;
    }
  }

  return {
    courses: courses.courses.length,
    coursesPublished: courses.courses.filter((c) => c.published).length,
    photos: gallery.items.length,
    photosPublished: gallery.items.filter((p) => p.published).length,
    reviewsPublished: reviewStats.count,
    reviewsHidden: reviews.items.length - reviewStats.count,
    rating: reviewStats.rating,
    lastUpdate,
  };
}
