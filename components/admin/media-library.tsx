'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink, LayoutGrid, List as ListIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { SafeImage as Image } from '@/components/ui/safe-image';
import { useToast } from '@/components/ui/toast';
import { formatBytes } from '@/lib/image-client';
import { mediaUrl } from '@/lib/media';
import { LIST_FOLDERS, type MediaFolder } from '@/lib/media-upload';
import { cn } from '@/lib/utils';
import { AdminLoading, AdminPageHeader, EmptyState } from './blocks';
import { useConfirm } from './confirm';
import { deleteMedia, listMedia, type MediaFile, type MediaList } from './media-client';

type Sort = 'newest' | 'name' | 'size';
const SOFT_LIMIT_BYTES = 500 * 1024 * 1024;

function usedText(f: MediaFile): string {
  const labels = [...new Set(f.usedIn.map((u) => u.label))];
  return labels.join(', ');
}

export function MediaLibrary() {
  const toast = useToast();
  const confirm = useConfirm();
  const [data, setData] = useState<MediaList | null>(null);
  const [error, setError] = useState('');
  const [folder, setFolder] = useState<MediaFolder | ''>('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [busy, setBusy] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = useCallback((fresh = false) => {
    listMedia(undefined, fresh)
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    listMedia()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const files = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (data?.files ?? []).filter((f) => (!folder || f.folder === folder) && (!q || f.name.toLowerCase().includes(q)));
    return list.sort((a, b) => (sort === 'size' ? b.size - a.size : sort === 'name' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
  }, [data, folder, query, sort]);

  const unused = useMemo(() => (data?.files ?? []).filter((f) => f.usedIn.length === 0), [data]);

  async function remove(f: MediaFile) {
    const ok = await confirm({ title: 'Delete this picture?', message: `${f.name} will be removed from the library for good.`, confirmLabel: 'Delete picture', danger: true });
    if (!ok) return;
    setBusy(true);
    const res = await deleteMedia(f.path);
    setBusy(false);
    if (res.ok) {
      toast.success('Picture deleted.');
      load(true);
    } else if (res.usedIn?.length) {
      toast.error(`Still in use: ${[...new Set(res.usedIn.map((u) => u.label))].join(', ')}.`);
      load(true);
    } else {
      toast.error(res.message || 'Could not delete the picture.');
    }
  }

  async function deleteAllUnused() {
    setBusy(true);
    let deleted = 0;
    let skipped = 0;
    for (const f of unused) {
      const res = await deleteMedia(f.path);
      if (res.ok) deleted += 1;
      else skipped += 1;
    }
    setBusy(false);
    setBulkOpen(false);
    toast.success(`${deleted} unused picture${deleted === 1 ? '' : 's'} deleted${skipped ? `, ${skipped} skipped (now in use or failed)` : ''}.`);
    load(true);
  }

  async function copy(path: string) {
    try {
      await navigator.clipboard.writeText(path);
      toast.success('Path copied.');
    } catch {
      toast.error('Could not copy. Select the path and copy it by hand.');
    }
  }

  if (error && !data) {
    return (
      <>
        <AdminPageHeader title="Media Library" />
        <EmptyState title="Could not load the library" description={error} action={<Button onClick={() => load()}>Try again</Button>} />
      </>
    );
  }
  if (!data) return <AdminLoading label="Loading media library" />;

  const overSoft = data.totalBytes > SOFT_LIMIT_BYTES;

  return (
    <>
      <AdminPageHeader
        title="Media Library"
        description="Every picture you have uploaded, and where it is used. Pictures that are in use cannot be deleted."
        actions={
          <Button variant="secondary" size="sm" disabled={unused.length === 0 || busy} onClick={() => setBulkOpen(true)} icon={<Trash2 className="size-4" aria-hidden="true" />}>
            Delete all unused ({unused.length})
          </Button>
        }
      />

      {!data.connected ? (
        <EmptyState title="GitHub is not connected" description="The library lives in your GitHub repository. Set the GITHUB_* variables to see and upload pictures." />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">
            {data.files.length} picture{data.files.length === 1 ? '' : 's'} · {formatBytes(data.totalBytes)} in total
          </p>
          {overSoft ? (
            <p role="status" className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              The library is over 500 MB. GitHub works best with repositories under a few GB: please delete pictures you no longer need.
            </p>
          ) : null}

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-ink">
              <span className="sr-only">Folder</span>
              <select value={folder} onChange={(e) => setFolder(e.target.value as MediaFolder | '')} className="focus-ring h-11 rounded-lg border border-line bg-white px-3 text-sm">
                <option value="">All folders</option>
                {LIST_FOLDERS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 flex-1 text-sm font-medium text-ink sm:max-w-xs">
              <span className="sr-only">Search by file name</span>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by file name…" className="focus-ring h-11 w-full rounded-lg border border-line bg-white px-3 text-sm" />
            </label>
            <label className="text-sm font-medium text-ink">
              <span className="sr-only">Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="focus-ring h-11 rounded-lg border border-line bg-white px-3 text-sm">
                <option value="newest">Newest first</option>
                <option value="name">Name</option>
                <option value="size">Largest first</option>
              </select>
            </label>
            <div role="group" aria-label="View" className="ml-auto flex overflow-hidden rounded-lg border border-line bg-white">
              <button type="button" aria-pressed={view === 'grid'} onClick={() => setView('grid')} aria-label="Grid view" className={cn('focus-ring flex size-11 items-center justify-center', view === 'grid' ? 'bg-green-50 text-green-800' : 'text-muted')}>
                <LayoutGrid className="size-5" aria-hidden="true" />
              </button>
              <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')} aria-label="List view" className={cn('focus-ring flex size-11 items-center justify-center', view === 'list' ? 'bg-green-50 text-green-800' : 'text-muted')}>
                <ListIcon className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {files.length === 0 ? (
            <EmptyState title={data.files.length === 0 ? 'No pictures yet' : 'No pictures match'} description={data.files.length === 0 ? 'Upload pictures from the Gallery page or from any picture field.' : 'Try a different folder or search.'} />
          ) : (
            <ul className={view === 'grid' ? 'grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4' : 'space-y-3'}>
              {files.map((f) => (
                <li key={f.path} className={cn('overflow-hidden rounded-2xl border border-line bg-white shadow-card', view === 'list' && 'flex items-center gap-4 p-3')}>
                  <div className={cn('relative bg-green-50', view === 'grid' ? 'aspect-[4/3]' : 'h-20 w-28 shrink-0 overflow-hidden rounded-lg')}>
                    <Image src={mediaUrl(f.path)} alt="" fill sizes="240px" className="object-cover" unoptimized />
                  </div>
                  <div className={cn('min-w-0', view === 'grid' ? 'space-y-2 p-3' : 'flex-1')}>
                    <p className="truncate text-sm font-semibold text-ink" title={f.name}>
                      {f.name}
                    </p>
                    <p className="text-xs text-muted">
                      {f.folder} · {formatBytes(f.size)}
                    </p>
                    <p className={cn('text-xs font-medium', f.usedIn.length ? 'text-green-800' : 'text-orange-700')}>
                      {f.usedIn.length ? `Used in: ${usedText(f)}` : 'Unused'}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <button type="button" onClick={() => void copy(f.path)} className="focus-ring flex min-h-11 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-green-800 hover:bg-green-50">
                        <Copy className="size-4" aria-hidden="true" /> Copy path
                      </button>
                      <a href={mediaUrl(f.path)} target="_blank" rel="noopener noreferrer" className="focus-ring flex min-h-11 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-green-800 hover:bg-green-50">
                        <ExternalLink className="size-4" aria-hidden="true" /> Open
                      </a>
                      <button
                        type="button"
                        onClick={() => void remove(f)}
                        disabled={f.usedIn.length > 0 || busy}
                        title={f.usedIn.length ? `In use: ${usedText(f)}` : 'Delete'}
                        aria-label={`Delete ${f.name}`}
                        className="focus-ring flex min-h-11 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2 className="size-4" aria-hidden="true" /> Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Delete all unused pictures?" description="These pictures are not used anywhere on the website. This cannot be undone.">
        <ul className="mb-4 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-line p-3 text-sm">
          {unused.map((f) => (
            <li key={f.path} className="flex justify-between gap-3">
              <span className="truncate">{f.name}</span>
              <span className="shrink-0 text-muted">{formatBytes(f.size)}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={() => setBulkOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => void deleteAllUnused()} disabled={busy} className="!bg-red-600 !bg-none hover:!bg-red-700">
            Delete {unused.length} picture{unused.length === 1 ? '' : 's'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
