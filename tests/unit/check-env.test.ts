import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs script without types
import { REQUIRED, checkEnv, run } from '../../scripts/check-env.mjs';

const full = {
  GITHUB_TOKEN: 'github_pat_x',
  GITHUB_OWNER: 'me',
  GITHUB_REPO: 'gkds',
  GITHUB_BRANCH: 'data',
  ADMIN_JWT_SECRET: 'x'.repeat(40),
  NEXT_PUBLIC_SITE_URL: 'https://www.example.in',
  REVALIDATE_SECRET: 'secret-secret-secret',
  ADMIN_CODE: 'my-own-code',
};

const logger = () => ({ log: vi.fn(), warn: vi.fn(), error: vi.fn() });

describe('check-env (runs before every build)', () => {
  it('lists every required variable that is missing', () => {
    expect(REQUIRED.map(([n]: [string]) => n)).toEqual(['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_BRANCH', 'ADMIN_JWT_SECRET', 'NEXT_PUBLIC_SITE_URL', 'REVALIDATE_SECRET']);
    expect(checkEnv(full).missing).toEqual([]);
    expect(checkEnv({}).missing).toHaveLength(7);
    expect(checkEnv({ ...full, GITHUB_TOKEN: '   ' }).missing.map(([n]: [string]) => n)).toEqual(['GITHUB_TOKEN']);
  });

  it('a Vercel PRODUCTION build fails with a readable list', () => {
    const log = logger();
    expect(run({ VERCEL_ENV: 'production', GITHUB_OWNER: 'me' }, log)).toBe(1);
    const text = log.error.mock.calls.map((c) => c[0]).join('\n');
    expect(text).toContain('GITHUB_TOKEN');
    expect(text).toContain('ADMIN_JWT_SECRET');
    expect(text).toContain('docs/DEPLOYMENT.md');
    expect(text).not.toContain('GITHUB_OWNER:'); // the one that is set is not listed
  });

  it('preview and local builds only warn', () => {
    for (const env of [{ VERCEL_ENV: 'preview' }, {}]) {
      const log = logger();
      expect(run(env, log)).toBe(0);
      expect(log.warn).toHaveBeenCalled();
      expect(log.error).not.toHaveBeenCalled();
    }
  });

  it('a complete production setup passes', () => {
    const log = logger();
    expect(run({ ...full, VERCEL_ENV: 'production' }, log)).toBe(0);
    expect(log.warn).not.toHaveBeenCalled();
    expect(log.error).not.toHaveBeenCalled();
  });

  it('warns (never fails) while the default access code is in use', () => {
    for (const code of ['gkds1993', '', undefined]) {
      const log = logger();
      expect(run({ ...full, ADMIN_CODE: code, VERCEL_ENV: 'production' }, log)).toBe(0);
      expect(log.warn.mock.calls.join(' ')).toMatch(/ADMIN_CODE/);
    }
  });

  it('warns about risky values: main as the content branch, http or trailing-slash site address, short secret', () => {
    const w = checkEnv({ ...full, GITHUB_BRANCH: 'main', NEXT_PUBLIC_SITE_URL: 'http://x.in/', ADMIN_JWT_SECRET: 'short' }).warnings.join(' | ');
    expect(w).toMatch(/GITHUB_BRANCH is "main"/);
    expect(w).toMatch(/https:\/\//);
    expect(w).toMatch(/slash/);
    expect(w).toMatch(/ADMIN_JWT_SECRET is short/);
  });

  it('ALLOW_SEED_ONLY=1 skips everything', () => {
    const log = logger();
    expect(run({ VERCEL_ENV: 'production', ALLOW_SEED_ONLY: '1' }, log)).toBe(0);
    expect(log.error).not.toHaveBeenCalled();
    expect(log.warn).not.toHaveBeenCalled();
  });
});
