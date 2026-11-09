'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { diffSummary } from '@/lib/admin/diff';
import { formatRelative } from '@/lib/date';
import { adminFetch } from './admin-client';
import { Drawer } from './drawer';

interface Commit {
  sha: string;
  short: string;
  message: string;
  raw: string;
  date: string;
  author: string;
  url: string;
}

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Content name: site, home, about, courses, gallery, reviews. */
  name: string;
  /** What the editor currently holds (to show what restoring would change). */
  current: unknown;
  /** Called with the old version's data; the editor loads it as an unsaved draft. */
  onRestore: (data: unknown) => void;
}

type Version = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; data: unknown };

/**
 * Last 20 changes of one page, newest first. Picking one shows what restoring it would change.
 * Restoring only fills the editor with that version as a draft: nothing is saved (and no history is rewritten)
 * until the person presses Save changes, which creates a new commit.
 */
export function HistoryDrawer({ open, onClose, name, current, onRestore }: HistoryDrawerProps) {
  const [commits, setCommits] = useState<Commit[] | null>(null);
  const [connected, setConnected] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Commit | null>(null);
  const [version, setVersion] = useState<Version>({ state: 'loading' });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    adminFetch<{ commits: Commit[]; connected: boolean }>(`/api/admin/history/${name}`).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setCommits(res.data.commits ?? []);
        setConnected(res.data.connected !== false);
        setError('');
      } else {
        setError(res.data.message || 'Could not load the history.');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, name]);

  function pick(c: Commit) {
    setSelected(c);
    setVersion({ state: 'loading' });
    adminFetch<{ data: unknown }>(`/api/admin/history/${name}?sha=${c.sha}`).then((res) => {
      setVersion(res.ok ? { state: 'ready', data: res.data.data } : { state: 'error', message: res.data.message || 'Could not load that version.' });
    });
  }

  const diff = useMemo(() => (version.state === 'ready' ? diffSummary(current, version.data, 30) : null), [version, current]);

  return (
    <Drawer open={open} title="History" description="The last 20 changes to this page." onCancel={onClose} onDone={onClose} doneLabel="Close" hideCancel>
      {selected ? (
        <div>
          <button type="button" onClick={() => setSelected(null)} className="focus-ring mb-4 inline-flex min-h-11 items-center gap-1.5 rounded text-sm font-semibold text-green-800">
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to the list
          </button>
          <h3 className="font-semibold text-ink">{selected.message}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {selected.date ? `${new Date(selected.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} (${formatRelative(selected.date)})` : ''} · {selected.short}
          </p>

          {version.state === 'loading' ? <p role="status" className="mt-6 text-sm text-muted">Loading that version…</p> : null}
          {version.state === 'error' ? (
            <p role="alert" className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {version.message}
            </p>
          ) : null}
          {diff ? (
            <div className="mt-5">
              {diff.total === 0 ? (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900">This version is the same as what you have now. Nothing would change.</p>
              ) : (
                <>
                  <p className="mb-2 text-sm font-semibold text-ink">
                    Restoring this version would change {diff.total} thing{diff.total === 1 ? '' : 's'}:
                  </p>
                  <ul className="space-y-2 text-sm">
                    {diff.changes.map((c) => (
                      <li key={c.path} className="rounded-lg border border-line p-2.5">
                        <p className="font-mono text-xs text-muted">{c.path}</p>
                        <p className="mt-1 break-words">
                          <span className="rounded bg-red-50 px-1 text-red-800 line-through">{c.from}</span> <span aria-hidden="true">→</span>
                          <span className="sr-only"> changes to </span> <span className="rounded bg-green-50 px-1 text-green-900">{c.to}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                  {diff.truncated ? <p className="mt-2 text-xs text-muted">…and {diff.total - diff.changes.length} more changes.</p> : null}
                </>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  disabled={diff.total === 0}
                  onClick={() => {
                    if (version.state === 'ready') onRestore(version.data);
                  }}
                >
                  Restore this version
                </Button>
                <a href={selected.url} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex min-h-11 items-center gap-1 rounded text-sm font-semibold text-green-800 underline underline-offset-2">
                  View on GitHub <ExternalLink className="size-4" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
              <p className="mt-3 text-xs text-muted">Restoring fills the editor with this version as a draft. Nothing changes on the website until you press Save changes, which saves it as a new version.</p>
            </div>
          ) : null}
        </div>
      ) : error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : commits === null ? (
        <p role="status" className="text-sm text-muted">Loading history…</p>
      ) : !connected ? (
        <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-800">History needs GitHub. Connect it (see the Dashboard) and every change you save will be listed here.</p>
      ) : commits.length === 0 ? (
        <p className="text-sm text-muted">No saved changes yet. They will appear here after you save.</p>
      ) : (
        <ul className="space-y-2">
          {commits.map((c) => (
            <li key={c.sha}>
              <button type="button" onClick={() => pick(c)} className="focus-ring block w-full rounded-xl border border-line bg-white p-3 text-left hover:border-orange-500">
                <span className="block text-sm font-semibold text-ink">{c.message}</span>
                <span className="block text-xs text-muted">
                  {c.date ? formatRelative(c.date) : ''} · {c.short}
                  {c.author ? ` · ${c.author}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
