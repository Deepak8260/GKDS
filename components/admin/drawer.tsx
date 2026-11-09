'use client';

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';
import { useScrollLock } from '@/lib/hooks/use-scroll-lock';

interface DrawerProps {
  open: boolean;
  title: string;
  description?: string;
  /** Called for Esc, the backdrop, the close button and Cancel. */
  onCancel: () => void;
  /** Called for the primary button. */
  onDone: () => void;
  doneLabel?: string;
  /** Hide the Cancel button (read-only drawers just have Close). */
  hideCancel?: boolean;
  children: ReactNode;
}

/**
 * Side drawer for editing one item (full screen on phones). Focus is trapped inside while open and
 * returns to the opener on close. "Cancel" and "Done" are explicit so the caller can undo or keep the edits.
 */
export function Drawer({ open, title, description, onCancel, onDone, doneLabel = 'Done', hideCancel, children }: DrawerProps) {
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
        onCancel();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-green-950/50" onClick={onCancel} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className="relative z-10 flex h-full w-full flex-col bg-cream shadow-card-lg sm:max-w-[640px]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-xl font-bold text-green-900">
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
            onClick={onCancel}
            aria-label="Close without applying"
            className="focus-ring -mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-ink/70 hover:bg-green-50"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">{children}</div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-line bg-white px-5 py-3">
          {hideCancel ? null : (
            <Button variant="secondary" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button size="sm" onClick={onDone}>
            {doneLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
