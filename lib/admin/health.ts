import 'server-only';
import { GITHUB_API, getGithubConfig } from '@/lib/github';

export interface HealthCheck {
  id: 'token' | 'repo' | 'branch' | 'rate';
  label: string;
  ok: boolean;
  detail: string;
}

async function gh(path: string, token: string): Promise<Response | null> {
  try {
    return await fetch(`${GITHUB_API}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'gkds-site',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return null;
  }
}

/** Is GitHub (the only data store) reachable and correctly set up? Never includes the token in any detail. */
export async function checkGithubHealth(): Promise<{ connected: boolean; checks: HealthCheck[] }> {
  const config = getGithubConfig();
  if (!config) {
    const detail = 'Not configured (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO). The site is showing the built-in content.';
    return {
      connected: false,
      checks: [
        { id: 'token', label: 'GitHub token', ok: false, detail },
        { id: 'repo', label: 'Repository reachable', ok: false, detail: '—' },
        { id: 'branch', label: 'Branch “data” exists', ok: false, detail: '—' },
        { id: 'rate', label: 'API rate limit', ok: false, detail: '—' },
      ],
    };
  }

  const [repo, branch, rate] = await Promise.all([
    gh(`/repos/${config.owner}/${config.repo}`, config.token),
    gh(`/repos/${config.owner}/${config.repo}/branches/${encodeURIComponent(config.branch)}`, config.token),
    gh('/rate_limit', config.token),
  ]);

  const unauthorized = [repo, branch, rate].some((r) => r?.status === 401);
  let remaining = '';
  if (rate?.ok) {
    try {
      const j = (await rate.json()) as { resources?: { core?: { remaining?: number; limit?: number } } };
      const core = j.resources?.core;
      if (core) remaining = `${core.remaining} of ${core.limit} requests left this hour`;
    } catch {
      /* ignore */
    }
  }

  const checks: HealthCheck[] = [
    {
      id: 'token',
      label: 'GitHub token',
      ok: !unauthorized && repo !== null && repo.status !== 401,
      detail: unauthorized ? 'GitHub rejected the token (expired or wrong).' : repo ? 'Token accepted.' : 'Could not reach GitHub.',
    },
    {
      id: 'repo',
      label: 'Repository reachable',
      ok: Boolean(repo?.ok),
      detail: repo?.ok ? `${config.owner}/${config.repo}` : repo?.status === 404 ? 'Repository not found (check GITHUB_OWNER / GITHUB_REPO and the token’s access).' : 'Not reachable.',
    },
    {
      id: 'branch',
      label: `Branch “${config.branch}” exists`,
      ok: Boolean(branch?.ok),
      detail: branch?.ok ? 'Found.' : branch?.status === 404 ? 'Branch not found. Run the seed script (docs/DATA_REPO.md).' : 'Could not check.',
    },
    {
      id: 'rate',
      label: 'API rate limit',
      ok: Boolean(rate?.ok) && !remaining.startsWith('0 '),
      detail: remaining || 'Could not read the rate limit.',
    },
  ];
  return { connected: checks.every((c) => c.ok), checks };
}
