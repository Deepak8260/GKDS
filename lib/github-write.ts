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
