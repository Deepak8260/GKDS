import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictError, deleteFile, getCommits, getFile, putBinary, putJson } from '@/lib/github-write';

const sleep = async () => {};
const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');
const res = (status: number, body: unknown = {}, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers });
const fileRes = (text: string, sha: string) => res(200, { type: 'file', encoding: 'base64', content: b64(text), sha });

describe('GitHub write layer (admin)', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_TOKEN', 'ghp_SECRET');
    vi.stubEnv('GITHUB_OWNER', 'me');
    vi.stubEnv('GITHUB_REPO', 'gkds');
    vi.stubEnv('GITHUB_BRANCH', 'data');
    vi.stubEnv('GIT_COMMIT_NAME', '');
    vi.stubEnv('GIT_COMMIT_EMAIL', '');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('getFile returns text and sha, or null for 404', async () => {
    const f = vi.fn().mockResolvedValueOnce(fileRes('{"a":1}', 'sha-9')).mockResolvedValueOnce(res(404));
    const got = await getFile('content/site.json', { fetch: f, sleep });
    expect(got?.text).toBe('{"a":1}');
    expect(got?.sha).toBe('sha-9');
    expect((f.mock.calls[0] as [string])[0]).toContain('ref=data');
    expect(await getFile('content/none.json', { fetch: f, sleep })).toBeNull();
  });

  it('putJson updates with the last known sha, 2-space indent and a trailing newline', async () => {
    const f = vi.fn().mockResolvedValue(res(200, { content: { sha: 'new-sha' } }));
    const out = await putJson('content/courses.json', { a: [1] }, { sha: 'old-sha', message: 'admin: update courses.json' }, { fetch: f, sleep });
    expect(out.sha).toBe('new-sha');
    const body = JSON.parse((f.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.sha).toBe('old-sha');
    expect(body.message).toBe('admin: update courses.json');
    expect(body.branch).toBe('data');
    expect(Buffer.from(body.content, 'base64').toString()).toBe('{\n  "a": [\n    1\n  ]\n}\n');
  });

  it('throws ConflictError (with the latest content) when the sha is stale, and never overwrites', async () => {
    const f = vi.fn().mockResolvedValueOnce(res(409)).mockResolvedValueOnce(fileRes('{"newer":true}', 'sha-newer'));
    const err = await putJson('content/site.json', {}, { sha: 'sha-old', message: 'm' }, { fetch: f, sleep }).catch((e) => e);
    expect(err).toBeInstanceOf(ConflictError);
    expect(err.current).toEqual({ text: '{"newer":true}', sha: 'sha-newer' });
    expect(f).toHaveBeenCalledTimes(2); // one PUT, one re-read — no blind retry
  });

  it('retries a 409 when the file is actually unchanged (branch moved meanwhile)', async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(res(409))
      .mockResolvedValueOnce(fileRes('{}', 'sha-same'))
      .mockResolvedValueOnce(res(200, { content: { sha: 'done' } }));
    const out = await putJson('content/site.json', {}, { sha: 'sha-same', message: 'm' }, { fetch: f, sleep });
    expect(out.sha).toBe('done');
  });

  it('creating a file that already exists is a conflict', async () => {
    const f = vi.fn().mockResolvedValueOnce(res(422)).mockResolvedValueOnce(fileRes('{}', 'exists'));
    await expect(putJson('content/site.json', {}, { message: 'm' }, { fetch: f, sleep })).rejects.toBeInstanceOf(ConflictError);
  });

  it('retries 5xx with exponential backoff, then gives up with a friendly error', async () => {
    const sleeps: number[] = [];
    const f = vi.fn().mockResolvedValue(res(503));
    await expect(putJson('content/site.json', {}, { message: 'm' }, { fetch: f, sleep: async (ms) => void sleeps.push(ms) })).rejects.toThrow(/503/);
    expect(f).toHaveBeenCalledTimes(3);
    expect(sleeps).toEqual([400, 800]);
  });

  it('honours a secondary rate limit (retry-after) and succeeds afterwards', async () => {
    const sleeps: number[] = [];
    const f = vi.fn().mockResolvedValueOnce(res(403, {}, { 'retry-after': '2' })).mockResolvedValueOnce(res(201, { content: { sha: 'ok' } }));
    const out = await putBinary('media/gallery/a.webp', Buffer.from([1, 2, 3]), { message: 'admin: upload media/gallery/a.webp' }, { fetch: f, sleep: async (ms) => void sleeps.push(ms) });
    expect(out.sha).toBe('ok');
    expect(sleeps).toContain(2000);
    const body = JSON.parse((f.mock.calls[1] as [string, RequestInit])[1].body as string);
    expect(body.content).toBe(Buffer.from([1, 2, 3]).toString('base64'));
  });

  it('deleteFile sends the sha, and a stale sha is a conflict', async () => {
    const ok = vi.fn().mockResolvedValue(res(200));
    await deleteFile('media/gallery/a.webp', 'sha-1', 'admin: delete media/gallery/a.webp', { fetch: ok, sleep });
    const init = (ok.mock.calls[0] as [string, RequestInit])[1];
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(init.body as string)).toMatchObject({ sha: 'sha-1', branch: 'data' });

    const stale = vi.fn().mockResolvedValueOnce(res(409)).mockResolvedValueOnce(fileRes('x', 'sha-2'));
    await expect(deleteFile('p', 'sha-1', 'm', { fetch: stale, sleep })).rejects.toBeInstanceOf(ConflictError);
  });

  it('serialises writes to the same path within one instance', async () => {
    const order: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const f = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      const tag = JSON.parse(init.body as string).message as string;
      order.push(`start ${tag}`);
      if (tag === 'first') await gate;
      order.push(`end ${tag}`);
      return res(200, { content: { sha: tag } });
    });
    const a = putJson('content/x.json', {}, { sha: 's', message: 'first' }, { fetch: f, sleep });
    const b = putJson('content/x.json', {}, { sha: 's', message: 'second' }, { fetch: f, sleep });
    await new Promise((r) => setTimeout(r, 20));
    expect(order).toEqual(['start first']); // second has not started
    release();
    await Promise.all([a, b]);
    expect(order).toEqual(['start first', 'end first', 'start second', 'end second']);
  });

  it('getCommits maps the API response', async () => {
    const f = vi.fn().mockResolvedValue(res(200, [{ sha: 'abc', html_url: 'https://x/c/abc', commit: { message: 'admin: update site.json\n\nbody', author: { name: 'GKDS Admin', date: '2026-11-01T10:00:00Z' } } }]));
    const list = await getCommits('content/site.json', 5, { fetch: f, sleep });
    expect(list).toEqual([{ sha: 'abc', message: 'admin: update site.json', date: '2026-11-01T10:00:00Z', author: 'GKDS Admin', url: 'https://x/c/abc' }]);
    expect((f.mock.calls[0] as [string])[0]).toContain('path=content%2Fsite.json');
  });

  it('never puts the token in an error message', async () => {
    const f = vi.fn().mockResolvedValue(res(401));
    const err = await getFile('x', { fetch: f, sleep }).catch((e) => e as Error);
    expect(String((err as Error).message)).not.toContain('ghp_SECRET');
  });
});
