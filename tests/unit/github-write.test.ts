import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFile } from '@/lib/github-write';

const ok = (sha = 'abc123') => new Response(JSON.stringify({ content: { sha } }), { status: 201 });
const status = (code: number, headers: Record<string, string> = {}) => new Response('{}', { status: code, headers });

describe('createFile', () => {
  const sleeps: number[] = [];
  const sleep = async (ms: number) => void sleeps.push(ms);

  beforeEach(() => {
    sleeps.length = 0;
    vi.stubEnv('GITHUB_TOKEN', 'ghp_SECRET_TOKEN_123');
    vi.stubEnv('GITHUB_OWNER', 'me');
    vi.stubEnv('GITHUB_REPO', 'gkds');
    vi.stubEnv('GITHUB_BRANCH', 'data');
    vi.stubEnv('GIT_COMMIT_NAME', '');
    vi.stubEnv('GIT_COMMIT_EMAIL', '');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('PUTs base64 content to the Contents API on the data branch and returns the sha', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok('sha-1'));
    const res = await createFile('submissions/reviews/ab12.json', '{"a":"é"}\n', 'review: new submission ab12', { fetch: fetchMock, sleep });

    expect(res).toEqual({ path: 'submissions/reviews/ab12.json', sha: 'sha-1' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.github.com/repos/me/gkds/contents/submissions/reviews/ab12.json');
    expect(init.method).toBe('PUT');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer ghp_SECRET_TOKEN_123');
    const body = JSON.parse(init.body as string);
    expect(body.branch).toBe('data');
    expect(body.message).toBe('review: new submission ab12');
    expect(Buffer.from(body.content, 'base64').toString('utf8')).toBe('{"a":"é"}\n');
    expect(body.sha).toBeUndefined(); // create only: never overwrite
  });

  it('includes the commit author when configured', async () => {
    vi.stubEnv('GIT_COMMIT_NAME', 'GKDS Admin');
    vi.stubEnv('GIT_COMMIT_EMAIL', 'admin@example.com');
    const fetchMock = vi.fn().mockResolvedValue(ok());
    await createFile('x.json', '{}', 'm', { fetch: fetchMock, sleep });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.committer).toEqual({ name: 'GKDS Admin', email: 'admin@example.com' });
  });

  it('retries 5xx with exponential backoff (400 ms, 800 ms) and then succeeds', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(status(500)).mockResolvedValueOnce(status(503)).mockResolvedValueOnce(ok());
    await expect(createFile('x.json', '{}', 'm', { fetch: fetchMock, sleep })).resolves.toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sleeps).toEqual([400, 800]);
  });

  it('retries a 409 (branch moved) and network errors', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('ECONNRESET')).mockResolvedValueOnce(status(409)).mockResolvedValueOnce(ok());
    await expect(createFile('x.json', '{}', 'm', { fetch: fetchMock, sleep })).resolves.toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('gives up after 3 attempts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(status(500));
    await expect(createFile('x.json', '{}', 'm', { fetch: fetchMock, sleep })).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries rate limits (403 with x-ratelimit-remaining: 0)', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(status(403, { 'x-ratelimit-remaining': '0' })).mockResolvedValueOnce(ok());
    await expect(createFile('x.json', '{}', 'm', { fetch: fetchMock, sleep })).resolves.toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry an existing path (422), a bad token (401/403) or a missing branch (404)', async () => {
    for (const code of [422, 401, 403, 404]) {
      const fetchMock = vi.fn().mockResolvedValue(status(code));
      await expect(createFile('x.json', '{}', 'm', { fetch: fetchMock, sleep })).rejects.toThrow();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });

  it('never puts the token in an error message', async () => {
    for (const code of [401, 403, 404, 422, 500]) {
      const fetchMock = vi.fn().mockResolvedValue(status(code));
      const err = await createFile('x.json', '{}', 'm', { fetch: fetchMock, sleep }).catch((e: Error) => e);
      expect(String((err as Error).message)).not.toContain('ghp_SECRET_TOKEN_123');
    }
  });

  it('fails clearly when GitHub is not configured', async () => {
    vi.stubEnv('GITHUB_TOKEN', '');
    await expect(createFile('x.json', '{}', 'm', { fetch: vi.fn(), sleep })).rejects.toThrow(/authentication/i);
  });
});
