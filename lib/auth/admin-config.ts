import 'server-only';
import { getGithubConfig } from '@/lib/github';
import { getFile, putJson } from '@/lib/github-write';
import { adminConfigSchema, type AdminConfig } from '@/lib/validators';

/** `config/admin.json` on the data branch (never served by the media proxy or the content API). */
export const ADMIN_CONFIG_PATH = 'config/admin.json';
const CACHE_MS = 30_000;

interface Loaded {
  config: AdminConfig | null;
  sha: string | null;
}

let cache: { at: number; value: Loaded } | null = null;

export function clearAdminConfigCache() {
  cache = null;
}

/**
 * Current admin config. A missing file (or GitHub not configured) = no stored code yet (`config: null`).
 * Any OTHER failure throws: the login then fails closed instead of silently falling back to the default code.
 */
export async function getAdminConfig(now = Date.now()): Promise<Loaded> {
  if (cache && now - cache.at < CACHE_MS) return cache.value;
  let value: Loaded = { config: null, sha: null };
  if (getGithubConfig()) {
    const file = await getFile(ADMIN_CONFIG_PATH);
    if (file) {
      const parsed = adminConfigSchema.safeParse(JSON.parse(file.text));
      if (!parsed.success) throw new Error('config/admin.json is invalid');
      value = { config: parsed.data, sha: file.sha };
    }
  }
  cache = { at: now, value };
  return value;
}

/** The session version that tokens must carry (0 when there is no stored config). */
export async function currentSessionVersion(): Promise<number> {
  return (await getAdminConfig()).config?.sessionVersion ?? 0;
}

export async function saveAdminConfig(next: AdminConfig, sha: string | null, message: string): Promise<void> {
  if (!getGithubConfig()) throw new Error('GitHub is not configured');
  await putJson(ADMIN_CONFIG_PATH, next, { sha, message });
  clearAdminConfigCache();
}
