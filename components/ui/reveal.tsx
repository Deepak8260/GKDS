'use client';

import { useEffect, useRef, type ComponentPropsWithoutRef, type ElementType } from 'react';
import { cn } from '@/lib/utils';

type RevealProps<T extends ElementType> = { as?: T } & Omit<ComponentPropsWithoutRef<T>, 'as'>;

/* ---- shared scheduler: all layout reads happen first, then all writes (avoids forced reflows) ---- */
const pending = new Set<HTMLElement>();
let scheduled = false;
let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.remove('reveal-hidden');
          observer?.unobserve(el);
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -6% 0px' },
    );
  }
  return observer;
}

function flush() {
  scheduled = false;
  const els = Array.from(pending);
  pending.clear();
  const limit = window.innerHeight * 0.92;
  // 1) read
  const below = els.map((el) => el.getBoundingClientRect().top >= limit);
  // 2) write
  const io = getObserver();
  els.forEach((el, i) => {
    if (!below[i] || !el.isConnected) return;
    el.classList.add('reveal-hidden');
    io.observe(el);
  });
}

/**
 * Fades its content up once, the first time it scrolls into view.
 * Content is fully visible by default (no JS, crawlers, print, reduced motion);
 * only blocks that start below the fold are hidden after hydration and revealed on scroll.
 */
export function Reveal<T extends ElementType = 'div'>({ as, className, ...rest }: RevealProps<T>) {
  const Tag: ElementType = as ?? 'div';
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    pending.add(el);
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
    return () => {
      pending.delete(el);
      observer?.unobserve(el);
    };
  }, []);

  return <Tag ref={ref} className={cn('reveal', className)} {...rest} />;
}
