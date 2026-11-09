'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { processImage, type ImageKind } from '@/lib/image-client';
import type { UploadFolder } from '@/lib/media-upload';
import { uploadImage } from './media-client';

export type UploadStatus = 'queued' | 'compressing' | 'uploading' | 'done' | 'error';

export interface UploadItem {
  id: number;
  file: File;
  name: string;
  kind: ImageKind;
  folder: UploadFolder;
  /** Anything the caller wants back when the upload finishes (for example the chosen category). */
  meta?: unknown;
  status: UploadStatus;
  error?: string;
  note?: string;
  before?: number;
  after?: number;
  path?: string;
  previewUrl?: string;
}

interface Options {
  /** Files handled at the same time. */
  concurrency?: number;
  /** Called once per file that uploaded successfully. */
  onUploaded?: (item: UploadItem) => void;
}

let nextId = 1;

/**
 * Upload queue for many pictures at once: each file is compressed in the browser, then uploaded, two at a time.
 * A failed file shows its message and a Retry button; the rest carry on.
 */
export function useUploadQueue({ concurrency = 2, onUploaded }: Options = {}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const itemsRef = useRef<UploadItem[]>([]);
  const running = useRef(0);
  const callback = useRef(onUploaded);
  useEffect(() => {
    callback.current = onUploaded;
  }, [onUploaded]);

  const update = useCallback((id: number, patch: Partial<UploadItem>) => {
    itemsRef.current = itemsRef.current.map((it) => (it.id === id ? { ...it, ...patch } : it));
    setItems(itemsRef.current);
  }, []);

  /** Compress + upload one file. Never throws: failures are shown on the item. */
  const processOne = useCallback(
    async (next: UploadItem) => {
      update(next.id, { status: 'compressing', error: undefined, note: undefined });
      try {
        const processed = await processImage(next.file, next.kind);
        update(next.id, { status: 'uploading', before: processed.bytesBefore, after: processed.bytesAfter, previewUrl: processed.previewUrl });
        const result = await uploadImage(next.folder, next.file.name, processed.blob, (s) => update(next.id, { note: `GitHub is busy, retrying in ${s}s…` }));
        update(next.id, { status: 'done', path: result.path, note: undefined });
        callback.current?.({ ...itemsRef.current.find((it) => it.id === next.id)!, path: result.path, status: 'done' });
      } catch (err) {
        update(next.id, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed.', note: undefined });
      }
    },
    [update],
  );

  /** Start workers up to `concurrency`; each keeps taking queued files until none are left. */
  const pump = useCallback(() => {
    while (running.current < concurrency && itemsRef.current.some((it) => it.status === 'queued')) {
      running.current += 1;
      void (async () => {
        try {
          for (;;) {
            const next = itemsRef.current.find((it) => it.status === 'queued');
            if (!next) break;
            await processOne(next);
          }
        } finally {
          // no await between the last "nothing queued" check and this line, so a retry can never be missed
          running.current -= 1;
        }
      })();
    }
  }, [concurrency, processOne]);

  const add = useCallback(
    (files: File[], kind: ImageKind, folder: UploadFolder, meta?: unknown) => {
      const created: UploadItem[] = files.map((file) => ({ id: nextId++, file, name: file.name, kind, folder, meta, status: 'queued' }));
      itemsRef.current = [...itemsRef.current, ...created];
      setItems(itemsRef.current);
      pump();
    },
    [pump],
  );

  const retry = useCallback(
    (id: number) => {
      update(id, { status: 'queued', error: undefined });
      pump();
    },
    [pump, update],
  );

  const remove = useCallback((id: number) => {
    itemsRef.current = itemsRef.current.filter((it) => it.id !== id);
    setItems(itemsRef.current);
  }, []);

  const clearFinished = useCallback(() => {
    itemsRef.current = itemsRef.current.filter((it) => it.status !== 'done');
    setItems(itemsRef.current);
  }, []);

  const total = items.length;
  const finished = items.filter((i) => i.status === 'done' || i.status === 'error').length;
  const busy = items.some((i) => i.status === 'queued' || i.status === 'compressing' || i.status === 'uploading');

  return { items, add, retry, remove, clearFinished, busy, total, finished };
}
