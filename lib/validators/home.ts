import { z } from 'zod';
import { feature, mediaPath, required, statItem, text } from './common';

export const homeSchema = z.object({
  hero: z.object({
    eyebrow: required(80),
    titleLead: required(60),
    titleHighlight: required(60),
    subtitle: required(300),
    image: mediaPath,
    imageAlt: text(200),
    primaryCta: required(30),
    secondaryCta: required(30),
  }),
  trustBar: z.array(feature).min(3).max(5),
  aboutTeaser: z.object({
    eyebrow: required(40),
    title: required(120),
    body: required(600),
    image: mediaPath,
    imageAlt: text(200),
    stats: z.array(statItem).min(1).max(4),
  }),
  whyChoose: z.object({
    eyebrow: required(40),
    lead: required(60),
    highlight: required(60),
    items: z.array(feature).min(3).max(6),
  }),
  coursesIntro: z.object({
    eyebrow: required(40),
    lead: required(80),
    highlight: required(40),
    subtitle: required(300),
  }),
  journey: z.object({
    eyebrow: required(40),
    lead: required(80),
    highlight: required(60),
    steps: z.array(feature).min(3).max(6),
  }),
  reviewsIntro: z.object({
    eyebrow: required(40),
    title: required(80),
  }),
  contactTeaser: z.object({
    eyebrow: required(40),
    title: required(60),
    body: required(300),
  }),
});

export type Home = z.infer<typeof homeSchema>;
