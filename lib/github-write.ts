import 'server-only';
import { GITHUB_API, GithubAuthError, GithubError, GithubRateLimitError, encodePath, getGithubConfig } from './github';

/**
 * Write helpers for the data branch (GitHub Contents API).
 * Prompt 07 needs only `createFile`; prompt 10 adds update / delete / binary uploads.
 */

export interface WriteDeps {
  /** Injectable for tests. */
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

export interface CreatedFile {
  path: string;
  sha: string;
}

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 400;

function authorFields(): { committer?: { name: string; email: string }; author?: { name: string; email: string } } {
  const name = process.env.GIT_COMMIT_NAME?.trim();
  const email = process.env.GIT_COMMIT_EMAIL?.trim();
  return name && email ? { committer: { name, email }, author: { name, email } } : {};
}

/**
 * Create a NEW file on the data branch (never overwrites: an existing path is an error).
 * Retries up to 3 times with exponential backoff on network errors, 5xx, 409 (branch moved) and rate limits.
 * Error messages never include the token or repo details beyond the path.
 */
export async function createFile(
  path: string,
  content: string,
  message: string,
  deps: WriteDeps = {},
): Promise<CreatedFile> {
  const config = getGithubConfig();
  if (!config) throw new GithubAuthError(401);

  const doFetch = deps.fetch ?? fetch;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${encodePath(path)}`;
  const body = JSON.stringify({
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch: config.branch,
    ...authorFields(),
  });

  let lastError: GithubError = new GithubError('GitHub write failed', 502);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(BASE_DELAY_MS * 2 ** (attempt - 1)); // 400 ms, 800 ms

    let res: Response;
    try {
      res = await doFetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'gkds-site',
          'Content-Type': 'application/json',
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      lastError = new GithubError('GitHub write failed: network error', 502);
      continue; // retry
    }

    if (res.ok) {
      const json = (await res.json().catch(() => ({}))) as { content?: { sha?: string } };
      return { path, sha: json.content?.sha ?? '' };
    }

    if (res.status === 401) throw new GithubAuthError(401);
    if (res.status === 404) throw new GithubError('GitHub write failed: repository or branch not found', 404);
    if (res.status === 422) throw new GithubError(`GitHub write failed: ${path} already exists or is invalid`, 422);

    const rateLimited =
      res.status === 429 || (res.status === 403 && (res.headers.get('x-ratelimit-remaining') === '0' || res.headers.has('retry-after')));
    if (res.status === 403 && !rateLimited) throw new GithubAuthError(403);

    // 409 (branch moved while committing), 5xx and rate limits are worth retrying
    lastError = rateLimited ? new GithubRateLimitError() : new GithubError(`GitHub responded ${res.status}`, res.status);
  }

  throw lastError;
}

/* ------------------------------------------------------------------------------------------------
 * Prompt 10: read-with-sha, update, delete, binary upload, commit log, write queue, conflict errors.
 * ---------------------------------------------------------------------------------------------- */

export interface RepoFile {
  /** Decoded text (UTF-8). For binary files use `buffer`. */
  text: string;
  buffer: Buffer;
  sha: string;
}

/** Thrown when the file changed on GitHub since the caller last read it (stale `sha`). Never overwritten silently. */
export class ConflictError extends GithubError {
  constructor(
    public readonly path: string,
    public readonly current: { text: string; sha: string } | null,
  ) {
    super(`${path} was changed elsewhere`, 409);
    this.name = 'ConflictError';
  }
}

function requireConfig() {
  const config = getGithubConfig();
  if (!config) throw new GithubAuthError(401);
  return config;
}

function contentsUrl(config: { owner: string; repo: string }, path: string): string {
  return `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${encodePath(path)}`;
}

function ghHeaders(token: string, extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'gkds-site',
    ...extra,
  };
}

function isRateLimited(res: Response): boolean {
  return res.status === 429 || (res.status === 403 && (res.headers.get('x-ratelimit-remaining') === '0' || res.headers.has('retry-after')));
}

/**
 * One GitHub call with up to 3 attempts (exponential backoff) on network errors, 5xx and rate limits.
 * Other statuses (2xx, 4xx) are returned for the caller to interpret.
 */
async function ghCall(
  method: string,
  url: string,
  body: unknown,
  deps: WriteDeps,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  const config = requireConfig();
  const doFetch = deps.fetch ?? fetch;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  let last: GithubError = new GithubError('GitHub request failed', 502);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
    let res: Response;
    try {
      res = await doFetch(url, {
        method,
        headers: ghHeaders(config.token, { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...extraHeaders }),
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      last = new GithubError('GitHub request failed: network error', 502);
      continue;
    }
    if (res.status >= 500) {
      last = new GithubError(`GitHub responded ${res.status}`, res.status);
      continue;
    }
    if (isRateLimited(res)) {
      const retry = Number(res.headers.get('retry-after'));
      last = new GithubRateLimitError(Number.isFinite(retry) && retry > 0 ? retry : undefined);
      if (retry > 0 && retry <= 5) await sleep(retry * 1000);
      continue;
    }
    return res;
  }
  throw last;
}

function failFor(res: Response, path: string): never {
  if (res.status === 401) throw new GithubAuthError(401);
  if (res.status === 403) throw new GithubAuthError(403);
  if (res.status === 404) throw new GithubError(`GitHub: repository, branch or ${path} not found`, 404);
  throw new GithubError(`GitHub responded ${res.status}`, res.status);
}

/** Read a file with its blob `sha` (always fresh, never cached). Returns null if it does not exist. */
export async function getFile(path: string, deps: WriteDeps = {}): Promise<RepoFile | null> {
  const config = requireConfig();
  const url = `${contentsUrl(config, path)}?ref=${encodeURIComponent(config.branch)}`;
  const res = await ghCall('GET', url, undefined, deps);
  if (res.status === 404) return null;
  if (!res.ok) failFor(res, path);
  const json = (await res.json()) as { content?: string; encoding?: string; sha: string; type?: string };
  if (json.type && json.type !== 'file') return null;

  let buffer: Buffer;
  if (json.encoding === 'base64' && json.content) {
    buffer = Buffer.from(json.content.replace(/\n/g, ''), 'base64');
  } else {
    // files over 1 MB come without inline content: fetch the raw bytes
    const raw = await ghCall('GET', url, undefined, deps, { Accept: 'application/vnd.github.raw+json' });
    if (!raw.ok) failFor(raw, path);
    buffer = Buffer.from(await raw.arrayBuffer());
  }
  return { text: buffer.toString('utf8'), buffer, sha: json.sha };
}

/** Read a file as it was at one commit (for History). Returns null if it did not exist then. */
export async function getFileAtRef(path: string, ref: string, deps: WriteDeps = {}): Promise<string | null> {
  const config = requireConfig();
  const url = `${contentsUrl(config, path)}?ref=${encodeURIComponent(ref)}`;
  const res = await ghCall('GET', url, undefined, deps, { Accept: 'application/vnd.github.raw+json' });
  if (res.status === 404) return null;
  if (!res.ok) failFor(res, path);
  return Buffer.from(await res.arrayBuffer()).toString('utf8');
}

/** Writes to the same path run one after another within this server instance. */
const queues = new Map<string, Promise<unknown>>();
function enqueue<T>(path: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(path) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  queues.set(path, next);
  next
    .catch(() => undefined)
    .finally(() => {
      if (queues.get(path) === next) queues.delete(path);
    });
  return next;
}

export interface PutOptions {
  /** Last known sha of the file being updated. Omit to create a new file. */
  sha?: string | null;
  message: string;
}

async function putFile(path: string, base64: string, { sha, message }: PutOptions, deps: WriteDeps): Promise<CreatedFile> {
  const config = requireConfig();
  return enqueue(path, async () => {
    const url = contentsUrl(config, path);
    const payload = {
      message,
      content: base64,
      branch: config.branch,
      ...(sha ? { sha } : {}),
      ...authorFields(),
    };
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const res = await ghCall('PUT', url, payload, deps);
      if (res.ok) {
        const json = (await res.json().catch(() => ({}))) as { content?: { sha?: string } };
        return { path, sha: json.content?.sha ?? '' };
      }
      if (res.status === 409 || res.status === 422) {
        // Stale sha (or a file that already exists)? That is a conflict. Otherwise the branch just moved: retry.
        const current = await getFile(path, deps);
        const stale = (current?.sha ?? null) !== (sha ?? null);
        if (stale) throw new ConflictError(path, current ? { text: current.text, sha: current.sha } : null);
        if (res.status === 422 && attempt === MAX_ATTEMPTS - 1) throw new GithubError(`GitHub rejected the change to ${path}`, 422);
        continue;
      }
      failFor(res, path);
    }
    throw new GithubError('GitHub is busy, please try again', 409);
  });
}

/** Create or update a JSON file (2-space indent, trailing newline). Pass `sha` to update. */
export function putJson(path: string, data: unknown, options: PutOptions, deps: WriteDeps = {}): Promise<CreatedFile> {
  const text = `${JSON.stringify(data, null, 2)}\n`;
  return putFile(path, Buffer.from(text, 'utf8').toString('base64'), options, deps);
}

/** Upload (create, or replace when `sha` is given) a binary file such as an image. */
export function putBinary(path: string, buffer: Buffer, options: PutOptions, deps: WriteDeps = {}): Promise<CreatedFile> {
  return putFile(path, buffer.toString('base64'), options, deps);
}

export async function deleteFile(path: string, sha: string, message: string, deps: WriteDeps = {}): Promise<void> {
  const config = requireConfig();
  await enqueue(path, async () => {
    const res = await ghCall('DELETE', contentsUrl(config, path), { message, sha, branch: config.branch, ...authorFields() }, deps);
    if (res.ok) return;
    if (res.status === 409 || res.status === 422) {
      const current = await getFile(path, deps);
      throw new ConflictError(path, current ? { text: current.text, sha: current.sha } : null);
    }
    failFor(res, path);
  });
}

export interface CommitInfo {
  sha: string;
  message: string;
  date: string;
  author: string;
  url: string;
}

/** Latest commits on the data branch, optionally limited to one path. */
export async function getCommits(path: string | undefined, limit = 20, deps: WriteDeps = {}): Promise<CommitInfo[]> {
  const config = requireConfig();
  const params = new URLSearchParams({ sha: config.branch, per_page: String(Math.min(Math.max(limit, 1), 100)) });
  if (path) params.set('path', path);
  const res = await ghCall('GET', `${GITHUB_API}/repos/${config.owner}/${config.repo}/commits?${params}`, undefined, deps);
  if (!res.ok) failFor(res, path ?? 'commits');
  const list = (await res.json()) as Array<{
    sha: string;
    html_url: string;
    commit: { message: string; author?: { name?: string; date?: string } };
  }>;
  return list.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split('\n')[0],
    date: c.commit.author?.date ?? '',
    author: c.commit.author?.name ?? '',
    url: c.html_url,
  }));
}
