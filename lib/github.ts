import 'server-only';

/**
 * Minimal GitHub REST client (fetch only) used to read the data branch of the
 * private repo. Write helpers arrive in lib/github-write.ts (prompts 07 and 10).
 * The token never leaves the server.
 */

const API = 'https://api.github.com';
export const GITHUB_API = API;
const TIMEOUT_MS = 8000;

export class GithubError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
  ) {
    super(message);
    this.name = 'GithubError';
  }
}
export class GithubNotFoundError extends GithubError {
  constructor(path: string) {
    super(`GitHub: not found – ${path}`, 404);
    this.name = 'GithubNotFoundError';
  }
}
export class GithubAuthError extends GithubError {
  constructor(status = 401) {
    super('GitHub: authentication failed (check GITHUB_TOKEN)', status);
    this.name = 'GithubAuthError';
  }
}
export class GithubRateLimitError extends GithubError {
  constructor(public readonly retryAfter?: number) {
    super('GitHub: rate limit reached', 429);
    this.name = 'GithubRateLimitError';
  }
}

export interface GithubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export function getGithubConfig(): GithubConfig | null {
  const token = process.env.GITHUB_TOKEN?.trim();
  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  const branch = process.env.GITHUB_BRANCH?.trim() || 'data';
  if (!token || !owner || !repo) return null;
  return { token, owner, repo, branch };
}

/** False when any of GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO is missing (site runs on seed content). */
export function isGithubConfigured(): boolean {
  return getGithubConfig() !== null;
}

/** URL-encode each segment of a repo path ("media/my file.webp" → "media/my%20file.webp"). */
export function encodePath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
}

interface FetchOptions {
  accept?: string;
  next?: { revalidate?: number | false; tags?: string[] };
  cache?: RequestCache;
}

/** fetch with auth headers, an 8 s timeout and one retry on network errors / 5xx. */
async function ghFetch(url: string, opts: FetchOptions = {}): Promise<Response> {
  const config = getGithubConfig();
  if (!config) throw new GithubAuthError(401);

  const init: RequestInit & { next?: FetchOptions['next'] } = {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: opts.accept ?? 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'gkds-site',
    },
    ...(opts.cache ? { cache: opts.cache } : {}),
    ...(opts.next ? { next: opts.next } : {}),
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.status >= 500 && attempt === 0) {
        lastError = new GithubError(`GitHub responded ${res.status}`, res.status);
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt === 1) break;
    }
  }
  throw lastError instanceof GithubError
    ? lastError
    : new GithubError(`GitHub request failed: ${(lastError as Error)?.message ?? 'network error'}`, 502);
}

function assertOk(res: Response, path: string): void {
  if (res.ok) return;
  if (res.status === 404) throw new GithubNotFoundError(path);
  if (res.status === 401) throw new GithubAuthError(401);
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    if (res.status === 429 || remaining === '0' || res.headers.has('retry-after')) {
      const retry = Number(res.headers.get('retry-after'));
      throw new GithubRateLimitError(Number.isFinite(retry) && retry > 0 ? retry : undefined);
    }
    throw new GithubAuthError(403);
  }
  throw new GithubError(`GitHub responded ${res.status}`, res.status);
}

function contentsUrl(path: string): string {
  const config = getGithubConfig();
  if (!config) throw new GithubAuthError(401);
  return `${API}/repos/${config.owner}/${config.repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(config.branch)}`;
}

export interface ReadOptions {
  /** ISR window in seconds (default 3600). */
  revalidate?: number | false;
  /** Cache tags for on-demand revalidation. */
  tags?: string[];
}

/** Read and JSON-parse a file from the data branch (cached with Next tags + ISR). */
export async function readJson<T = unknown>(path: string, opts: ReadOptions = {}): Promise<T> {
  const res = await ghFetch(contentsUrl(path), {
    accept: 'application/vnd.github.raw+json',
    next: { revalidate: opts.revalidate ?? 3600, tags: opts.tags ?? ['content'] },
  });
  assertOk(res, path);
  const body = await res.text();
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new GithubError(`Invalid JSON in ${path}`, 422);
  }
}

/** Read raw bytes (images). Not stored in the Next data cache; the CDN caches the proxied response. */
export async function readRaw(path: string): Promise<Buffer> {
  const res = await ghFetch(contentsUrl(path), {
    accept: 'application/vnd.github.raw+json',
    cache: 'no-store',
  });
  assertOk(res, path);
  return Buffer.from(await res.arrayBuffer());
}

export interface DirEntry {
  name: string;
  path: string;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  sha: string;
  size: number;
}

/** List a directory on the data branch. Returns [] if the directory does not exist. */
export async function listDir(path: string, opts: ReadOptions = {}): Promise<DirEntry[]> {
  const res = await ghFetch(contentsUrl(path), {
    next: { revalidate: opts.revalidate ?? 60, tags: opts.tags ?? ['content'] },
  });
  if (res.status === 404) return [];
  assertOk(res, path);
  const data = (await res.json()) as DirEntry[] | DirEntry;
  const list = Array.isArray(data) ? data : [data];
  return list.map(({ name, path: p, type, sha, size }) => ({ name, path: p, type, sha, size }));
}
