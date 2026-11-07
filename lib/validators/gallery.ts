import { z } from 'zod';
import { hero, iconName, id, isoDate, mediaPath, required, slug, text, uniqueBy } from './common';

export const galleryCategorySchema = z.object({
  id: slug,
  label: required(40),
  icon: iconName,
});

export const galleryItemSchema = z.object({
  id,
  src: mediaPath.refine((v) => v !== '', 'Image is required'),
  alt: required(200, 'Describe the photo (alt text)'),
  category: slug,
  order: z.number().int().min(0),
  published: z.boolean(),
  createdAt: isoDate,
});

export const gallerySchema = z
  .object({
    hero,
    titleLead: required(40),
    titleHighlight: text(40),
    categories: z.array(galleryCategorySchema).min(1).max(12),
    items: z.array(galleryItemSchema).max(500),
  })
  .refine((v) => uniqueBy(v.categories, (c) => c.id), {
    path: ['categories'],
    message: 'Each category needs a unique id',
  })
  .refine((v) => uniqueBy(v.items, (i) => i.id), {
    path: ['items'],
    message: 'Each photo needs a unique id',
  })
  .refine(
    (v) => {
      const ids = new Set(v.categories.map((c) => c.id));
      return v.items.every((i) => ids.has(i.category));
    },
    { path: ['items'], message: 'Every photo must belong to an existing category' },
  );

export type GalleryCategory = z.infer<typeof galleryCategorySchema>;
export type GalleryItem = z.infer<typeof galleryItemSchema>;
export type Gallery = z.infer<typeof gallerySchema>;
