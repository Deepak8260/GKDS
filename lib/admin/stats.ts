import 'server-only';
import { getCourses, getGallery, getReviews } from '@/lib/content';
import { getGithubConfig, listDir } from '@/lib/github';
import { getCommits } from '@/lib/github-write';

export interface AdminCounts {
  courses: number;
  coursesPublished: number;
  photos: number;
  photosPublished: number;
  reviewsPublished: number;
  pending: number;
  lastUpdate: string | null;
}

/** Number of pending review submissions (files in submissions/reviews/). 0 if GitHub is not connected. */
export async function getPendingCount(): Promise<number> {
  if (!getGithubConfig()) return 0;
  try {
    const files = await listDir('submissions/reviews', { revalidate: 0 });
    return files.filter((f) => f.type === 'file' && f.name.endsWith('.json')).length;
  } catch {
    return 0;
  }
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const [courses, gallery, reviews, pending] = await Promise.all([getCourses(), getGallery(), getReviews(), getPendingCount()]);

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
    reviewsPublished: reviews.items.filter((r) => r.published).length,
    pending,
    lastUpdate,
  };
}
