/**
 * Content types — inferred from the zod schemas in lib/validators (single source of truth).
 * Components import from here so the path stays stable.
 */
export type {
  Site,
  Home,
  About,
  Courses,
  Course,
  Gallery,
  GalleryItem,
  GalleryCategory,
  Reviews,
  Review,
  PendingReview,
} from '@/lib/validators';

export type IconName = string;
export type MediaPath = string;

export interface Hero {
  title: string;
  subtitle: string;
  image: MediaPath;
  imageAlt: string;
}

export interface Feature {
  icon: IconName;
  title: string;
  text?: string;
}
