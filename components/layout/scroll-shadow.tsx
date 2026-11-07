'use client';

import { useEffect } from 'react';

/** Toggles `data-scrolled` on the element with the given id so the header can gain a shadow. */
export function ScrollShadow({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const update = () => el.setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false');
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [targetId]);
  return null;
}
