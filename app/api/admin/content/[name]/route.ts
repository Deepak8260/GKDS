import { guardAdminApi, json } from '@/lib/auth/guard';
import { isContentName, contentPath, readAdminContent, revalidateContent } from '@/lib/admin/content';
import { getGithubConfig } from '@/lib/github';
import { ConflictError, getCommits, putJson } from '@/lib/github-write';
import { parseContent } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_BODY = 1_000_000;

type Ctx = { params: Promise<{ name: string }> };

/** GET /api/admin/content/[name] → { data, sha, updatedAt } */
export async function GET(request: Request, { params }: Ctx) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;
  const { name } = await params;
  if (!isContentName(name)) return json({ ok: false, message: 'Unknown content.' }, 404);

  try {
    return json({ ok: true, ...(await readAdminContent(name)) });
  } catch (err) {
    console.error(`[admin] read ${name} failed:`, (err as Error).message);
    return json({ ok: false, message: 'Could not load this content from GitHub. Please try again.' }, 502);
  }
}

/** PUT /api/admin/content/[name]  { data, sha } → validate, commit, revalidate. */
export async function PUT(request: Request, { params }: Ctx) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;
  const { name } = await params;
  if (!isContentName(name)) return json({ ok: false, message: 'Unknown content.' }, 404);

  if (!getGithubConfig()) {
    return json({ ok: false, message: 'GitHub is not connected, so changes cannot be saved. Set the GITHUB_* variables first.' }, 409);
  }

  let body: { data?: unknown; sha?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ ok: false, message: 'That is too large to save.' }, 413);
    body = JSON.parse(raw) as typeof body;
  } catch {
    return json({ ok: false, message: 'Invalid request.' }, 400);
  }
  const sha = typeof body.sha === 'string' && body.sha ? body.sha : null;

  // validate BEFORE committing anything
  const parsed = parseContent(name, body.data);
  if (!parsed.ok) return json({ ok: false, message: 'Please fix the highlighted fields.', errors: parsed.errors }, 422);

  try {
    const written = await putJson(contentPath(name), parsed.data, { sha, message: `admin: update ${name}.json` });
    revalidateContent(name);
    let updatedAt = new Date().toISOString();
    try {
      updatedAt = (await getCommits(contentPath(name), 1))[0]?.date ?? updatedAt;
    } catch {
      /* keep the local time */
    }
    return json({ ok: true, sha: written.sha, updatedAt, data: parsed.data });
  } catch (err) {
    if (err instanceof ConflictError) {
      let current: unknown = null;
      try {
        current = err.current ? JSON.parse(err.current.text) : null;
      } catch {
        current = null;
      }
      return json(
        { ok: false, conflict: true, message: 'This was changed elsewhere. Reload the latest version?', current: { data: current, sha: err.current?.sha ?? null } },
        409,
      );
    }
    console.error(`[admin] save ${name} failed:`, (err as Error).message);
    return json({ ok: false, message: 'Could not save to GitHub. Please try again.' }, 502);
  }
}
