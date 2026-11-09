import { guardAdminApi, json } from '@/lib/auth/guard';
import { revalidateContent } from '@/lib/admin/content';
import { markRevalidated } from '@/lib/admin/revalidate-state';
import { contentNames } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/admin/revalidate — "Refresh website cache": the public pages re-read the content from GitHub. */
export async function POST(request: Request) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;
  revalidateContent();
  for (const name of contentNames) revalidateContent(name);
  return json({ ok: true, at: markRevalidated() });
}
