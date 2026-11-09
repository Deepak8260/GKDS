import { guardAdminApi, json, callerId } from '@/lib/auth/guard';
import { readAdminContent, revalidateContent } from '@/lib/admin/content';
import { getGithubConfig, listDir } from '@/lib/github';
import { ConflictError, deleteFile, getFile, putBinary } from '@/lib/github-write';
import {
  LIST_FOLDERS,
  MAX_BASE64_LENGTH,
  buildUsageIndex,
  detectImageType,
  findUsage,
  isManagedMediaPath,
  isMediaFolder,
  isUploadFolder,
  mediaPathFor,
  usageLabel,
  type UsageRef,
} from '@/lib/media-upload';
import { createRateLimiter } from '@/lib/rate-limit';
import { contentNames, type ContentName } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** Per signed-in caller: generous for a batch of phone photos, still a brake on a runaway script. */
const uploadLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 120 });

const NOT_CONNECTED = 'GitHub is not connected, so pictures cannot be stored. Set the GITHUB_* variables first.';

/** Every content document, as stored (seed if never saved), for finding where a picture is used. */
async function readAllDocs(): Promise<Record<string, unknown>> {
  const docs: Record<string, unknown> = {};
  await Promise.all(
    contentNames.map(async (name: ContentName) => {
      try {
        docs[name] = (await readAdminContent(name)).data;
      } catch {
        docs[name] = null;
      }
    }),
  );
  return docs;
}

// The list view can be a little stale (30 s); deleting always re-scans.
let usageCache: { at: number; index: Map<string, UsageRef[]> } | null = null;
async function usageIndex(fresh = false) {
  if (!fresh && usageCache && Date.now() - usageCache.at < 30_000) return usageCache.index;
  const index = buildUsageIndex(await readAllDocs());
  usageCache = { at: Date.now(), index };
  return index;
}

/** GET /api/admin/media?folder=gallery → files with size and where each is used. */
export async function GET(request: Request) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;
  if (!getGithubConfig()) return json({ ok: true, connected: false, files: [], totalBytes: 0 });

  const url = new URL(request.url);
  const folderParam = url.searchParams.get('folder');
  if (folderParam && !isMediaFolder(folderParam)) return json({ ok: false, message: 'Unknown folder.' }, 400);
  const folders = folderParam ? [folderParam] : [...LIST_FOLDERS];

  try {
    const [listings, index] = await Promise.all([
      Promise.all(folders.map(async (folder) => ({ folder, entries: await listDir(`media/${folder}`, { revalidate: 0 }) }))),
      usageIndex(url.searchParams.get('fresh') === '1'),
    ]);
    const files = listings.flatMap(({ folder, entries }) =>
      entries
        .filter((e) => e.type === 'file' && isManagedMediaPath(e.path))
        .map((e) => ({
          path: e.path,
          name: e.name,
          folder,
          size: e.size,
          usedIn: (index.get(e.path) ?? []).map((u) => ({ ...u, label: usageLabel(u) })),
        })),
    );
    return json({ ok: true, connected: true, files, totalBytes: files.reduce((sum, f) => sum + f.size, 0) });
  } catch (err) {
    console.error('[admin] media list failed:', (err as Error).message);
    return json({ ok: false, message: 'Could not load the media library from GitHub. Please try again.' }, 502);
  }
}

/** POST /api/admin/media  { folder, filename, dataBase64 } → { path, size, width, height } */
export async function POST(request: Request) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;
  if (!getGithubConfig()) return json({ ok: false, message: NOT_CONNECTED }, 409);

  const limit = uploadLimiter.check(callerId(request).id);
  if (!limit.allowed) {
    return json({ ok: false, message: 'Too many uploads at once. Waiting a moment…', retryAfter: limit.retryAfterSec }, 429, { 'Retry-After': String(limit.retryAfterSec) });
  }

  let body: { folder?: unknown; filename?: unknown; dataBase64?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > MAX_BASE64_LENGTH + 2000) return json({ ok: false, message: 'That picture is too large to upload.' }, 413);
    body = JSON.parse(raw) as typeof body;
  } catch {
    return json({ ok: false, message: 'Invalid request.' }, 400);
  }

  const { folder, filename, dataBase64 } = body;
  if (!isUploadFolder(folder)) return json({ ok: false, message: 'Unknown folder.' }, 400);
  if (typeof dataBase64 !== 'string' || dataBase64.length === 0 || dataBase64.length > MAX_BASE64_LENGTH) {
    return json({ ok: false, message: 'That picture is too large to upload.' }, 413);
  }
  const name = typeof filename === 'string' ? filename.slice(0, 120) : 'image';

  const input = Buffer.from(dataBase64, 'base64');
  const detected = detectImageType(input);
  if (!detected) return json({ ok: false, message: 'That file is not a JPG, PNG or WebP picture.' }, 415);

  let stored: Buffer;
  let width: number | undefined;
  let height: number | undefined;
  try {
    const { default: sharp } = await import('sharp');
    const image = sharp(input, { limitInputPixels: 8000 * 8000 }).rotate();
    const meta = await image.metadata();
    if (detected === 'webp' && (meta.width ?? 0) <= 2560 && (meta.height ?? 0) <= 2560) {
      // already what we want (the browser compressed it): keep the exact bytes so the content hash is stable
      stored = input;
      width = meta.width;
      height = meta.height;
    } else {
      const out = await image.resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
      stored = out.data;
      width = out.info.width;
      height = out.info.height;
    }
  } catch {
    return json({ ok: false, message: 'That file could not be read as a picture.' }, 415);
  }

  const path = mediaPathFor(folder, stored, name);
  try {
    const existing = await getFile(path);
    if (existing) return json({ ok: true, path, size: existing.buffer.length, width, height, existed: true });
    await putBinary(path, stored, { message: `admin: upload ${path}` });
    usageCache = null;
    return json({ ok: true, path, size: stored.length, width, height, existed: false });
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 403 || status === 429) {
      return json({ ok: false, message: 'GitHub asked us to slow down. Retrying shortly…', retryAfter: 20 }, 429, { 'Retry-After': '20' });
    }
    console.error('[admin] media upload failed:', (err as Error).message);
    return json({ ok: false, message: 'Could not save the picture to GitHub. Please try again.' }, 502);
  }
}

/** DELETE /api/admin/media  { path } → 409 { usedIn } when something still uses it. */
export async function DELETE(request: Request) {
  const blocked = await guardAdminApi(request);
  if (blocked) return blocked;
  if (!getGithubConfig()) return json({ ok: false, message: NOT_CONNECTED }, 409);

  let body: { path?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, message: 'Invalid request.' }, 400);
  }
  const path = body.path;
  if (!isManagedMediaPath(path)) return json({ ok: false, message: 'That is not a library picture.' }, 400);

  try {
    // always a fresh scan: never trust the 30 s list cache before deleting
    const usedIn = findUsage(await readAllDocs(), path).map((u) => ({ ...u, label: usageLabel(u) }));
    if (usedIn.length > 0) {
      return json({ ok: false, message: 'This picture is still in use.', usedIn }, 409);
    }
    const file = await getFile(path);
    if (!file) return json({ ok: true, deleted: false });
    await deleteFile(path, file.sha, `admin: delete ${path}`);
    usageCache = null;
    revalidateContent();
    return json({ ok: true, deleted: true });
  } catch (err) {
    if (err instanceof ConflictError) return json({ ok: false, message: 'That picture changed meanwhile. Please reload.' }, 409);
    console.error('[admin] media delete failed:', (err as Error).message);
    return json({ ok: false, message: 'Could not delete the picture. Please try again.' }, 502);
  }
}
