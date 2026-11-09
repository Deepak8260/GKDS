import 'server-only';
import { getCourses, getGallery, getReviews } from '@/lib/content';
import { computeReviewStats } from '@/lib/content/stats';
import { getGithubConfig } from '@/lib/github';
import { getCommits } from '@/lib/github-write';
import { isContentCommit, prettifyCommit } from './commits';

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

export interface RecentChange {
  sha: string;
  message: string;
  date: string;
  url: string;
}

let recentCache: { at: number; list: RecentChange[] } | null = null;

/** The latest content changes on the data branch (not code commits), friendly wording, cached for 60 s. */
export async function getRecentChanges(limit = 10): Promise<RecentChange[]> {
  if (!getGithubConfig()) return [];
  if (recentCache && Date.now() - recentCache.at < 60_000) return recentCache.list.slice(0, limit);
  try {
    const commits = await getCommits(undefined, 60);
    const list = commits
      .filter((c) => isContentCommit(c.message))
      .slice(0, 10)
      .map((c) => ({ sha: c.sha, message: prettifyCommit(c.message), date: c.date, url: c.url }));
    recentCache = { at: Date.now(), list };
    return list.slice(0, limit);
  } catch {
    return [];
  }
}
