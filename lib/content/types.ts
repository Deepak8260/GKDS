/**
 * Temporary content types for prompt 01 (subset of CONTEXT BLOCK §8).
 * Prompt 02 replaces these with zod-inferred types from lib/validators.
 */
export type IconName = string;
export type MediaPath = string;

export interface Site {
  name: string;
  shortName: string;
  tagline: string;
  regNo: string;
  logo: MediaPath;
  favicon: MediaPath;
  ogImage: MediaPath;
  phones: string[];
  whatsapp: string;
  whatsappMessage: string;
  callCardText: string;
  email: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pin: string;
    landmark?: string;
  };
  hours: { label: string; value: string }[];
  openDays: number[];
  openFrom: string;
  openTo: string;
  social: { youtube?: string; facebook?: string; instagram?: string };
  map: { embedUrl: string; directionsUrl: string; lat?: number; lng?: number };
  seo: { title: string; description: string; keywords?: string[] };
  stats: {
    sinceYear: number;
    yearsLabel: string;
    trainedDrivers: string;
    successRateLabel: string;
    rating: number;
    ratingCount: string;
    recommendPercent: number;
  };
}

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

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  vehicle: string;
  image: MediaPath;
  imageAlt: string;
  features: string[];
  order: number;
  published: boolean;
}

export interface Courses {
  hero: Hero;
  intro: { lead: string; highlight: string; subtitle: string };
  courses: Course[];
  includedTitle: string;
  included: Feature[];
  highlights: { lead: string; highlight: string; image: MediaPath; imageAlt: string; items: string[] };
  cta: { lead: string; highlight: string; text: string };
}
