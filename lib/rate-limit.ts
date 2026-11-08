import { createHash } from 'node:crypto';

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the oldest hit leaves the window (0 when allowed). */
  retryAfterSec: number;
  remaining: number;
}

export interface RateLimiter {
  /** Record a hit for `key` if it is under the limit. */
  check(key: string, now?: number): RateLimitResult;
  reset(): void;
}

/**
 * In-memory sliding-window rate limiter.
 *
 * NOTE: on serverless platforms (Vercel) every function instance has its own memory and instances come
 * and go, so this is BEST-EFFORT abuse protection, not a guarantee. It stops casual spam and
 * accidental double posts; the admin approval step is the real safeguard against bad content.
 */
export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }): RateLimiter {
  const hits = new Map<string, number[]>();

  function prune(now: number) {
    if (hits.size < 2000) return;
    for (const [key, times] of hits) {
      if (times.every((t) => t <= now - windowMs)) hits.delete(key);
    }
  }

  return {
    check(key, now = Date.now()) {
      prune(now);
      const recent = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
      if (recent.length >= max) {
        hits.set(key, recent);
        return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)), remaining: 0 };
      }
      recent.push(now);
      hits.set(key, recent);
      return { allowed: true, retryAfterSec: 0, remaining: max - recent.length };
    },
    reset() {
      hits.clear();
    },
  };
}

/** Short, non-reversible id for an IP address (never store raw IPs). */
export function hashIp(ip: string): string {
  return createHash('sha256').update(`gkds:${ip}`).digest('hex').slice(0, 16);
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim() || 'unknown';
  return headers.get('x-real-ip')?.trim() || 'unknown';
}
