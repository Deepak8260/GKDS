import { z } from 'zod';
import { feature, hero, mediaPath, required, statItem, text } from './common';

export const aboutSchema = z.object({
  hero,
  story: z.object({
    eyebrow: required(40),
    titleLead: required(60),
    titleHighlight: required(60),
    paragraphs: z.array(required(1500)).min(1).max(5),
    image: mediaPath,
    imageAlt: text(200),
  }),
  stats: z.array(statItem).min(1).max(4),
  missionVisionTitle: required(60),
  mission: z.object({ title: required(60), text: required(400) }),
  vision: z.object({ title: required(60), text: required(400) }),
  valuesTitle: required(60),
  values: z.array(feature).min(3).max(6),
});

export type About = z.infer<typeof aboutSchema>;
