'use client';

import { useEffect } from 'react';

/**
 * Sets the language and font class on <html> while an Odia page is open (the `lang` on the page wrapper already
 * covers the content; this also covers dialogs and other pop-ups, which are drawn outside that wrapper).
 */
export function HtmlLang({ lang, className }: { lang: string; className: string }) {
  useEffect(() => {
    const el = document.documentElement;
    const previous = el.lang;
    const classes = className.split(' ').filter(Boolean);
    el.lang = lang;
    el.classList.add(...classes);
    return () => {
      el.lang = previous;
      el.classList.remove(...classes);
    };
  }, [lang, className]);
  return null;
}
