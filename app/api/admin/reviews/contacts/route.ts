import { guardAdminApi, json } from '@/lib/auth/guard';
import { getGithubConfig, listDir } from '@/lib/github';
import { getFile } from '@/lib/github-write';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_FILES = 150;

/**
 * GET /api/admin/reviews/contacts → { contacts: { [reviewId]: { phone } } }
 * Visitors may leave an optional phone number with a review. It is stored in a private file
 * (submissions/reviews/<id>.json), never in reviews.json, and only this admin API reads it.
 */
export async function GET(request: Request) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;
  if (!getGithubConfig()) return json({ ok: true, contacts: {} });

  try {
    const entries = (await listDir('submissions/reviews', { revalidate: 0 }))
      .filter((e) => e.type === 'file' && e.name.endsWith('.json'))
      .slice(-MAX_FILES);
    const contacts: Record<string, { phone: string }> = {};
    await Promise.all(
      entries.map(async (e) => {
        try {
          const file = await getFile(e.path);
          if (!file) return;
          const data = JSON.parse(file.text) as { id?: unknown; phone?: unknown };
          // untrusted content: keep only short plain strings that look like a phone number
          if (typeof data.id === 'string' && typeof data.phone === 'string' && /^[+0-9 ()-]{6,20}$/.test(data.phone)) {
            contacts[data.id] = { phone: data.phone };
          }
        } catch {
          /* a malformed file is simply skipped */
        }
      }),
    );
    return json({ ok: true, contacts });
  } catch (err) {
    console.error('[admin] contacts list failed:', (err as Error).message);
    return json({ ok: true, contacts: {} });
  }
}
