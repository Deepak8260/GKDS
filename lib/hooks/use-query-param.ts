'use client';

import { useCallback, useSyncExternalStore } from 'react';

const URL_CHANGE = 'gkds:urlchange';

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback);
  window.addEventListener(URL_CHANGE, callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener(URL_CHANGE, callback);
  };
}

/**
 * Read and write one URL query parameter (e.g. `?category=training`) without a navigation.
 *  - The server (and the first client render) see `null`, so the statically generated HTML shows the
 *    default state; right after hydration the real value from the address bar is applied.
 *  - Writing uses `history.replaceState`, so filters/sorts are shareable and refresh-safe but do not
 *    fill the back-button history.
 * Pass `null` or an empty string to remove the parameter.
 */
export function useQueryParam(name: string): [string | null, (value: string | null) => void] {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => '',
  );
  const value = new URLSearchParams(search).get(name);

  const set = useCallback(
    (next: string | null) => {
      const url = new URL(window.location.href);
      if (next === null || next === '') url.searchParams.delete(name);
      else url.searchParams.set(name, next);
      window.history.replaceState(window.history.state, '', url);
      window.dispatchEvent(new Event(URL_CHANGE));
    },
    [name],
  );

  return [value, set];
}
