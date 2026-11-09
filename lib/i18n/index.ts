import { en, type Dict } from './dict';
import { or } from './dict-or';
import type { Locale } from './locales';

export * from './locales';
export type { Dict } from './dict';

const DICTS: Record<Locale, Dict> = { en, or };

/** The interface texts for a language (plain object, no network). Use only in server components. */
export const tFor = (locale: Locale): Dict => DICTS[locale];
