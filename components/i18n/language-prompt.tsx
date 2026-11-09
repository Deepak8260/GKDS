'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { rememberLocale, savedLocale } from './lang-preference';
import { useLocale } from './locale-context';

const Dialog = dynamic(() => import('./language-prompt-dialog'), { ssr: false });

/** Browsers we never interrupt: search engines, speed tests and automated browsers. */
const NO_PROMPT_UA = /bot|crawl|spider|slurp|lighthouse|headless|pagespeed|gtmetrix/i;

/**
 * First-visit language question. A new visitor on the English site is asked once whether to switch to Odia.
 * Someone who arrives on an Odia address (a shared link) is not asked: that already says what they want.
 * The answer is remembered in a cookie, so the question is not repeated.
 */
export function LanguagePrompt() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (savedLocale()) return;
    if (locale === 'or') {
      rememberLocale('or');
      return;
    }
    if (NO_PROMPT_UA.test(navigator.userAgent) || navigator.webdriver) return;
    // wait a moment so the page is on screen before the question appears
    const timer = window.setTimeout(() => setOpen(true), 1500);
    return () => window.clearTimeout(timer);
  }, [locale]);

  return open ? <Dialog onClose={() => setOpen(false)} /> : null;
}
