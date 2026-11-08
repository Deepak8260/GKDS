import { getAdminConfig, saveAdminConfig } from '@/lib/auth/admin-config';
import { hashAccessCode, validateNewCode, verifyAccessCode } from '@/lib/auth/code';
import { SESSION_COOKIE } from '@/lib/auth/constants';
import { callerId, guardAdminApi, json } from '@/lib/auth/guard';
import { sessionCookieOptions, signSession } from '@/lib/auth/session';
import { loginThrottle } from '@/lib/auth/throttle';
import { getGithubConfig } from '@/lib/github';
import { ConflictError } from '@/lib/github-write';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/admin/security/code  { current, next } — change the access code; signs out every other device. */
export async function POST(request: Request) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;

  if (!getGithubConfig()) {
    return json({ ok: false, message: 'GitHub is not connected, so a new code cannot be stored. Set the GITHUB_* variables first.' }, 409);
  }

  const { ip } = callerId(request);
  const wait = loginThrottle.blockedFor(ip);
  if (wait > 0) return json({ ok: false, message: `Too many attempts. Try again in ${Math.max(1, Math.ceil(wait / 60))} minutes.` }, 429);

  let body: { current?: unknown; next?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, message: 'Invalid request.' }, 400);
  }
  const current = typeof body.current === 'string' ? body.current : '';
  const next = typeof body.next === 'string' ? body.next : '';

  const rule = validateNewCode(next);
  if (!rule.ok) return json({ ok: false, message: rule.message, field: 'next' }, 422);

  try {
    const { config, sha } = await getAdminConfig();
    if (!(await verifyAccessCode(current, { config }))) {
      await new Promise((r) => setTimeout(r, loginThrottle.fail(ip)));
      return json({ ok: false, message: 'The current code is not correct.', field: 'current' }, 422);
    }
    loginThrottle.succeed(ip);

    const { hash, salt } = await hashAccessCode(next);
    const sessionVersion = (config?.sessionVersion ?? 0) + 1;
    await saveAdminConfig({ hash, salt, updatedAt: new Date().toISOString(), sessionVersion }, sha, 'admin: update access code');

    const res = json({ ok: true, message: 'Access code updated. Other devices were signed out.' });
    res.cookies.set(SESSION_COOKIE, await signSession(sessionVersion), sessionCookieOptions());
    return res;
  } catch (err) {
    if (err instanceof ConflictError) {
      return json({ ok: false, message: 'The security settings were changed elsewhere. Please try again.' }, 409);
    }
    console.error('[admin] code change failed:', (err as Error).message);
    return json({ ok: false, message: 'Could not save the new code. Please try again.' }, 502);
  }
}
