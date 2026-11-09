/**
 * Short, readable "what would change" list between two JSON values (the History and Backup previews).
 * Arrays of objects are compared by position; long values are cut off.
 */

export interface Change {
  path: string;
  from: string;
  to: string;
}

const MAX_VALUE = 80;

function show(v: unknown): string {
  if (v === undefined) return '(not set)';
  if (typeof v === 'string') return v.length > MAX_VALUE ? `${v.slice(0, MAX_VALUE)}…` : v === '' ? '(empty)' : v;
  const s = JSON.stringify(v);
  return s.length > MAX_VALUE ? `${s.slice(0, MAX_VALUE)}…` : s;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function walk(a: unknown, b: unknown, path: string, out: Change[], limit: number) {
  if (out.length >= limit) return;
  if (Array.isArray(a) && Array.isArray(b)) {
    const n = Math.max(a.length, b.length);
    if (a.length !== b.length) out.push({ path: `${path} (items)`, from: String(a.length), to: String(b.length) });
    for (let i = 0; i < n; i++) walk(a[i], b[i], path ? `${path}.${i}` : String(i), out, limit);
    return;
  }
  if (isObject(a) && isObject(b)) {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[key], b[key], path ? `${path}.${key}` : key, out, limit);
    return;
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ path, from: show(a), to: show(b) });
}

/** Every changed path with old → new values (at most `limit`; `truncated` says if there were more). */
export function diffSummary(from: unknown, to: unknown, limit = 40): { changes: Change[]; total: number; truncated: boolean } {
  const all: Change[] = [];
  walk(from, to, '', all, Number.MAX_SAFE_INTEGER);
  return { changes: all.slice(0, limit), total: all.length, truncated: all.length > limit };
}
