import { describe, expect, it } from 'vitest';
import { codeSource, hashAccessCode, validateNewCode, verifyAccessCode } from '@/lib/auth/code';
import { adminBaseOf, safeNextPath } from '@/lib/auth/constants';
import { csrfOk } from '@/lib/auth/csrf';
import { signSession, verifySession } from '@/lib/auth/session';
import { codeStrength } from '@/lib/auth/strength';
import { GLOBAL_MAX_PER_HOUR, LOCKOUT_MS, MAX_FAILURES, createThrottle, delayForFailure } from '@/lib/auth/throttle';
import { contentNames, isContentName, type AdminConfig } from '@/lib/validators';

const ENV = { ADMIN_JWT_SECRET: 'a-very-long-test-secret-0123456789', NODE_ENV: 'test' };

describe('access code hashing', () => {
  it('verifies the right code and rejects a wrong one, with a unique salt each time', async () => {
    const a = await hashAccessCode('correct horse');
    const b = await hashAccessCode('correct horse');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    expect(Buffer.from(a.salt, 'base64')).toHaveLength(16);
    expect(Buffer.from(a.hash, 'base64')).toHaveLength(64);
    const config: AdminConfig = { ...a, updatedAt: '2026-01-01T00:00:00.000Z', sessionVersion: 1 };
    expect(await verifyAccessCode('correct horse', { config, env: {} })).toBe(true);
    expect(await verifyAccessCode('correct horsf', { config, env: {} })).toBe(false);
    expect(JSON.stringify(a)).not.toContain('correct horse');
  });
});

describe('code source precedence', () => {
  const stored = async (code: string): Promise<AdminConfig> => ({ ...(await hashAccessCode(code)), updatedAt: '2026-01-01T00:00:00.000Z', sessionVersion: 2 });

  it('uses the environment code (default gkds1993) when no config exists', async () => {
    expect(await verifyAccessCode('gkds1993', { config: null, env: {} })).toBe(true);
    expect(await verifyAccessCode('nope', { config: null, env: {} })).toBe(false);
    expect(await verifyAccessCode('custom-env', { config: null, env: { ADMIN_CODE: 'custom-env' } })).toBe(true);
    expect(await verifyAccessCode('gkds1993', { config: null, env: { ADMIN_CODE: 'custom-env' } })).toBe(false);
  });

  it('the stored hash wins over the environment code', async () => {
    const config = await stored('from-file');
    expect(codeSource(config, {})).toBe('file');
    expect(await verifyAccessCode('from-file', { config, env: { ADMIN_CODE: 'from-env' } })).toBe(true);
    expect(await verifyAccessCode('from-env', { config, env: { ADMIN_CODE: 'from-env' } })).toBe(false);
  });

  it('ADMIN_CODE_RESET=1 ignores the stored hash and accepts the environment code again', async () => {
    const config = await stored('from-file');
    const env = { ADMIN_CODE: 'from-env', ADMIN_CODE_RESET: '1' };
    expect(codeSource(config, env)).toBe('env');
    expect(await verifyAccessCode('from-env', { config, env })).toBe(true);
    expect(await verifyAccessCode('from-file', { config, env })).toBe(false);
  });

  it('an empty stored hash (sign-out-everywhere before any code change) keeps the environment code', async () => {
    const config: AdminConfig = { hash: '', salt: '', updatedAt: '2026-01-01T00:00:00.000Z', sessionVersion: 1 };
    expect(codeSource(config, {})).toBe('env');
    expect(await verifyAccessCode('gkds1993', { config, env: {} })).toBe(true);
  });

  it('rejects empty and absurdly long input', async () => {
    expect(await verifyAccessCode('', { config: null, env: {} })).toBe(false);
    expect(await verifyAccessCode('x'.repeat(500), { config: null, env: {} })).toBe(false);
  });
});

describe('new code rules and strength', () => {
  it('accepts 4–64 characters of anything', () => {
    expect(validateNewCode('abc').ok).toBe(false);
    expect(validateNewCode('abcd').ok).toBe(true);
    expect(validateNewCode('पास वर्ड ✓ 123').ok).toBe(true);
    expect(validateNewCode('x'.repeat(64)).ok).toBe(true);
    expect(validateNewCode('x'.repeat(65)).ok).toBe(false);
  });
  it('warns (never blocks) for short digit-only codes', () => {
    expect(codeStrength('1234').warning).toMatch(/digits-only/i);
    expect(codeStrength('abc').label).toBe('Too short');
    expect(codeStrength('Gk!Driving#1993').label).toBe('Strong');
  });
});

describe('session tokens', () => {
  it('round-trips the session version', async () => {
    const token = await signSession(3, ENV);
    expect(await verifySession(token, ENV)).toEqual({ sv: 3 });
  });

  it('rejects tampered tokens, wrong secrets, expired tokens and missing tokens', async () => {
    const token = await signSession(1, ENV);
    expect(await verifySession(`${token}x`, ENV)).toBeNull();
    expect(await verifySession(token, { ...ENV, ADMIN_JWT_SECRET: 'another-very-long-secret-9876543210' })).toBeNull();
    expect(await verifySession(undefined, ENV)).toBeNull();
    const old = await signSession(1, ENV, Math.floor(Date.now() / 1000) - 13 * 60 * 60);
    expect(await verifySession(old, ENV)).toBeNull();
  });

  it('fails closed in production without ADMIN_JWT_SECRET', async () => {
    await expect(signSession(0, { NODE_ENV: 'production' })).rejects.toThrow();
    expect(await verifySession('anything', { NODE_ENV: 'production' })).toBeNull();
  });

  it('a stale session version differs from the current one (compared by the guard)', async () => {
    const claims = await verifySession(await signSession(1, ENV), ENV);
    expect(claims?.sv).not.toBe(2);
  });
});

describe('login throttle', () => {
  it('delays progressively: 0.5 s, 1 s, 2 s, 4 s, then stays at 4 s', () => {
    expect([1, 2, 3, 4, 5, 6].map(delayForFailure)).toEqual([500, 1000, 2000, 4000, 4000, 4000]);
  });

  it('locks an IP out for 15 minutes after 5 failures, then lets it back in', () => {
    const t = createThrottle();
    const t0 = 1_000_000;
    for (let i = 0; i < MAX_FAILURES; i++) {
      expect(t.blockedFor('1.1.1.1', t0)).toBe(0);
      t.fail('1.1.1.1', t0);
    }
    expect(t.blockedFor('1.1.1.1', t0 + 1000)).toBeGreaterThan(14 * 60);
    expect(t.blockedFor('2.2.2.2', t0 + 1000)).toBe(0);
    expect(t.blockedFor('1.1.1.1', t0 + LOCKOUT_MS + 1)).toBe(0);
  });

  it('a success clears the failure count', () => {
    const t = createThrottle();
    for (let i = 0; i < MAX_FAILURES - 1; i++) t.fail('1.1.1.1', 0);
    t.succeed('1.1.1.1');
    t.fail('1.1.1.1', 0);
    expect(t.blockedFor('1.1.1.1', 1)).toBe(0);
  });

  it('applies a global cap of 30 failures per hour across IPs', () => {
    const t = createThrottle();
    for (let i = 0; i < GLOBAL_MAX_PER_HOUR; i++) t.fail(`10.0.0.${i}`, 0);
    expect(t.blockedFor('9.9.9.9', 1000)).toBeGreaterThan(0);
    expect(t.blockedFor('9.9.9.9', 61 * 60 * 1000)).toBe(0);
  });
});

describe('CSRF guard', () => {
  const h = (init: Record<string, string>) => new Headers(init);
  it('lets safe methods through', () => {
    expect(csrfOk(h({}), 'GET')).toBe(true);
  });
  it('requires the custom header on mutations', () => {
    expect(csrfOk(h({ 'sec-fetch-site': 'same-origin' }), 'POST')).toBe(false);
  });
  it('accepts same-origin via Sec-Fetch-Site or a matching Origin', () => {
    expect(csrfOk(h({ 'x-requested-with': 'gkds-admin', 'sec-fetch-site': 'same-origin' }), 'PUT')).toBe(true);
    expect(csrfOk(h({ 'x-requested-with': 'gkds-admin', origin: 'https://gk.in', host: 'gk.in' }), 'DELETE')).toBe(true);
  });
  it('rejects cross-site requests and requests with no origin signal', () => {
    expect(csrfOk(h({ 'x-requested-with': 'gkds-admin', 'sec-fetch-site': 'cross-site' }), 'POST')).toBe(false);
    expect(csrfOk(h({ 'x-requested-with': 'gkds-admin', origin: 'https://evil.example', host: 'gk.in' }), 'POST')).toBe(false);
    expect(csrfOk(h({ 'x-requested-with': 'gkds-admin' }), 'POST')).toBe(false);
  });
});

describe('admin prefixes and redirects', () => {
  it('treats /admin and /malika identically', () => {
    expect(adminBaseOf('/admin')).toBe('/admin');
    expect(adminBaseOf('/malika/courses')).toBe('/malika');
    expect(adminBaseOf('/administrator')).toBeNull();
    expect(adminBaseOf('/')).toBeNull();
  });
  it('only follows relative admin paths after login, keeping the entered prefix', () => {
    expect(safeNextPath('/admin/courses', '/admin')).toBe('/admin/courses');
    expect(safeNextPath('/admin/courses?x=1', '/malika')).toBe('/malika/courses?x=1');
    for (const bad of ['https://evil.example', '//evil.example', '/\\evil', '/about', '', undefined, '/admin/x\r\nSet-Cookie: a=b']) {
      expect(safeNextPath(bad, '/admin')).toBe('/admin');
    }
  });
});

describe('content API whitelist', () => {
  it('accepts exactly the six documents', () => {
    expect([...contentNames]).toEqual(['site', 'home', 'about', 'courses', 'gallery', 'reviews']);
    for (const n of contentNames) expect(isContentName(n)).toBe(true);
  });
  it('rejects config, submissions, traversal and anything else', () => {
    for (const bad of ['admin', 'config/admin', '../config/admin', 'submissions/reviews', '', 'Site', 'courses.json']) {
      expect(isContentName(bad)).toBe(false);
    }
  });
});
