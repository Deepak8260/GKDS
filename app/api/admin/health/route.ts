import { guardAdminApi, json } from '@/lib/auth/guard';
import { checkGithubHealth } from '@/lib/admin/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/admin/health — GitHub connection checks for the dashboard and the top-bar dot. */
export async function GET(request: Request) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;
  return json({ ok: true, ...(await checkGithubHealth()) });
}
