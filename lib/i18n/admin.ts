import { entrySource, entryText, type Overlay } from './overlay';
import { isTranslatablePath, listTranslatable, type TranslationDoc } from './translatable';

/** One line of the admin "Translations" table. */
export interface TranslationRow {
  path: string;
  /** The English text (read-only). */
  en: string;
  /** The Odia text the website shows right now (empty = not translated: visitors see the English text). */
  or: string;
  /** Where the Odia text comes from. */
  source: 'saved' | 'built-in' | 'none';
  /** The English was edited after this was translated. */
  stale: boolean;
}

/**
 * Rows for one document: every translatable English string with its current Odia text.
 * `seed` = the translations that ship with the website, `saved` = the ones saved in the admin (they win).
 */
export function buildRows(doc: TranslationDoc, english: unknown, seed: Overlay, saved: Overlay): TranslationRow[] {
  return listTranslatable(doc, english).map(({ path, text }) => {
    const s = saved[path];
    if (s !== undefined) {
      const src = entrySource(s);
      return { path, en: text, or: entryText(s), source: 'saved' as const, stale: src !== undefined && src !== text };
    }
    const b = seed[path];
    if (b !== undefined) return { path, en: text, or: entryText(b), source: 'built-in' as const, stale: false };
    return { path, en: text, or: '', source: 'none' as const, stale: false };
  });
}

export const MAX_TRANSLATION_LENGTH = 2000;

export type SubmitResult = { ok: true; overlay: Overlay } | { ok: false; message: string };

/**
 * Check what the admin sent and turn it into the file to save: only translatable paths of the English document,
 * plain text up to 2000 characters, empty boxes dropped. Each entry remembers the English text it translates,
 * so the table can warn later if the English is changed.
 */
export function buildSavedOverlay(doc: TranslationDoc, english: unknown, submitted: unknown): SubmitResult {
  if (!submitted || typeof submitted !== 'object' || Array.isArray(submitted)) return { ok: false, message: 'Invalid translations.' };
  const sources = new Map(listTranslatable(doc, english).map((s) => [s.path, s.text]));
  const overlay: Overlay = {};
  for (const [path, value] of Object.entries(submitted as Record<string, unknown>)) {
    if (typeof value !== 'string') return { ok: false, message: 'Invalid translations.' };
    const text = value.trim();
    if (!text) continue;
    if (!isTranslatablePath(doc, path) || !sources.has(path)) return { ok: false, message: `“${path}” cannot be translated.` };
    if (text.length > MAX_TRANSLATION_LENGTH) return { ok: false, message: `The translation of “${path}” is too long (at most ${MAX_TRANSLATION_LENGTH} characters).` };
    // control characters have no business in a translation
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) return { ok: false, message: `The translation of “${path}” contains characters that are not allowed.` };
    overlay[path] = { t: text, s: sources.get(path)! };
  }
  return { ok: true, overlay };
}

/** "courses.0.features.2" → "Courses › item 1 › Features › item 3" (a readable label for a row). */
export function pathLabel(path: string): string {
  const words = (s: string) => s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
  return path
    .split('.')
    .map((p) => (/^\d+$/.test(p) ? `#${Number(p) + 1}` : words(p)))
    .join(' › ');
}
