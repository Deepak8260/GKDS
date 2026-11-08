'use client';

import { useEffect } from 'react';

/**
 * Briefly rings the course card a link points at (`/courses#car-driving`).
 * CSS `:target` already does this on a full page load; but client-side navigation (the header
 * dropdown, links from other pages) changes the URL without updating `:target`, so this fills the gap.
 * Renders nothing.
 */
export function AnchorFlash() {
  useEffect(() => {
    let timer: number | undefined;

    function flash(hash: string) {
      const id = decodeURIComponent(hash.replace(/^#/, ''));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el || !el.classList.contains('target-highlight')) return;
      window.clearTimeout(timer);
      el.removeAttribute('data-flash');
      void el.offsetWidth; // restart the animation if it is already running
      el.setAttribute('data-flash', 'true');
      timer = window.setTimeout(() => el.removeAttribute('data-flash'), 2600);
    }

    // arriving at /courses#slug from another page (router has already set the hash)
    flash(window.location.hash);

    // clicking a link to a card on this page
    function onClick(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest?.('a[href*="#"]') as HTMLAnchorElement | null;
      if (!link) return;
      const url = new URL(link.href, window.location.href);
      if (url.pathname === window.location.pathname) window.setTimeout(() => flash(url.hash), 30);
    }
    const onHashChange = () => flash(window.location.hash);

    document.addEventListener('click', onClick);
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('click', onClick);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  return null;
}
