/** The two languages of the public website. English lives at the normal addresses, Odia under /or. */

export const LOCALES = ['en', 'or'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Cookie remembering the visitor's choice (read by the proxy to send Odia readers to the Odia pages). */
export const LANG_COOKIE = 'gkds_lang';
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const isLocale = (value: unknown): value is Locale => value === 'en' || value === 'or';

/** BCP-47 tag for the `lang` attribute and structured data. */
export const LANG_TAG: Record<Locale, string> = { en: 'en-IN', or: 'or-IN' };
/** Open Graph locale. */
export const OG_LOCALE: Record<Locale, string> = { en: 'en_IN', or: 'or_IN' };

const ODIA_PREFIX = '/or';

/** Which language does this URL path belong to? ("/or", "/or/about" → or; everything else → en) */
export function localeOfPath(pathname: string): Locale {
  return pathname === ODIA_PREFIX || pathname.startsWith(`${ODIA_PREFIX}/`) ? 'or' : 'en';
}

/** "/or/about" → "/about", "/or" → "/", "/about" → "/about" (hash and query are kept). */
export function stripLocale(path: string): string {
  const m = /^\/or(?=$|[/?#])(.*)$/.exec(path);
  if (!m) return path;
  const rest = m[1];
  return rest === '' || rest.startsWith('?') || rest.startsWith('#') ? `/${rest}` : rest;
}

/**
 * The same page in `locale`: "/courses#car-driving" → "/or/courses#car-driving"; "/" → "/or".
 * External links, mailto:, tel: and #anchors on the same page are returned unchanged.
 */
export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const english = stripLocale(path);
  if (locale === 'en') return english;
  if (english === '/') return ODIA_PREFIX;
  if (english.startsWith('/?') || english.startsWith('/#')) return `${ODIA_PREFIX}${english.slice(1)}`;
  return `${ODIA_PREFIX}${english}`;
}

/** The link that switches the current page to the other language. */
export function alternatePath(pathname: string, target: Locale): string {
  return localizePath(pathname, target);
}

/** Replace {name} placeholders: fmt("Based on {n} reviews", { n: 3 }). */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (key in vars ? String(vars[key]) : `{${key}}`));
}
