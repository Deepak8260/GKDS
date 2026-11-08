'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';

/**
 * Unsaved-changes guard. Editors call `useDirtyGuard(isDirty)`; the browser warns on reload/close
 * (beforeunload), and the sidebar/top-bar links ask `confirmLeave()` before navigating inside the panel.
 */
interface GuardApi {
  setDirty: (dirty: boolean) => void;
  /** True when it is OK to leave (clean, or the user agreed to discard). */
  confirmLeave: () => boolean;
}

const GuardContext = createContext<GuardApi | null>(null);

export function DirtyGuardProvider({ children }: { children: ReactNode }) {
  const dirty = useRef(false);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const setDirty = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);
  const confirmLeave = useCallback(() => {
    if (!dirty.current) return true;
    const leave = window.confirm('You have unsaved changes. Leave this page and discard them?');
    if (leave) dirty.current = false;
    return leave;
  }, []);

  const api = useMemo(() => ({ setDirty, confirmLeave }), [setDirty, confirmLeave]);
  return <GuardContext.Provider value={api}>{children}</GuardContext.Provider>;
}

export function useDirtyGuardApi(): GuardApi {
  const ctx = useContext(GuardContext);
  if (!ctx) throw new Error('useDirtyGuardApi must be used inside <DirtyGuardProvider>');
  return ctx;
}

/** Register whether the current editor has unsaved changes. */
export function useDirtyGuard(isDirty: boolean) {
  const { setDirty } = useDirtyGuardApi();
  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);
}
