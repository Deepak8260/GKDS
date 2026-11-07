import { z } from 'zod';
import { hero, id, isoDate, mediaPath, rating, required, text, uniqueBy } from './common';

export const reviewSchema = z.object({
  id,
  name: required(60),
  rating,
  text: required(600),
  avatar: mediaPath.optional(),
  date: isoDate,
  published: z.boolean(),
  featured: z.boolean(),
});

export const reviewsSchema = z
  .object({
    hero,
    titleLead: required(80),
    titleHighlight: text(60).optional(),
    /** `auto`: computed from published reviews. `manual`: numbers from site.stats. */
    summaryMode: z.enum(['auto', 'manual']),
    /** When false the public form is closed and the API returns 403. */
    acceptSubmissions: z.boolean().default(true),
    ctaTitleLead: required(40),
    ctaTitleHighlight: required(60),
    ctaText: required(200),
    items: z.array(reviewSchema).max(1000),
  })
  .refine((v) => uniqueBy(v.items, (r) => r.id), {
    path: ['items'],
    message: 'Each review needs a unique id',
  })
  .refine((v) => v.items.filter((r) => r.featured && r.published).length <= 3, {
    path: ['items'],
    message: 'At most 3 published reviews can be featured',
  });

/** A review submitted from the public form, waiting for approval (one file per review). */
export const pendingReviewSchema = z.object({
  id,
  name: required(60),
  rating: z.number().int().min(1).max(5),
  text: required(600),
  submittedAt: isoDate,
  status: z.literal('pending'),
});

export type Review = z.infer<typeof reviewSchema>;
export type Reviews = z.infer<typeof reviewsSchema>;
export type PendingReview = z.infer<typeof pendingReviewSchema>;
