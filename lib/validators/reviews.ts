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

/**
 * What a visitor may send from the public "Leave a Review" form (validated in the browser AND on the server).
 * A name, a whole-star rating and the text, plus an optional phone number kept privately (never shown).
 * `company` is a hidden honeypot field (humans leave it empty); `startedAt` is when the form opened (ms epoch).
 */
export const publicReviewSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your name (at least 2 letters).')
    .max(60, 'Name must be 60 characters or fewer.')
    .regex(/^\p{L}[\p{L}\p{M}\s.'’-]*$/u, 'Use letters only in your name (spaces, . \' and - are fine).'),
  rating: z
    .number({ error: 'Please choose a star rating.' })
    .int('Please choose a star rating.')
    .min(1, 'Please choose a star rating.')
    .max(5, 'Please choose a star rating.'),
  text: z
    .string()
    .trim()
    .min(20, 'Please write at least 20 characters.')
    .max(600, 'Please keep your review under 600 characters.'),
  /** Optional: kept for the admin only, never shown publicly. */
  phone: z
    .string()
    .trim()
    .regex(/^(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/, 'Enter a valid 10-digit mobile number.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  company: z.string().max(200).optional().default(''),
  startedAt: z.number().int().nonnegative(),
});
export type PublicReviewInput = z.infer<typeof publicReviewSchema>;

/** A review submitted from the public form, waiting for approval (one file per review). */
export const pendingReviewSchema = z.object({
  id,
  name: required(60),
  rating: z.number().int().min(1).max(5),
  text: required(600),
  phone: z.string().max(20).optional(),
  submittedAt: isoDate,
  status: z.literal('pending'),
});

export type Review = z.infer<typeof reviewSchema>;
export type Reviews = z.infer<typeof reviewsSchema>;
export type PendingReview = z.infer<typeof pendingReviewSchema>;
