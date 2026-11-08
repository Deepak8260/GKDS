import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getReviews: vi.fn(),
  isGithubConfigured: vi.fn(),
  createFile: vi.fn(),
  getFile: vi.fn(),
  putJson: vi.fn(),
  revalidateTag: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('{"items":[]}'),
  writeFile: mocks.writeFile,
}));
vi.mock('next/cache', () => ({ revalidateTag: mocks.revalidateTag }));
vi.mock('@/lib/content', () => ({ getReviews: mocks.getReviews, getSeed: () => ({ items: [], hero: {}, summaryMode: 'auto' }) }));
vi.mock('@/lib/github', async () => {
  const actual = await vi.importActual<typeof import('@/lib/github')>('@/lib/github');
  return { ...actual, isGithubConfigured: mocks.isGithubConfigured };
});
vi.mock('@/lib/github-write', async () => {
  const actual = await vi.importActual<typeof import('@/lib/github-write')>('@/lib/github-write');
  return { ...actual, createFile: mocks.createFile, getFile: mocks.getFile, putJson: mocks.putJson };
});
vi.mock('@/lib/validators', async () => {
  const actual = await vi.importActual<typeof import('@/lib/validators')>('@/lib/validators');
  return { ...actual, reviewsSchema: { parse: (v: unknown) => v } };
});

import { POST } from '@/app/api/reviews/submit/route';
import { reviewLimits } from '@/lib/review-limits';

const GENERIC = 'Could not submit right now. Please try again later.';

const goodBody = () => ({
  name: 'Amit Sahoo',
  rating: 5,
  text: 'Very good training and supportive instructors. Highly recommended!',
  company: '',
  startedAt: Date.now() - 10_000,
});

function call(
  body: unknown,
  opts: { headers?: Record<string, string | null>; raw?: string } = {},
) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    host: 'localhost:3000',
    origin: 'http://localhost:3000',
    'x-forwarded-for': '203.0.113.7',
  };
  for (const [k, v] of Object.entries(opts.headers ?? {})) {
    if (v === null) delete headers[k];
    else headers[k] = v;
  }
  return POST(
    new Request('http://localhost:3000/api/reviews/submit', {
      method: 'POST',
      headers,
      body: opts.raw ?? JSON.stringify(body),
    }),
  );
}

describe('POST /api/reviews/submit', () => {
  beforeEach(() => {
    reviewLimits.perIp.reset();
    reviewLimits.global.reset();
    mocks.getReviews.mockReset().mockResolvedValue({ acceptSubmissions: true });
    mocks.isGithubConfigured.mockReset().mockReturnValue(true);
    mocks.createFile.mockReset().mockResolvedValue({ path: 'x', sha: 'y' });
    mocks.getFile.mockReset().mockResolvedValue({ text: JSON.stringify({ items: [{ id: 'old' }] }), sha: 'sha-1' });
    mocks.putJson.mockReset().mockResolvedValue({ path: 'x', sha: 'y' });
    mocks.revalidateTag.mockReset();
    mocks.writeFile.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('a valid submission', () => {
    it('publishes the review straight away by appending to reviews.json', async () => {
      const res = await call(goodBody());
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect(res.headers.get('cache-control')).toBe('no-store');

      expect(mocks.putJson).toHaveBeenCalledTimes(1);
      const [path, doc, opts] = mocks.putJson.mock.calls[0] as [string, { items: Record<string, unknown>[] }, { sha: string; message: string }];
      expect(path).toBe('content/reviews.json');
      expect(opts.sha).toBe('sha-1');
      expect(doc.items).toHaveLength(2);
      expect(doc.items[0]).toEqual({ id: 'old' });
      expect(doc.items[1]).toMatchObject({
        name: 'Amit Sahoo',
        rating: 5,
        text: 'Very good training and supportive instructors. Highly recommended!',
        published: true,
        featured: false,
      });
      expect(Number.isNaN(Date.parse(doc.items[1].date as string))).toBe(false);
      expect(Object.keys(doc.items[1]).sort()).toEqual(['date', 'featured', 'id', 'name', 'published', 'rating', 'text']);
      expect(mocks.revalidateTag).toHaveBeenCalledWith('content:reviews', { expire: 0 });
    });

    it('keeps an optional phone number out of the public review (private file only)', async () => {
      await call({ ...goodBody(), phone: '98765 43210' });
      const [, doc] = mocks.putJson.mock.calls[0] as [string, { items: Record<string, unknown>[] }];
      expect(JSON.stringify(doc)).not.toContain('98765');
      expect(mocks.createFile).toHaveBeenCalledTimes(1);
      expect(mocks.createFile.mock.calls[0][1]).toContain('98765 43210');
    });

    it('re-reads and retries when someone saved at the same moment', async () => {
      const { ConflictError } = await import('@/lib/github-write');
      mocks.putJson.mockRejectedValueOnce(new ConflictError('content/reviews.json', null));
      const res = await call(goodBody());
      expect(res.status).toBe(200);
      expect(mocks.getFile).toHaveBeenCalledTimes(2);
      expect(mocks.putJson).toHaveBeenCalledTimes(2);
    });

    it('stores sanitised text (tags stripped, whitespace collapsed)', async () => {
      await call({ ...goodBody(), text: '<b>Great</b>   training\n and very  helpful <script>x</script> instructors' });
      const stored = (mocks.putJson.mock.calls[0][1] as { items: { text: string }[] }).items[1];
      expect(stored.text).toBe('Great training and very helpful x instructors');
      expect(stored.text).not.toMatch(/[<>]/);
    });

    it('accepts the configured public site host as an origin', async () => {
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.example.in');
      const res = await call(goodBody(), { headers: { origin: 'https://www.example.in', host: 'something-else.vercel.app' } });
      expect(res.status).toBe(200);
    });
  });

  describe('request hygiene', () => {
    it('rejects non-JSON content types', async () => {
      const res = await call(null, { headers: { 'content-type': 'text/plain' }, raw: 'name=a' });
      expect(res.status).toBe(415);
      expect(mocks.putJson).not.toHaveBeenCalled();
    });

    it('rejects a missing or foreign Origin', async () => {
      expect((await call(goodBody(), { headers: { origin: null } })).status).toBe(403);
      expect((await call(goodBody(), { headers: { origin: 'https://evil.example' } })).status).toBe(403);
      expect((await call(goodBody(), { headers: { origin: 'not a url' } })).status).toBe(403);
      expect(mocks.putJson).not.toHaveBeenCalled();
    });

    it('rejects bodies over 8 KB', async () => {
      const res = await call({ ...goodBody(), text: 'x'.repeat(9000) });
      expect(res.status).toBe(413);
      expect(mocks.putJson).not.toHaveBeenCalled();
    });

    it('rejects invalid JSON and non-object JSON', async () => {
      expect((await call(null, { raw: '{oops' })).status).toBe(400);
      expect((await call(null, { raw: '"just a string"' })).status).toBe(400);
      expect((await call(null, { raw: 'null' })).status).toBe(400);
    });
  });

  describe('spam defences', () => {
    it('honeypot filled: pretends success but stores nothing', async () => {
      const res = await call({ ...goodBody(), company: 'Acme SEO Ltd' });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect(mocks.putJson).not.toHaveBeenCalled();
    });

    it('honeypot filled even with an otherwise invalid body is silently accepted', async () => {
      const res = await call({ company: 'bot' });
      expect(res.status).toBe(200);
      expect(mocks.putJson).not.toHaveBeenCalled();
    });

    it('rejects a form filled in under 3 seconds', async () => {
      const res = await call({ ...goodBody(), startedAt: Date.now() - 1000 });
      expect(res.status).toBe(400);
      expect((await res.json()).message).toBe(GENERIC);
      expect(mocks.putJson).not.toHaveBeenCalled();
    });

    it('rejects links, emails and phone numbers in the text', async () => {
      for (const text of [
        'Great school, visit https://cheap-licence.example for deals today',
        'Great school, mail me at spammer@gmail.com for details please',
        'Great school, call me on 9876543210 for more details please',
        'Great school, see www.cheaplicence.com for more details please',
      ]) {
        const res = await call({ ...goodBody(), text });
        expect(res.status, text).toBe(400);
        expect((await res.json()).fieldErrors.text).toMatch(/links, email addresses and phone numbers/);
      }
      expect(mocks.putJson).not.toHaveBeenCalled();
    });

    it('rejects text that is too short once tags are stripped', async () => {
      const res = await call({ ...goodBody(), text: '<b></b><i></i>aaaa bbbb cccc' });
      // raw text is 28 characters (passes the 20-character minimum) but only 14 remain once the tags are stripped
      expect(res.status).toBe(400);
      expect((await res.json()).fieldErrors.text).toBeTruthy();
    });

    it('allows 3 reviews per visitor per hour, then answers 429 with Retry-After', async () => {
      for (let i = 0; i < 3; i++) expect((await call(goodBody())).status).toBe(200);
      const res = await call(goodBody());
      expect(res.status).toBe(429);
      expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
      expect((await res.json()).message).toMatch(/Too many/);
      expect(mocks.putJson).toHaveBeenCalledTimes(3);
    });

    it('limits are per visitor: another IP is unaffected', async () => {
      for (let i = 0; i < 3; i++) await call(goodBody());
      expect((await call(goodBody())).status).toBe(429);
      expect((await call(goodBody(), { headers: { 'x-forwarded-for': '198.51.100.9' } })).status).toBe(200);
    });

    it('caps all visitors together at 30 per hour', async () => {
      for (let i = 0; i < 30; i++) {
        expect((await call(goodBody(), { headers: { 'x-forwarded-for': `10.0.0.${i}` } })).status).toBe(200);
      }
      expect((await call(goodBody(), { headers: { 'x-forwarded-for': '10.0.1.1' } })).status).toBe(429);
    });

    it('rejected attempts (validation) do not use up the visitor allowance', async () => {
      for (let i = 0; i < 5; i++) await call({ ...goodBody(), text: 'too short' });
      expect((await call(goodBody())).status).toBe(200);
    });
  });

  describe('validation errors tell the visitor what to fix', () => {
    it('returns field-level messages', async () => {
      const res = await call({ ...goodBody(), name: 'A', rating: 9, text: 'short' });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(Object.keys(json.fieldErrors).sort()).toEqual(['name', 'rating', 'text']);
    });
  });

  describe('closed form and failures', () => {
    it('answers 403 when the admin has closed submissions', async () => {
      mocks.getReviews.mockResolvedValue({ acceptSubmissions: false });
      const res = await call(goodBody());
      expect(res.status).toBe(403);
      expect((await res.json()).message).toBe('Reviews are currently closed.');
      expect(mocks.putJson).not.toHaveBeenCalled();
    });

    it('still accepts reviews if the content cannot be read', async () => {
      mocks.getReviews.mockRejectedValue(new Error('boom'));
      expect((await call(goodBody())).status).toBe(200);
    });

    it('GitHub failure: generic 502, nothing leaked', async () => {
      mocks.putJson.mockRejectedValue(new Error('ghp_SECRET_TOKEN token=abc repo=me/gkds exploded'));
      const res = await call(goodBody());
      expect(res.status).toBe(502);
      const text = await res.text();
      expect(JSON.parse(text)).toEqual({ ok: false, message: GENERIC });
      for (const leak of ['ghp_', 'token', 'me/gkds', 'exploded', 'stack']) expect(text).not.toContain(leak);
    });

    it('does not log the error message (could contain secrets), only its kind', async () => {
      mocks.putJson.mockRejectedValue(new Error('ghp_SECRET'));
      await call(goodBody());
      const logged = JSON.stringify((console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls);
      expect(logged).not.toContain('ghp_SECRET');
    });

    it('GitHub not configured in development: the review is saved to the local seed so it can be tested', async () => {
      mocks.isGithubConfigured.mockReturnValue(false);
      const res = await call(goodBody());
      expect(res.status).toBe(200);
      expect(mocks.putJson).not.toHaveBeenCalled();
      expect(mocks.writeFile).toHaveBeenCalledTimes(1);
      expect(String(mocks.writeFile.mock.calls[0][0])).toMatch(/content-seed[\/]reviews\.json$/);
    });

    it('GitHub not configured in production: a clear failure instead of silently losing the review', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mocks.isGithubConfigured.mockReturnValue(false);
      const res = await call(goodBody());
      expect(res.status).toBe(503);
      expect((await res.json()).message).toBe(GENERIC);
    });
  });
});
