import { guardAdminApi, json } from '@/lib/auth/guard';
import { buildBackup, planRestore } from '@/lib/admin/backup';
import { contentPath, readAdminContent, revalidateContent } from '@/lib/admin/content';
import { getGithubConfig } from '@/lib/github';
import { ConflictError, getFile, putJson } from '@/lib/github-write';
import { contentNames, type ContentName } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_BASE64 = 14_000_000;

async function readAll(): Promise<Record<ContentName, unknown>> {
  const out = {} as Record<ContentName, unknown>;
  await Promise.all(contentNames.map(async (name) => void (out[name] = (await readAdminContent(name)).data)));
  return out;
}

/** GET /api/admin/backup — a ZIP with content/*.json and a README (pictures are not included: they live in the repository). */
export async function GET(request: Request) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;
  try {
    const zip = buildBackup(await readAll());
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(new Uint8Array(zip), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="gkds-content-backup-${stamp}.zip"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[admin] backup failed:', (err as Error).message);
    return json({ ok: false, message: 'Could not create the backup. Please try again.' }, 502);
  }
}

/**
 * POST /api/admin/backup  { dataBase64, confirm? }
 *  - without `confirm`: a preview of what restoring would change (validates every file)
 *  - with confirm "RESTORE": saves each changed file as its own new commit
 */
export async function POST(request: Request) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;

  let body: { dataBase64?: unknown; confirm?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > MAX_BASE64 + 1000) return json({ ok: false, message: 'That file is too large.' }, 413);
    body = JSON.parse(raw) as typeof body;
  } catch {
    return json({ ok: false, message: 'Invalid request.' }, 400);
  }
  if (typeof body.dataBase64 !== 'string' || !body.dataBase64) return json({ ok: false, message: 'Choose a backup ZIP first.' }, 400);

  let plan;
  try {
    plan = planRestore(Buffer.from(body.dataBase64, 'base64'), await readAll());
  } catch (err) {
    console.error('[admin] backup preview failed:', (err as Error).message);
    return json({ ok: false, message: 'Could not read the current content. Please try again.' }, 502);
  }
  const summary = {
    files: plan.files.map((f) => ({ name: f.name, path: f.path, status: f.status, errors: f.errors, changes: f.changes, totalChanges: f.totalChanges })),
    ignored: plan.ignored,
    canRestore: plan.canRestore,
    error: plan.error,
  };

  if (body.confirm === undefined) return json({ ok: true, preview: summary });

  // restoring: the person must have typed RESTORE, nothing may be invalid, and GitHub must be connected
  if (body.confirm !== 'RESTORE') return json({ ok: false, message: 'Type RESTORE to confirm.' }, 400);
  if (!plan.canRestore) return json({ ok: false, message: plan.error ?? 'This backup cannot be restored. Check the preview for problems.', preview: summary }, 422);
  if (!getGithubConfig()) return json({ ok: false, message: 'GitHub is not connected, so changes cannot be saved. Set the GITHUB_* variables first.' }, 409);

  const results: { name: string; ok: boolean; message?: string }[] = [];
  for (const file of plan.files.filter((f) => f.status === 'changed')) {
    try {
      const current = await getFile(contentPath(file.name));
      await putJson(contentPath(file.name), file.data, { sha: current?.sha ?? null, message: `admin: restore ${file.name}.json from backup` });
      revalidateContent(file.name);
      results.push({ name: file.name, ok: true });
    } catch (err) {
      results.push({ name: file.name, ok: false, message: err instanceof ConflictError ? 'It was changed elsewhere meanwhile. Try again.' : 'Could not save to GitHub.' });
    }
  }
  const allOk = results.every((r) => r.ok);
  return json({ ok: allOk, results, message: allOk ? undefined : 'Some files could not be restored. See the list.' }, allOk ? 200 : 207);
}
