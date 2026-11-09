import { revalidateTag } from 'next/cache';
import { guardAdminApi, json } from '@/lib/auth/guard';
import { isContentName, readAdminContent } from '@/lib/admin/content';
import { getGithubConfig } from '@/lib/github';
import { ConflictError, getFile, putJson } from '@/lib/github-write';
import { buildRows, buildSavedOverlay } from '@/lib/i18n/admin';
import { overlayPath, seedOverlay } from '@/lib/i18n/content';
import { normalizeOverlay } from '@/lib/i18n/overlay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type Ctx = { params: Promise<{ name: string }> };

/** GET → every translatable English string of one document with its Odia text, plus the sha of the saved file. */
export async function GET(request: Request, { params }: Ctx) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;
  const { name } = await params;
  if (!isContentName(name)) return json({ ok: false, message: 'Unknown content.' }, 404);

  try {
    const english = (await readAdminContent(name)).data;
    let saved = {};
    let sha: string | null = null;
    if (getGithubConfig()) {
      const file = await getFile(overlayPath(name));
      if (file) {
        sha = file.sha;
        try {
          saved = normalizeOverlay(JSON.parse(file.text));
        } catch {
          saved = {};
        }
      }
    }
    return json({ ok: true, connected: Boolean(getGithubConfig()), sha, rows: buildRows(name, english, seedOverlay(name), saved) });
  } catch (err) {
    console.error(`[admin] translations ${name} failed:`, (err as Error).message);
    return json({ ok: false, message: 'Could not load the translations from GitHub. Please try again.' }, 502);
  }
}

/** PUT { translations: { path: "ଓଡ଼ିଆ text" }, sha } → saved as content/or/<name>.json on the data branch. */
export async function PUT(request: Request, { params }: Ctx) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;
  const { name } = await params;
  if (!isContentName(name)) return json({ ok: false, message: 'Unknown content.' }, 404);
  if (!getGithubConfig()) {
    return json({ ok: false, message: 'GitHub is not connected, so translations cannot be saved. Set the GITHUB_* variables first.' }, 409);
  }

  let body: { translations?: unknown; sha?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > 600_000) return json({ ok: false, message: 'That is too large to save.' }, 413);
    body = JSON.parse(raw) as typeof body;
  } catch {
    return json({ ok: false, message: 'Invalid request.' }, 400);
  }
  const sha = typeof body.sha === 'string' && body.sha ? body.sha : null;

  try {
    const english = (await readAdminContent(name)).data;
    const built = buildSavedOverlay(name, english, body.translations);
    if (!built.ok) return json({ ok: false, message: built.message }, 422);

    const written = await putJson(overlayPath(name), built.overlay, { sha, message: `admin: update Odia translations (${name})` });
    revalidateTag('content', { expire: 0 });
    revalidateTag(`content:or:${name}`, { expire: 0 });
    return json({ ok: true, sha: written.sha });
  } catch (err) {
    if (err instanceof ConflictError) {
      return json({ ok: false, conflict: true, message: 'The translations were changed elsewhere. Reload the latest version?' }, 409);
    }
    console.error(`[admin] save translations ${name} failed:`, (err as Error).message);
    return json({ ok: false, message: 'Could not save to GitHub. Please try again.' }, 502);
  }
}
