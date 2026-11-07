'use client';

import { useEffect, type RefObject } from 'react';

/** Calls `onOutside` when a pointer press happens outside `ref` while `active`. */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  active = true,
) {
  useEffect(() => {
    if (!active) return;
    function handler(e: PointerEvent) {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) onOutside();
    }
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [ref, onOutside, active]);
}
