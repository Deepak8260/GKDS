import { guardAdminApi, json } from '@/lib/auth/guard';
import { prettifyCommit } from '@/lib/admin/commits';
import { contentPath, isContentName } from '@/lib/admin/content';
import { getGithubConfig } from '@/lib/github';
import { getCommits, getFileAtRef } from '@/lib/github-write';
import { parseContent } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type Ctx = { params: Promise<{ name: string }> };

/**
 * GET /api/admin/history/[name]            → the last 20 commits that touched content/<name>.json
 * GET /api/admin/history/[name]?sha=<sha>  → that version of the file, validated with today's schema
 * (Restoring only loads it into the editor as a draft; saving makes a NEW commit. History is never rewritten.)
 */
export async function GET(request: Request, { params }: Ctx) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;
  const { name } = await params;
  if (!isContentName(name)) return json({ ok: false, message: 'Unknown content.' }, 404);
  if (!getGithubConfig()) return json({ ok: true, connected: false, commits: [] });

  const path = contentPath(name);
  const sha = new URL(request.url).searchParams.get('sha');

  try {
    if (!sha) {
      const commits = await getCommits(path, 20);
      return json({
        ok: true,
        connected: true,
        commits: commits.map((c) => ({ sha: c.sha, short: c.sha.slice(0, 7), message: prettifyCommit(c.message), raw: c.message, date: c.date, author: c.author, url: c.url })),
      });
    }

    if (!/^[0-9a-f]{7,40}$/i.test(sha)) return json({ ok: false, message: 'Invalid version.' }, 400);
    const text = await getFileAtRef(path, sha);
    if (text === null) return json({ ok: false, message: 'That version does not contain this page yet.' }, 404);
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(text);
    } catch {
      return json({ ok: false, message: 'That version could not be read.' }, 422);
    }
    const parsed = parseContent(name, parsedJson);
    if (!parsed.ok) {
      return json({ ok: false, message: 'That older version no longer fits the current page layout, so it cannot be restored here.', errors: parsed.errors }, 422);
    }
    return json({ ok: true, data: parsed.data });
  } catch (err) {
    console.error(`[admin] history ${name} failed:`, (err as Error).message);
    return json({ ok: false, message: 'Could not load the history from GitHub. Please try again.' }, 502);
  }
}
