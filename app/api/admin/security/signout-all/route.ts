import { getAdminConfig, saveAdminConfig } from '@/lib/auth/admin-config';
import { SESSION_COOKIE } from '@/lib/auth/constants';
import { guardAdminApi, json } from '@/lib/auth/guard';
import { sessionCookieOptions, signSession } from '@/lib/auth/session';
import { getGithubConfig } from '@/lib/github';
import { ConflictError } from '@/lib/github-write';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/admin/security/signout-all — bumps the session version (all other devices are signed out). */
export async function POST(request: Request) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;

  if (!getGithubConfig()) {
    return json({ ok: false, message: 'GitHub is not connected, so sessions cannot be reset.' }, 409);
  }

  try {
    const { config, sha } = await getAdminConfig();
    const sessionVersion = (config?.sessionVersion ?? 0) + 1;
    // with no stored code yet, hash/salt stay empty and the environment code keeps working
    await saveAdminConfig(
      { hash: config?.hash ?? '', salt: config?.salt ?? '', updatedAt: config?.updatedAt ?? new Date().toISOString(), sessionVersion },
      sha,
      'admin: sign out all devices',
    );
    const res = json({ ok: true, message: 'Signed out everywhere else. You stay signed in on this device.' });
    res.cookies.set(SESSION_COOKIE, await signSession(sessionVersion), sessionCookieOptions());
    return res;
  } catch (err) {
    if (err instanceof ConflictError) return json({ ok: false, message: 'Changed elsewhere. Please try again.' }, 409);
    console.error('[admin] signout-all failed:', (err as Error).message);
    return json({ ok: false, message: 'Could not sign out other devices. Please try again.' }, 502);
  }
}
