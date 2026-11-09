'use client';

import { blobToBase64 } from '@/lib/image-client';
import type { MediaFolder, UploadFolder } from '@/lib/media-upload';
import { adminFetch } from './admin-client';

export interface MediaUsage {
  file: string;
  jsonPath: string;
  label: string;
}

export interface MediaFile {
  path: string;
  name: string;
  folder: MediaFolder;
  size: number;
  usedIn: MediaUsage[];
}

export interface MediaList {
  connected: boolean;
  files: MediaFile[];
  totalBytes: number;
}

export interface UploadResult {
  path: string;
  size: number;
  width?: number;
  height?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Upload one compressed image. GitHub can answer "slow down" (429 with `retryAfter`): wait and try again,
 * up to 3 times, before giving up with a message the person can act on.
 */
export async function uploadImage(folder: UploadFolder, filename: string, blob: Blob, onWait?: (seconds: number) => void): Promise<UploadResult> {
  const dataBase64 = await blobToBase64(blob);
  let lastMessage = 'Could not upload the picture. Please try again.';
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await adminFetch<{ path: string; size: number; width?: number; height?: number; retryAfter?: number }>('/api/admin/media', {
      method: 'POST',
      body: { folder, filename, dataBase64 },
    });
    if (res.ok) return { path: res.data.path, size: res.data.size, width: res.data.width, height: res.data.height };
    lastMessage = res.data.message || lastMessage;
    if (res.status === 429 && attempt < 3) {
      const wait = Math.min(Math.max(Number((res.data as { retryAfter?: number }).retryAfter) || 5, 1), 60);
      onWait?.(wait);
      await sleep(wait * 1000);
      continue;
    }
    break;
  }
  throw new Error(lastMessage);
}

export async function listMedia(folder?: MediaFolder, fresh = false): Promise<MediaList> {
  const qs = new URLSearchParams();
  if (folder) qs.set('folder', folder);
  if (fresh) qs.set('fresh', '1');
  const res = await adminFetch<MediaList>(`/api/admin/media${qs.size ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(res.data.message || 'Could not load the media library.');
  return { connected: res.data.connected, files: res.data.files, totalBytes: res.data.totalBytes };
}

export interface DeleteOutcome {
  ok: boolean;
  usedIn?: MediaUsage[];
  message?: string;
}

export async function deleteMedia(path: string): Promise<DeleteOutcome> {
  const res = await adminFetch<{ usedIn?: MediaUsage[] }>('/api/admin/media', { method: 'DELETE', body: { path } });
  return { ok: res.ok, usedIn: res.data.usedIn, message: res.data.message };
}
