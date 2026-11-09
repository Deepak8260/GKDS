import type { ContentName } from '@/lib/validators';

/**
 * Which text of each content document can have an Odia translation. Everything not listed here (pictures, links,
 * phone numbers, times, ids, ratings, visitors' reviews) is shared by both languages.
 * "*" stands for a list position.
 */
export const TRANSLATABLE: Record<ContentName, string[]> = {
  site: [
    'name', 'shortName', 'tagline', 'regNo', 'whatsappMessage', 'callCardText',
    'address.line1', 'address.line2', 'address.city', 'address.state', 'address.landmark',
    'hours.*.label', 'hours.*.value',
    'seo.title', 'seo.description', 'seo.keywords.*',
    'stats.yearsLabel', 'stats.trainedDrivers', 'stats.successRateLabel', 'stats.ratingCount',
  ],
  home: [
    'hero.eyebrow', 'hero.titleLead', 'hero.titleHighlight', 'hero.subtitle', 'hero.imageAlt', 'hero.primaryCta', 'hero.secondaryCta',
    'trustBar.*.title', 'trustBar.*.text',
    'aboutTeaser.eyebrow', 'aboutTeaser.title', 'aboutTeaser.body', 'aboutTeaser.imageAlt',
    'aboutTeaser.stats.*.title', 'aboutTeaser.stats.*.subtitle',
    'whyChoose.eyebrow', 'whyChoose.lead', 'whyChoose.highlight', 'whyChoose.items.*.title', 'whyChoose.items.*.text',
    'coursesIntro.eyebrow', 'coursesIntro.lead', 'coursesIntro.highlight', 'coursesIntro.subtitle',
    'journey.eyebrow', 'journey.lead', 'journey.highlight', 'journey.steps.*.title', 'journey.steps.*.text',
    'reviewsIntro.eyebrow', 'reviewsIntro.title',
    'contactTeaser.eyebrow', 'contactTeaser.title', 'contactTeaser.body',
  ],
  about: [
    'hero.title', 'hero.subtitle', 'hero.imageAlt',
    'story.eyebrow', 'story.titleLead', 'story.titleHighlight', 'story.paragraphs.*', 'story.imageAlt',
    'stats.*.title', 'stats.*.subtitle',
    'missionVisionTitle', 'mission.title', 'mission.text', 'vision.title', 'vision.text',
    'valuesTitle', 'values.*.title', 'values.*.text',
  ],
  courses: [
    'hero.title', 'hero.subtitle', 'hero.imageAlt',
    'intro.lead', 'intro.highlight', 'intro.subtitle',
    'courses.*.title', 'courses.*.description', 'courses.*.vehicle', 'courses.*.imageAlt', 'courses.*.features.*',
    'includedTitle', 'included.*.title',
    'highlights.lead', 'highlights.highlight', 'highlights.imageAlt', 'highlights.items.*',
    'cta.lead', 'cta.highlight', 'cta.text',
  ],
  gallery: ['hero.title', 'hero.subtitle', 'hero.imageAlt', 'titleLead', 'titleHighlight', 'categories.*.label', 'items.*.alt'],
  reviews: ['hero.title', 'hero.subtitle', 'hero.imageAlt', 'titleLead', 'titleHighlight', 'ctaTitleLead', 'ctaTitleHighlight', 'ctaText'],
};

/** The interface texts that live in the code (buttons, labels, messages). All of them can be translated. */
export type TranslationDoc = ContentName | 'ui';
export const TRANSLATION_DOCS: TranslationDoc[] = ['site', 'home', 'about', 'courses', 'gallery', 'reviews', 'ui'];
export const isTranslationDoc = (v: string): v is TranslationDoc => (TRANSLATION_DOCS as string[]).includes(v);

const compiled = new Map<string, RegExp[]>();
function regexesFor(doc: ContentName): RegExp[] {
  let list = compiled.get(doc);
  if (!list) {
    list = TRANSLATABLE[doc].map((p) => new RegExp(`^${p.split('.').map((s) => (s === '*' ? '\\d+' : s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('\\.')}$`));
    compiled.set(doc, list);
  }
  return list;
}

/** May `path` of this document carry a translation? (Dictionary paths are always allowed.) */
export function isTranslatablePath(doc: TranslationDoc, path: string): boolean {
  if (doc === 'ui') return /^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)+$/.test(path);
  return regexesFor(doc).some((re) => re.test(path));
}

export interface TranslatableString {
  path: string;
  text: string;
}

/** Every translatable string of a document, in reading order (empty strings are skipped). */
export function listTranslatable(doc: TranslationDoc, value: unknown): TranslatableString[] {
  const out: TranslatableString[] = [];
  const walk = (v: unknown, trail: string[]) => {
    if (typeof v === 'string') {
      const path = trail.join('.');
      if (v.trim() && isTranslatablePath(doc, path)) out.push({ path, text: v });
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, [...trail, String(i)]));
    } else if (v && typeof v === 'object') {
      for (const [k, item] of Object.entries(v)) walk(item, [...trail, k]);
    }
  };
  walk(value, []);
  return out;
}
