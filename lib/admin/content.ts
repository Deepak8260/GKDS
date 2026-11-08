import 'server-only';
import { revalidateTag } from 'next/cache';
import { getSeed } from '@/lib/content';
import { getGithubConfig } from '@/lib/github';
import { getCommits, getFile } from '@/lib/github-write';
import { contentSchemas, isContentName, type ContentName } from '@/lib/validators';

/** Only these six documents can be read or written through the generic content API. */
export { isContentName };

export function contentPath(name: ContentName): string {
  return `content/${name}.json`;
}

export interface AdminContent {
  data: unknown;
  /** Blob sha to send back with the next save; null while the file does not exist yet (first save creates it). */
  sha: string | null;
  updatedAt: string | null;
  /** Set when the stored file exists but is invalid: the seed is shown so the admin can save a valid version over it. */
  warning?: string;
}

/** Load a content document for editing: GitHub (fresh), falling back to the bundled seed. */
export async function readAdminContent(name: ContentName): Promise<AdminContent> {
  if (!getGithubConfig()) return { data: getSeed(name), sha: null, updatedAt: null };

  const path = contentPath(name);
  const file = await getFile(path);
  if (!file) return { data: getSeed(name), sha: null, updatedAt: null };

  let updatedAt: string | null = null;
  try {
    updatedAt = (await getCommits(path, 1))[0]?.date ?? null;
  } catch {
    /* the date is a nicety */
  }

  try {
    const parsed = contentSchemas[name].safeParse(JSON.parse(file.text));
    if (parsed.success) return { data: parsed.data, sha: file.sha, updatedAt };
  } catch {
    /* fall through to the warning below */
  }
  return { data: getSeed(name), sha: file.sha, updatedAt, warning: `The saved ${name}.json is not valid, so the default content is shown. Saving will replace it.` };
}

/** Make the public site pick up a change within seconds. */
export function revalidateContent(name?: ContentName) {
  revalidateTag('content', { expire: 0 });
  if (name) revalidateTag(`content:${name}`, { expire: 0 });
}
