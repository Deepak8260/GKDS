/**
 * Login brute-force protection (in-memory, best-effort on serverless like the other limiters):
 * - progressive delay after each failure (0.5 s, 1 s, 2 s, 4 s, then 4 s),
 * - 15-minute lockout after 5 failures from one IP,
 * - a global cap of 30 failures per hour across all IPs.
 */

export const MAX_FAILURES = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;
export const GLOBAL_MAX_PER_HOUR = 30;
const HOUR = 60 * 60 * 1000;

interface Entry {
  failures: number;
  lockedUntil: number;
}

export interface Throttle {
  /** Seconds the caller must wait, or 0 if an attempt is allowed. */
  blockedFor(ip: string, now?: number): number;
  /** Record a failed attempt; returns the delay (ms) to apply before answering. */
  fail(ip: string, now?: number): number;
  succeed(ip: string): void;
  reset(): void;
}

export function delayForFailure(n: number): number {
  return Math.min(500 * 2 ** (n - 1), 4000);
}

export function createThrottle(): Throttle {
  const entries = new Map<string, Entry>();
  let globalFails: number[] = [];

  return {
    blockedFor(ip, now = Date.now()) {
      globalFails = globalFails.filter((t) => t > now - HOUR);
      if (globalFails.length >= GLOBAL_MAX_PER_HOUR) {
        return Math.max(1, Math.ceil((globalFails[0] + HOUR - now) / 1000));
      }
      const e = entries.get(ip);
      if (e && e.lockedUntil > now) return Math.ceil((e.lockedUntil - now) / 1000);
      return 0;
    },
    fail(ip, now = Date.now()) {
      globalFails.push(now);
      const e = entries.get(ip) ?? { failures: 0, lockedUntil: 0 };
      e.failures += 1;
      const delay = delayForFailure(e.failures);
      if (e.failures >= MAX_FAILURES) {
        e.lockedUntil = now + LOCKOUT_MS;
        e.failures = 0;
      }
      entries.set(ip, e);
      return delay;
    },
    succeed(ip) {
      entries.delete(ip);
    },
    reset() {
      entries.clear();
      globalFails = [];
    },
  };
}

/** Shared by the login route and the "change code" route. */
export const loginThrottle = createThrottle();
