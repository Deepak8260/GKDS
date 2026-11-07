import { z } from 'zod';
import { feature, hero, id, mediaPath, required, slug, text, uniqueBy } from './common';

export const courseSchema = z.object({
  id,
  slug,
  title: required(80),
  description: required(220),
  vehicle: required(60),
  image: mediaPath,
  imageAlt: text(200),
  features: z.array(required(80)).min(1).max(6),
  order: z.number().int().min(0),
  published: z.boolean(),
});

export const coursesSchema = z
  .object({
    hero,
    intro: z.object({
      lead: required(60),
      highlight: required(60),
      subtitle: required(300),
    }),
    courses: z.array(courseSchema).max(8),
    includedTitle: required(80),
    included: z.array(feature).min(3).max(6),
    highlights: z.object({
      lead: required(60),
      highlight: required(60),
      image: mediaPath,
      imageAlt: text(200),
      items: z.array(required(120)).min(3).max(8),
    }),
    cta: z.object({
      lead: required(80),
      highlight: required(60),
      text: required(300),
    }),
  })
  .refine((v) => uniqueBy(v.courses, (c) => c.slug), {
    path: ['courses'],
    message: 'Each course needs a unique slug',
  })
  .refine((v) => uniqueBy(v.courses, (c) => c.id), {
    path: ['courses'],
    message: 'Each course needs a unique id',
  });

export type Course = z.infer<typeof courseSchema>;
export type Courses = z.infer<typeof coursesSchema>;
