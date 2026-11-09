import { LANG_COOKIE, LANG_COOKIE_MAX_AGE, type Locale } from '@/lib/i18n/locales';

/** Remember the visitor's language (cookie, so the server can send returning Odia readers to the Odia pages). */
export function rememberLocale(locale: Locale): void {
  try {
    document.cookie = `${LANG_COOKIE}=${locale}; Max-Age=${LANG_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
  } catch {
    /* cookies blocked: the choice just is not remembered */
  }
}

export function savedLocale(): Locale | null {
  try {
    const m = new RegExp(`(?:^|; )${LANG_COOKIE}=(en|or)(?:;|$)`).exec(document.cookie);
    return m ? (m[1] as Locale) : null;
  } catch {
    return null;
  }
}
