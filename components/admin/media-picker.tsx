'use client';

import { useEffect, useMemo, useState } from 'react';
import { SafeImage as Image } from '@/components/ui/safe-image';
import { Modal } from '@/components/ui/modal';
import { mediaUrl } from '@/lib/media';
import { LIST_FOLDERS, type MediaFolder } from '@/lib/media-upload';
import { cn } from '@/lib/utils';
import { listMedia, type MediaFile } from './media-client';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the chosen `media/...` path. */
  onPick: (path: string) => void;
  /** Start on this folder (the field's own folder). */
  initialFolder?: MediaFolder;
}

/** Grid of everything in the media library, with a folder filter and search. */
export function MediaPickerModal({ open, onClose, onPick, initialFolder }: MediaPickerModalProps) {
  const [folder, setFolder] = useState<MediaFolder | ''>(initialFolder ?? '');
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listMedia()
      .then((list) => {
        if (cancelled) return;
        setFiles(list.files);
        setConnected(list.connected);
        setError('');
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (files ?? [])
      .filter((f) => (folder ? f.folder === folder : true))
      .filter((f) => (q ? f.name.toLowerCase().includes(q) : true))
      .sort((a, b) => b.name.localeCompare(a.name));
  }, [files, folder, query]);

  return (
    <Modal open={open} onClose={onClose} title="Choose from library" description="Pictures you have already uploaded." className="sm:max-w-3xl">
      <div className="mb-4 flex flex-wrap gap-3">
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
        <label className="min-w-0 flex-1 text-sm font-medium text-ink">
          <span className="sr-only">Search by file name</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by file name…"
            className="focus-ring h-11 w-full rounded-lg border border-line bg-white px-3 text-sm"
          />
        </label>
      </div>

      {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {!error && files === null ? <p role="status" className="py-8 text-center text-sm text-muted">Loading pictures…</p> : null}
      {!error && files !== null && !connected ? (
        <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-800">GitHub is not connected, so there is no library yet. Pictures already on the site (under /assets) can be set with “Advanced: set image path”.</p>
      ) : null}
      {!error && files !== null && connected && shown.length === 0 ? <p className="py-8 text-center text-sm text-muted">No pictures found.</p> : null}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shown.map((f) => (
          <li key={f.path}>
            <button
              type="button"
              onClick={() => {
                onPick(f.path);
                onClose();
              }}
              className={cn('focus-ring group block w-full overflow-hidden rounded-xl border border-line bg-white text-left hover:border-orange-500')}
            >
              <span className="relative block aspect-[4/3] bg-green-50">
                <Image src={mediaUrl(f.path)} alt="" fill sizes="200px" className="object-cover" unoptimized />
              </span>
              <span className="block truncate px-2.5 py-2 text-xs text-ink">
                {f.name}
                <span className="block text-muted">{f.folder}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
