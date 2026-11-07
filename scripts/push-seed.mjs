#!/usr/bin/env node
/**
 * Upload content-seed/*.json to `content/` on the DATA branch of the private repo.
 *
 *   node scripts/push-seed.mjs              # create missing files only (safe; never overwrites admin edits)
 *   node scripts/push-seed.mjs --overwrite  # also replace files that already exist
 *   node scripts/push-seed.mjs --dry-run    # show what would happen
 *
 * Needs GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO (and optionally GITHUB_BRANCH, default "data")
 * in the environment or in .env.local. The repo must already contain at least one commit
 * (push your code to `main` first). If the data branch does not exist it is created as an
 * orphan branch (no code, no shared history).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const OVERWRITE = args.has('--overwrite');
const DRY = args.has('--dry-run');

// ---- load .env.local without extra dependencies ----
const envFile = join(root, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

const token = process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const branch = process.env.GITHUB_BRANCH || 'data';

const missing = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}\nSet them in .env.local (see .env.example).`);
  process.exit(1);
}

const api = `https://api.github.com/repos/${owner}/${repo}`;
async function gh(path, init = {}) {
  const res = await fetch(`${api}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'gkds-push-seed',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  return res;
}
async function ghJson(path, init) {
  const res = await gh(path, init);
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function ensureBranch() {
  const b = await ghJson(`/branches/${encodeURIComponent(branch)}`);
  if (b.ok) {
    console.log(`✓ Branch "${branch}" exists`);
    return;
  }
  if (b.status !== 404) throw new Error(`Could not check branch (${b.status}): ${b.body.message}`);

  console.log(`Branch "${branch}" not found → creating an orphan branch…`);
  if (DRY) return;
  const blob = await ghJson('/git/blobs', {
    method: 'POST',
    body: JSON.stringify({
      content: `# ${repo} – data branch\n\nContent, images and submissions managed by the admin panel. Do not put code here.\n`,
      encoding: 'utf-8',
    }),
  });
  if (!blob.ok) throw new Error(`Cannot create blob (${blob.status}): ${blob.body.message}. Push your code to the default branch first.`);
  const tree = await ghJson('/git/trees', {
    method: 'POST',
    body: JSON.stringify({ tree: [{ path: 'README.md', mode: '100644', type: 'blob', sha: blob.body.sha }] }),
  });
  if (!tree.ok) throw new Error(`Cannot create tree: ${tree.body.message}`);
  const commit = await ghJson('/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message: 'chore: create data branch', tree: tree.body.sha, parents: [] }),
  });
  if (!commit.ok) throw new Error(`Cannot create commit: ${commit.body.message}`);
  const ref = await ghJson('/git/refs', {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.body.sha }),
  });
  if (!ref.ok) throw new Error(`Cannot create branch: ${ref.body.message}`);
  console.log(`✓ Created orphan branch "${branch}"`);
}

async function upload(file) {
  const remotePath = `content/${file}`;
  const content = readFileSync(join(root, 'content-seed', file));
  JSON.parse(content.toString('utf8')); // refuse to upload invalid JSON

  const existing = await ghJson(`/contents/${remotePath}?ref=${encodeURIComponent(branch)}`);
  if (existing.ok && !OVERWRITE) {
    console.log(`– skipped ${remotePath} (already exists; use --overwrite to replace)`);
    return;
  }
  if (!existing.ok && existing.status !== 404) {
    throw new Error(`Cannot check ${remotePath} (${existing.status}): ${existing.body.message}`);
  }
  if (DRY) {
    console.log(`(dry-run) would ${existing.ok ? 'update' : 'create'} ${remotePath}`);
    return;
  }
  const put = await ghJson(`/contents/${remotePath}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `${existing.ok ? 'seed: reset' : 'seed: add'} ${file}`,
      content: content.toString('base64'),
      branch,
      ...(existing.ok ? { sha: existing.body.sha } : {}),
    }),
  });
  if (!put.ok) throw new Error(`Upload failed for ${remotePath} (${put.status}): ${put.body.message}`);
  console.log(`✓ ${existing.ok ? 'updated' : 'created'} ${remotePath}`);
}

try {
  console.log(`Repository: ${owner}/${repo}  Branch: ${branch}${DRY ? '  (dry run)' : ''}`);
  await ensureBranch();
  const files = readdirSync(join(root, 'content-seed')).filter((f) => f.endsWith('.json')).sort();
  for (const f of files) await upload(f);
  console.log('Done.');
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(1);
}
