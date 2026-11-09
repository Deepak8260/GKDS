'use client';

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';
import { useScrollLock } from '@/lib/hooks/use-scroll-lock';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Screen-reader name of the close button (default English). */
  closeLabel?: string;
  /** Render the content edge-to-edge with a floating close button; the title stays for screen readers only. */
  bare?: boolean;
}

/**
 * Accessible dialog: focus trap, ESC, overlay click, scroll lock,
 * focus returns to the opener on close, `aria-modal`.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  bare,
  closeLabel = 'Close dialog',
}: ModalProps) {
  // true only on the client, so the portal is never rendered during SSR/hydration
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useScrollLock(open);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-green-950/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-card-lg sm:max-w-lg sm:rounded-2xl',
          className,
        )}
      >
        {bare ? (
          <>
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="sr-only">
                {description}
              </p>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="focus-ring absolute right-4 top-4 z-20 flex size-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-card hover:bg-white"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <div className="overflow-y-auto">{children}</div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <div>
                <h2 id={titleId} className="font-display text-xl font-bold italic text-green-900">
                  {title}
                </h2>
                {description ? (
                  <p id={descId} className="mt-1 text-sm text-muted">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="focus-ring -mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-ink/70 hover:bg-green-50"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
