'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { blobToBase64 } from '@/lib/image-client';
import { adminFetch } from './admin-client';
import { FormSection } from './blocks';

interface PreviewFile {
  name: string;
  path: string;
  status: 'invalid' | 'unchanged' | 'changed';
  errors?: Record<string, string>;
  changes?: { path: string; from: string; to: string }[];
  totalChanges?: number;
}
interface Preview {
  files: PreviewFile[];
  ignored: string[];
  canRestore: boolean;
  error?: string;
}

const STATUS_TEXT: Record<PreviewFile['status'], string> = {
  changed: 'Will change',
  unchanged: 'Same as now',
  invalid: 'Cannot be restored',
};

/** Download a backup of all content (ZIP), or restore one: preview first, then type RESTORE. */
export function BackupCard() {
  const toast = useToast();
  const [zip, setZip] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  async function choose(file: File | undefined) {
    setPreview(null);
    setTyped('');
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('That file is too large to be a content backup.');
    setBusy(true);
    const data = await blobToBase64(file);
    setZip(data);
    setFileName(file.name);
    const res = await adminFetch<{ preview: Preview }>('/api/admin/backup', { body: { dataBase64: data } });
    setBusy(false);
    if (res.ok) setPreview(res.data.preview);
    else toast.error(res.data.message || 'Could not read that backup.');
  }

  async function restore() {
    if (!zip) return;
    setBusy(true);
    const res = await adminFetch<{ results?: { name: string; ok: boolean; message?: string }[] }>('/api/admin/backup', { body: { dataBase64: zip, confirm: 'RESTORE' } });
    setBusy(false);
    if (res.ok) {
      toast.success('Backup restored. Each changed page was saved as a new version.');
      setPreview(null);
      setZip(null);
      setTyped('');
      setFileName('');
    } else {
      const failed = res.data.results?.filter((r) => !r.ok).map((r) => r.name).join(', ');
      toast.error(failed ? `Could not restore: ${failed}.` : res.data.message || 'Could not restore the backup.');
    }
  }

  const changed = preview?.files.filter((f) => f.status === 'changed').length ?? 0;

  return (
    <FormSection title="Backup" description="A copy of all your page text and settings. Pictures are not included: they already live safely in your GitHub repository.">
      <div>
        <a
          href="/api/admin/backup"
          download
          className="focus-ring inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-orange-500 bg-white px-4 text-sm font-semibold text-orange-600 hover:bg-orange-50"
        >
          <Download className="size-4" aria-hidden="true" /> Download backup (ZIP)
        </a>
      </div>

      <details className="rounded-xl border border-line p-4">
        <summary className="focus-ring cursor-pointer rounded text-sm font-semibold text-green-900">Restore from a backup (advanced)</summary>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted">Choose a backup ZIP you downloaded earlier. You will see exactly what would change before anything is saved.</p>
          <label className="block text-sm font-medium text-ink">
            Backup ZIP
            <input
              type="file"
              accept=".zip,application/zip"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                void choose(f);
              }}
              className="focus-ring mt-1.5 block w-full rounded-lg border border-line bg-white p-2 text-sm"
            />
          </label>
          {busy && !preview ? <p role="status" className="text-sm text-muted">Reading {fileName || 'the backup'}…</p> : null}

          {preview?.error ? (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {preview.error}
            </p>
          ) : null}

          {preview && preview.files.length > 0 ? (
            <>
              <ul className="space-y-2" aria-label="What the backup contains">
                {preview.files.map((f) => (
                  <li key={f.path} className="rounded-lg border border-line p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-ink">{f.name}</span>
                      <span className={f.status === 'invalid' ? 'font-semibold text-red-700' : f.status === 'changed' ? 'font-semibold text-orange-700' : 'text-muted'}>{STATUS_TEXT[f.status]}</span>
                    </div>
                    {f.status === 'invalid' && f.errors ? (
                      <ul className="mt-1 list-disc pl-5 text-xs text-red-700">
                        {Object.entries(f.errors).slice(0, 4).map(([p, m]) => (
                          <li key={p}>
                            {p}: {m}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {f.status === 'changed' && f.changes ? (
                      <ul className="mt-1 space-y-0.5 text-xs text-muted">
                        {f.changes.slice(0, 4).map((c) => (
                          <li key={c.path}>
                            <span className="font-mono">{c.path}</span>: {c.from} → {c.to}
                          </li>
                        ))}
                        {(f.totalChanges ?? 0) > 4 ? <li>…and {(f.totalChanges ?? 0) - 4} more changes</li> : null}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
              {preview.canRestore ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-ink">
                    Type <strong>RESTORE</strong> to restore {changed} page{changed === 1 ? '' : 's'}
                    <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className="focus-ring mt-1.5 block h-11 w-full rounded-lg border border-line px-3" />
                  </label>
                  <Button disabled={typed !== 'RESTORE'} loading={busy} onClick={() => void restore()} className="!bg-red-600 !bg-none hover:!bg-red-700">
                    Restore {changed} page{changed === 1 ? '' : 's'}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted">{preview.files.some((f) => f.status === 'invalid') ? 'Fix or remove the files marked “Cannot be restored” before restoring.' : 'Nothing in this backup differs from the live content.'}</p>
              )}
            </>
          ) : null}
        </div>
      </details>
    </FormSection>
  );
}
