import { createZip, readZip, ZipError, type ZipFile } from '@/lib/zip';
import { contentNames, parseContent, type ContentName } from '@/lib/validators';
import { diffSummary, type Change } from './diff';

/** The JSON files a backup holds: content/<name>.json for the six content documents. */
export const backupPath = (name: ContentName) => `content/${name}.json`;

export function backupReadme(now: Date): string {
  return [
    'Gopal Krushna Driving Training School - website content backup',
    `Created: ${now.toISOString()}`,
    '',
    'What is inside',
    '  content/*.json  all the text and settings of the website (site, home, about, courses, gallery, reviews).',
    '',
    'What is NOT inside',
    '  Pictures. They live in the media/ folder of your GitHub repository (the "data" branch),',
    '  so a normal copy of the repository (git clone) contains them as well.',
    '',
    'How to restore',
    '  Admin panel > Help or Dashboard > "Restore from a backup". Upload this ZIP, check the preview,',
    '  type RESTORE and confirm. Every changed file is saved as its own new commit; nothing is ever deleted from the history.',
    '',
  ].join('\r\n');
}

/** Build the backup ZIP from the current content documents. */
export function buildBackup(docs: Record<ContentName, unknown>, now = new Date()): Buffer {
  const files: ZipFile[] = contentNames.map((name) => ({ name: backupPath(name), data: Buffer.from(`${JSON.stringify(docs[name], null, 2)}\n`, 'utf8') }));
  files.push({ name: 'README.txt', data: Buffer.from(backupReadme(now), 'utf8') });
  return createZip(files, now);
}

export type FileStatus = 'invalid' | 'unchanged' | 'changed';

export interface FilePlan {
  name: ContentName;
  path: string;
  status: FileStatus;
  /** Field problems when the file is invalid (path → message). */
  errors?: Record<string, string>;
  changes?: Change[];
  totalChanges?: number;
  /** The validated document (only for changed files; used to restore). */
  data?: unknown;
}

export interface RestorePlan {
  files: FilePlan[];
  /** ZIP entries that are not content files (ignored). */
  ignored: string[];
  /** Nothing is invalid and at least one file would change. */
  canRestore: boolean;
  error?: string;
}

/**
 * Check an uploaded backup against the current content: every JSON file is validated with the real schema,
 * and compared with what is live, so the preview can say exactly what a restore would change.
 */
export function planRestore(zip: Buffer, current: Record<ContentName, unknown>): RestorePlan {
  let entries: ZipFile[];
  try {
    entries = readZip(zip);
  } catch (e) {
    return { files: [], ignored: [], canRestore: false, error: e instanceof ZipError ? e.message : 'That file could not be read as a ZIP.' };
  }

  const files: FilePlan[] = [];
  const ignored: string[] = [];
  for (const entry of entries) {
    const name = contentNames.find((n) => backupPath(n) === entry.name);
    if (!name) {
      ignored.push(entry.name);
      continue;
    }
    let json: unknown;
    try {
      json = JSON.parse(entry.data.toString('utf8'));
    } catch {
      files.push({ name, path: entry.name, status: 'invalid', errors: { _root: 'This file is not valid JSON.' } });
      continue;
    }
    const parsed = parseContent(name, json);
    if (!parsed.ok) {
      files.push({ name, path: entry.name, status: 'invalid', errors: parsed.errors });
      continue;
    }
    const diff = diffSummary(current[name], parsed.data, 12);
    files.push(
      diff.total === 0
        ? { name, path: entry.name, status: 'unchanged' }
        : { name, path: entry.name, status: 'changed', changes: diff.changes, totalChanges: diff.total, data: parsed.data },
    );
  }

  if (files.length === 0) return { files, ignored, canRestore: false, error: 'This ZIP does not contain any content files (content/*.json).' };
  return { files, ignored, canRestore: files.every((f) => f.status !== 'invalid') && files.some((f) => f.status === 'changed') };
}
