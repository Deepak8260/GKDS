import { z } from 'zod';

/** Trimmed string with a max length (empty allowed). */
export const text = (max = 200) => z.string().trim().max(max);

/** Trimmed, non-empty string with a max length. */
export const required = (max = 200, message = 'This field is required') =>
  z.string().trim().min(1, message).max(max, `Must be ${max} characters or fewer`);

/** Lucide kebab-case id or a custom icon id (validated against the whitelist in the UI). */
export const iconName = z
  .string()
  .trim()
  .min(1, 'Choose an icon')
  .max(40)
  .regex(/^[a-z0-9-]+$/, 'Invalid icon name');

/**
 * Media reference: "" (not set), "media/<folder>/<file>" (private repo via proxy),
 * "/placeholders/…" (bundled file) or an https URL.
 */
export const mediaPath = z
  .string()
  .trim()
  .max(300)
  .refine(
    (v) => v === '' || v.startsWith('media/') || (v.startsWith('/') && !v.startsWith('//')) || /^https:\/\//.test(v),
    'Image must be an uploaded file, a site path or an https URL',
  );

/** https URL or empty string. */
export const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https:\/\/\S+$/.test(v), 'Must start with https://');

/** https URL (required). */
export const httpsUrl = z
  .string()
  .trim()
  .max(1000)
  .regex(/^https:\/\/\S+$/, 'Must start with https://');

/** True for Google Maps embed URLs (https://www.google.com/maps/embed?...). */
export function isGoogleMapsEmbed(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname === 'www.google.com' && u.pathname.startsWith('/maps/embed');
  } catch {
    return false;
  }
}

/** Valid, parseable ISO-ish date string. */
export const isoDate = z
  .string()
  .trim()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date');

/** Kebab-case slug. */
export const slug = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only');

/** Short non-empty identifier. */
export const id = z.string().trim().min(1).max(64);

/** Star rating 1–5 in half-star steps. */
export const rating = z
  .number()
  .min(1, 'Minimum rating is 1')
  .max(5, 'Maximum rating is 5')
  .refine((v) => Number.isInteger(v * 2), 'Rating must be in half-star steps');

/** Phone numbers may still contain "X" while placeholders are in use. */
export const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9X][0-9X\s-]{6,18}$/, 'Enter a valid phone number');

export const hero = z.object({
  title: required(120),
  subtitle: required(300),
  image: mediaPath,
  imageAlt: text(200),
});

export const feature = z.object({
  icon: iconName,
  title: required(120),
  text: text(300).optional(),
});

export const statItem = z.object({
  icon: iconName,
  title: required(80),
  subtitle: text(120),
});

/** Add a custom refinement so a list must have unique values for `key`. */
export function uniqueBy<T>(items: T[], key: (item: T) => string): boolean {
  const seen = new Set<string>();
  for (const item of items) {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
  }
  return true;
}
