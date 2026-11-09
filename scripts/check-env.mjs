#!/usr/bin/env node
/**
 * Runs before every build (`prebuild` in package.json).
 *
 *  - Vercel PRODUCTION build (VERCEL_ENV=production): stops with a readable list when a REQUIRED variable is missing,
 *    so a half-configured site is never published.
 *  - Preview builds and local builds: only prints warnings.
 *  - ADMIN_CODE still gkds1993: a warning (never a failure); the admin Dashboard also flags it until the code is changed.
 *  - ALLOW_SEED_ONLY=1 skips the check (the site then runs on its built-in content, with no admin saving).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const REQUIRED = [
  ['GITHUB_TOKEN', 'a fine-grained GitHub token with Contents: Read and write on the repo (see docs/DEPLOYMENT.md, step 3)'],
  ['GITHUB_OWNER', 'your GitHub username'],
  ['GITHUB_REPO', 'the repository name, for example gkds'],
  ['GITHUB_BRANCH', 'the content branch, normally: data'],
  ['ADMIN_JWT_SECRET', 'a long random secret for admin logins (openssl rand -base64 32)'],
  ['NEXT_PUBLIC_SITE_URL', 'the final website address with https, no slash at the end'],
  ['REVALIDATE_SECRET', 'any long random string'],
];

/** Pure check: which required variables are missing, and which warnings apply. */
export function checkEnv(env) {
  const missing = REQUIRED.filter(([name]) => !String(env[name] ?? '').trim());
  const warnings = [];

  const code = String(env.ADMIN_CODE ?? '').trim();
  if (!code || code === 'gkds1993') {
    warnings.push('ADMIN_CODE is not set or is still the default (gkds1993). Set your own code in Vercel and change it again on the admin Security page.');
  }
  const url = String(env.NEXT_PUBLIC_SITE_URL ?? '').trim();
  if (url && !/^https:\/\//.test(url)) warnings.push('NEXT_PUBLIC_SITE_URL should start with https://');
  if (url.endsWith('/')) warnings.push('NEXT_PUBLIC_SITE_URL should not end with a slash.');
  if (env.GITHUB_BRANCH && String(env.GITHUB_BRANCH).trim() === 'main') {
    warnings.push('GITHUB_BRANCH is "main": every admin save would be a new commit on your code branch and trigger a new deployment. Use "data".');
  }
  const secret = String(env.ADMIN_JWT_SECRET ?? '');
  if (secret && secret.length < 32) warnings.push('ADMIN_JWT_SECRET is short. Use at least 32 random characters.');
  return { missing, warnings };
}

function loadLocalEnv(root) {
  const file = join(root, '.env.local');
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

export function run(env = process.env, log = console) {
  if (env.ALLOW_SEED_ONLY === '1') {
    log.log('[check-env] ALLOW_SEED_ONLY=1: skipping the environment check (the site will use its built-in content).');
    return 0;
  }
  const production = env.VERCEL_ENV === 'production';
  const { missing, warnings } = checkEnv(env);

  for (const w of warnings) log.warn(`[check-env] warning: ${w}`);

  if (missing.length === 0) return 0;

  const list = missing.map(([name, how]) => `    - ${name}: ${how}`).join('\n');
  if (production) {
    log.error(
      [
        '',
        '[check-env] The production build was stopped: some required environment variables are missing.',
        '',
        list,
        '',
        'Add them in Vercel: Project → Settings → Environment Variables (Production), then redeploy.',
        'Step-by-step help: docs/DEPLOYMENT.md. (Set ALLOW_SEED_ONLY=1 to build without them: the site then shows its built-in content and the admin cannot save.)',
        '',
      ].join('\n'),
    );
    return 1;
  }
  log.warn(`[check-env] not set (fine for local work and previews, required in production):\n${list}`);
  return 0;
}

// run only when started from the command line (so tests can import checkEnv)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  // locally the variables live in .env.local (Vercel passes them in the environment)
  process.exit(run({ ...loadLocalEnv(root), ...process.env }));
}
