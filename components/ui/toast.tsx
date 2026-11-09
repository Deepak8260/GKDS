'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}
interface ToastApi {
  toast: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Toast hook. Must be used under <ToastProvider>. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const toneStyles: Record<ToastTone, { icon: ReactNode; classes: string }> = {
  success: { icon: <CircleCheck className="size-5 text-green-700" aria-hidden="true" />, classes: 'border-green-100' },
  error: { icon: <CircleAlert className="size-5 text-red-600" aria-hidden="true" />, classes: 'border-red-200' },
  info: { icon: <Info className="size-5 text-orange-600" aria-hidden="true" />, classes: 'border-orange-100' },
};

export function ToastProvider({ children, dismissLabel = 'Dismiss notification' }: { children: ReactNode; dismissLabel?: string }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = nextId.current++;
      setItems((list) => [...list.slice(-3), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({ toast, success: (m) => toast(m, 'success'), error: (m) => toast(m, 'error') }),
    [toast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[110] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-card-lg',
              toneStyles[t.tone].classes,
            )}
          >
            {toneStyles[t.tone].icon}
            <p className="flex-1 text-sm font-medium text-ink">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label={dismissLabel}
              className="focus-ring -m-1 rounded-full p-1 text-muted hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
