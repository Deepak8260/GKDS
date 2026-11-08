'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions. */
  danger?: boolean;
  /** The user must type this text before the confirm button enables (e.g. the item's name). */
  typeToConfirm?: string;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Promise-based confirm dialog: `if (await confirm({ title: 'Delete course?' })) …` */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const [typed, setTyped] = useState('');
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setTyped('');
    setState(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setState(null);
  }, []);

  const api = useMemo(() => confirm, [confirm]);
  const blocked = Boolean(state?.typeToConfirm) && typed.trim() !== state?.typeToConfirm;

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      <Modal open={state !== null} onClose={() => settle(false)} title={state?.title ?? ''} description={state?.message}>
        {state?.typeToConfirm ? (
          <label className="mb-4 block text-sm font-medium text-ink">
            Type <strong>{state.typeToConfirm}</strong> to confirm
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="focus-ring mt-1.5 block h-11 w-full rounded-lg border border-line px-3"
            />
          </label>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={() => settle(false)}>
            {state?.cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            size="sm"
            disabled={blocked}
            onClick={() => settle(true)}
            className={state?.danger ? '!bg-red-600 !bg-none hover:!bg-red-700' : undefined}
          >
            {state?.confirmLabel ?? 'Confirm'}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}
