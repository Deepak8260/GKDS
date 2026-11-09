import { z } from 'zod';
import {
  httpsUrl,
  isGoogleMapsEmbed,
  mediaPath,
  optionalUrl,
  phone,
  required,
  text,
} from './common';

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM (24-hour)');

export const siteSchema = z
  .object({
    name: required(120),
    shortName: required(60),
    tagline: required(160),
    regNo: required(80),
    logo: mediaPath,
    favicon: mediaPath,
    ogImage: mediaPath,
    phones: z.array(phone).min(1, 'Add at least one phone number').max(4),
    whatsapp: z
      .string()
      .trim()
      .regex(/^[0-9X]{10,15}$/, 'Digits only, including country code (e.g. 919876543210)'),
    whatsappMessage: required(300),
    callCardText: required(300),
    email: z.email('Enter a valid email address').max(120),
    address: z.object({
      line1: required(120),
      line2: text(120).optional(),
      city: required(60),
      state: required(60),
      pin: z
        .string()
        .trim()
        .regex(/^\d{6}$/, 'PIN must be 6 digits'),
      landmark: text(120).optional(),
    }),
    hours: z
      .array(z.object({ label: required(40), value: required(60) }))
      .min(1)
      .max(7),
    /** 0 = Sunday … 6 = Saturday. Used by the Open/Closed badge (IST). */
    openDays: z.array(z.number().int().min(0).max(6)).max(7),
    openFrom: timeOfDay,
    openTo: timeOfDay,
    /** Days with different hours from the default (e.g. Sunday opens later): [{ day: 0, from, to }]. */
    dayHours: z
      .array(z.object({ day: z.number().int().min(0).max(6), from: timeOfDay, to: timeOfDay }))
      .max(7)
      .optional(),
    social: z.object({
      youtube: optionalUrl.optional(),
      facebook: optionalUrl.optional(),
      instagram: optionalUrl.optional(),
    }),
    map: z.object({
      embedUrl: z
        .string()
        .trim()
        .max(2000)
        .refine(
          isGoogleMapsEmbed,
          'Use the Google Maps "Embed a map" link (https://www.google.com/maps/embed?…)',
        ),
      directionsUrl: httpsUrl,
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
    }),
    seo: z.object({
      title: required(120),
      description: required(200),
      keywords: z.array(text(60)).max(20).optional(),
    }),
    stats: z.object({
      sinceYear: z.number().int().min(1900).max(2100),
      yearsLabel: required(40),
      trainedDrivers: required(40),
      successRateLabel: required(60),
      rating: z.number().min(0).max(5),
      ratingCount: required(40),
      recommendPercent: z.number().min(0).max(100),
    }),
  })
  .refine((v) => v.openFrom < v.openTo, {
    path: ['openTo'],
    message: 'Closing time must be after the opening time',
  })
  .refine((v) => (v.dayHours ?? []).every((d) => d.from < d.to), {
    path: ['dayHours'],
    message: 'On each special day, closing must be after opening',
  });

export type Site = z.infer<typeof siteSchema>;
