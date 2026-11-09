'use client';

import { SafeImage as Image } from '@/components/ui/safe-image';
import { useEffect, useRef, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { mediaUrl } from '@/lib/media';
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';
import { useScrollLock } from '@/lib/hooks/use-scroll-lock';
import type { Dict } from '@/lib/i18n/dict';
import type { GalleryItem } from '@/lib/validators';
import { swipeDirection, wrapIndex } from './gallery-utils';

interface LightboxProps {
  /** The currently filtered list; navigation never leaves it. */
  items: GalleryItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  t: Dict['gallery'];
}

const navButton =
  'focus-ring absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30';

/**
 * Full-screen photo viewer (no library): close (Esc / button / tap outside), previous/next
 * (buttons, ← →, Home/End, swipe), focus trap + focus restore, scroll lock, counter and caption.
 * The previous and next photos are preloaded.
 */
export default function Lightbox({ items, index, onIndexChange, onClose, t }: LightboxProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const count = items.length;
  const item = items[index];

  useScrollLock(true);
  useFocusTrap(panelRef, true);

  const go = (delta: number) => onIndexChange(wrapIndex(index + delta, count));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onIndexChange(wrapIndex(index + 1, count));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onIndexChange(wrapIndex(index - 1, count));
      } else if (e.key === 'Home') {
        e.preventDefault();
        onIndexChange(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        onIndexChange(count - 1);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, count, onClose, onIndexChange]);

  if (!item) return null;

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    startX.current = e.clientX;
  }
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    const dir = swipeDirection(e.clientX - startX.current);
    startX.current = null;
    if (dir !== 0) go(dir);
  }

  const prev = count > 1 ? items[wrapIndex(index - 1, count)] : null;
  const next = count > 1 ? items[wrapIndex(index + 1, count)] : null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={t.viewer}
      tabIndex={-1}
      className="fixed inset-0 z-[120] flex animate-fade-in flex-col bg-black/90"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p aria-live="polite" className="text-sm font-semibold tabular-nums">
          {index + 1} / {count}
        </p>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          aria-label={t.closeViewer}
          className="focus-ring flex size-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/30"
        >
          <X className="size-6" aria-hidden="true" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-3 sm:px-20"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (startX.current = null)}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {count > 1 ? (
          <button type="button" onClick={() => go(-1)} aria-label={t.previous} className={`${navButton} left-2 sm:left-5`}>
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>
        ) : null}

        <div className="relative h-full w-full max-w-5xl">
          <Image
            key={item.id}
            src={mediaUrl(item.src)}
            alt={item.alt}
            fill
            sizes="100vw"
            className="object-contain"
            draggable={false}
          />
        </div>

        {count > 1 ? (
          <button type="button" onClick={() => go(1)} aria-label={t.next} className={`${navButton} right-2 sm:right-5`}>
            <ChevronRight className="size-6" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <p className="px-6 pb-5 pt-3 text-center text-sm text-white/90 sm:text-base">{item.alt}</p>

      {/* preload the neighbours (same `sizes`, so the browser reuses the cached file when navigating) */}
      <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 size-px overflow-hidden opacity-0">
        {[prev, next].map((n) =>
          n && n.id !== item.id ? (
            <div key={n.id} className="relative size-px">
              <Image src={mediaUrl(n.src)} alt="" fill sizes="100vw" loading="eager" />
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
