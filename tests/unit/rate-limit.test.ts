import { describe, expect, it } from 'vitest';
import { clientIp, createRateLimiter, hashIp } from '@/lib/rate-limit';

const HOUR = 60 * 60 * 1000;

describe('createRateLimiter (sliding window)', () => {
  it('allows up to max hits then blocks', () => {
    const rl = createRateLimiter({ windowMs: HOUR, max: 3 });
    const t = 1_000_000;
    expect(rl.check('a', t)).toMatchObject({ allowed: true, remaining: 2 });
    expect(rl.check('a', t + 1)).toMatchObject({ allowed: true, remaining: 1 });
    expect(rl.check('a', t + 2)).toMatchObject({ allowed: true, remaining: 0 });
    expect(rl.check('a', t + 3).allowed).toBe(false);
  });

  it('reports when the oldest hit leaves the window (Retry-After)', () => {
    const rl = createRateLimiter({ windowMs: HOUR, max: 1 });
    const t = 5_000_000;
    rl.check('a', t);
    const blocked = rl.check('a', t + 10 * 60 * 1000); // 10 minutes later
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(50 * 60); // 50 more minutes
  });

  it('frees up as hits slide out of the window', () => {
    const rl = createRateLimiter({ windowMs: HOUR, max: 2 });
    const t = 0;
    rl.check('a', t);
    rl.check('a', t + 30 * 60 * 1000);
    expect(rl.check('a', t + 45 * 60 * 1000).allowed).toBe(false);
    // 61 minutes after the first hit: the first slid out, the second is still inside
    expect(rl.check('a', t + 61 * 60 * 1000).allowed).toBe(true);
    expect(rl.check('a', t + 62 * 60 * 1000).allowed).toBe(false);
  });

  it('does not count blocked attempts against the window', () => {
    const rl = createRateLimiter({ windowMs: HOUR, max: 1 });
    rl.check('a', 0);
    for (let i = 1; i <= 20; i++) rl.check('a', i * 1000); // 20 blocked attempts
    expect(rl.check('a', HOUR + 1).allowed).toBe(true); // frees right after the one real hit expires
  });

  it('keeps keys independent', () => {
    const rl = createRateLimiter({ windowMs: HOUR, max: 1 });
    expect(rl.check('a', 0).allowed).toBe(true);
    expect(rl.check('b', 0).allowed).toBe(true);
    expect(rl.check('a', 1).allowed).toBe(false);
  });

  it('reset clears everything', () => {
    const rl = createRateLimiter({ windowMs: HOUR, max: 1 });
    rl.check('a', 0);
    rl.reset();
    expect(rl.check('a', 1).allowed).toBe(true);
  });
});

describe('hashIp / clientIp', () => {
  it('hashes IPs consistently without exposing them', () => {
    expect(hashIp('203.0.113.7')).toBe(hashIp('203.0.113.7'));
    expect(hashIp('203.0.113.7')).not.toBe(hashIp('203.0.113.8'));
    expect(hashIp('203.0.113.7')).not.toContain('203');
    expect(hashIp('203.0.113.7')).toHaveLength(16);
  });

  it('reads the first x-forwarded-for address, then x-real-ip, then "unknown"', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7');
    expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2');
    expect(clientIp(new Headers())).toBe('unknown');
  });
});
