import { createRateLimiter } from './rate-limit';

const HOUR = 60 * 60 * 1000;

/** Public review form limits (best-effort on serverless; see lib/rate-limit.ts). */
export const reviewLimits = {
  /** 3 submissions per hour per visitor (hashed IP). */
  perIp: createRateLimiter({ windowMs: HOUR, max: 3 }),
  /** 30 submissions per hour across all visitors. */
  global: createRateLimiter({ windowMs: HOUR, max: 30 }),
};
