/**
 * When the website cache was last refreshed from the admin panel. Kept in memory, so on a serverless host it
 * only reflects this server instance (good enough for the Help page; the refresh itself is global).
 */
let last: string | null = null;

export function markRevalidated(now = new Date()): string {
  last = now.toISOString();
  return last;
}

export function lastRevalidated(): string | null {
  return last;
}
