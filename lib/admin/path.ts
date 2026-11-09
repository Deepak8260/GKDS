/** Tiny immutable get/set for dotted paths such as "hero.title" or "trustBar.2.icon" (used by the content editors). */

export function getAt(obj: unknown, path: string): unknown {
  if (!path) return obj;
  let cur: unknown = obj;
  for (const key of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/** Returns a copy of `obj` with `value` placed at `path`. Arrays stay arrays; missing parents are created. */
export function setAt<T>(obj: T, path: string, value: unknown): T {
  if (!path) return value as T;
  const [head, ...rest] = path.split('.');
  const isIndex = /^\d+$/.test(head);
  const base: unknown = obj ?? (isIndex ? [] : {});
  const child = (base as Record<string, unknown>)[head];
  const nextChild = rest.length ? setAt(child, rest.join('.'), value) : value;
  if (Array.isArray(base)) {
    const copy = base.slice();
    copy[Number(head)] = nextChild;
    return copy as unknown as T;
  }
  return { ...(base as Record<string, unknown>), [head]: nextChild } as T;
}

/** Field errors → ordered list for the summary at the top of a form. */
export function errorList(errors: Record<string, string>): { path: string; message: string }[] {
  return Object.entries(errors).map(([path, message]) => ({ path, message }));
}

/** "trustBar.2.title" → "Trust bar › item 3 › title" (best-effort, for the error summary). */
export function prettyPath(path: string): string {
  const words = (s: string) => s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
  return path
    .split('.')
    .map((p) => (/^\d+$/.test(p) ? `item ${Number(p) + 1}` : words(p)))
    .join(' › ');
}
