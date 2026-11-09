/**
 * Browser-side image pipeline: validate → decode (EXIF rotation applied) → resize → re-encode as WebP.
 * Re-encoding on a canvas also drops all metadata (GPS, camera, …). The pure maths lives in small helpers so it can be unit tested.
 */

export type ImageKind = 'gallery' | 'pages' | 'courses' | 'avatar' | 'logo' | 'og';

export const MAX_INPUT_BYTES = 20 * 1024 * 1024;
/** After compression the file must stay below this so base64 + JSON still fits in a 4.5 MB request. */
export const MAX_OUTPUT_BYTES = 3 * 1024 * 1024;
const SOFT_TARGET_BYTES = 900 * 1024;
const QUALITIES = [0.82, 0.7, 0.6];

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const HEIC_MESSAGE = "Please upload JPG, PNG or WebP. On iPhone use 'Most Compatible' format or share as JPG.";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

/** Message for a file we will not accept, or null when it is fine. */
export function rejectReason(file: { type: string; name: string; size: number }): string | null {
  const heic = /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (heic) return HEIC_MESSAGE;
  const okByName = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!ACCEPTED_TYPES.includes(file.type) && !(file.type === '' && okByName)) return 'Please upload a JPG, PNG or WebP picture.';
  if (file.size > MAX_INPUT_BYTES) return 'That file is larger than 20 MB. Please choose a smaller one.';
  if (file.size === 0) return 'That file is empty.';
  return null;
}

export interface Preset {
  /** Longest side in pixels (ignored when `cover` is set). */
  maxEdge: number;
  /** Exact output size, cropped to cover (the share image). */
  cover?: { width: number; height: number };
  /** Keep transparency (lossless WebP for logos). */
  lossless?: boolean;
}

export const PRESETS: Record<ImageKind, Preset> = {
  gallery: { maxEdge: 1920 },
  pages: { maxEdge: 1920 },
  courses: { maxEdge: 1920 },
  avatar: { maxEdge: 400 },
  logo: { maxEdge: 800, lossless: true },
  og: { maxEdge: 1200, cover: { width: 1200, height: 630 } },
};

/** Shrink to fit `maxEdge` on the long side; never enlarge. */
export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const long = Math.max(width, height);
  if (long <= maxEdge) return { width, height };
  const scale = maxEdge / long;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Source rectangle that fills a `targetW × targetH` frame (centre crop, or a custom focus 0–1). */
export function coverRect(srcW: number, srcH: number, targetW: number, targetH: number, focus: { x: number; y: number } = { x: 0.5, y: 0.5 }) {
  const targetRatio = targetW / targetH;
  const srcRatio = srcW / srcH;
  let w = srcW;
  let h = srcH;
  if (srcRatio > targetRatio) w = Math.round(srcH * targetRatio);
  else h = Math.round(srcW / targetRatio);
  const x = Math.round(Math.min(Math.max((srcW - w) * focus.x, 0), srcW - w));
  const y = Math.round(Math.min(Math.max((srcH - h) * focus.y, 0), srcH - h));
  return { x, y, w, h };
}

/** Square crop of the largest centred square (avatars). */
export function squareRect(srcW: number, srcH: number, focus?: { x: number; y: number }) {
  return coverRect(srcW, srcH, 1, 1, focus);
}

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  bytesBefore: number;
  bytesAfter: number;
  previewUrl: string;
}

export interface CropOptions {
  /** 0–1 focus point inside the source for the crop (cover/square presets). */
  focus?: { x: number; y: number };
}

type Canvas2D = OffscreenCanvas | HTMLCanvasElement;

function makeCanvas(width: number, height: number): Canvas2D {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
}

async function encode(canvas: Canvas2D, type: string, quality: number): Promise<Blob> {
  if ('convertToBlob' in canvas) return canvas.convertToBlob({ type, quality });
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), type, quality);
  });
}

/** Run the whole pipeline for one file. Throws an Error with a message that is safe to show. */
export async function processImage(file: File, kind: ImageKind, crop: CropOptions = {}): Promise<ProcessedImage> {
  const rejected = rejectReason(file);
  if (rejected) throw new Error(rejected);

  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the EXIF orientation, so phone photos are never sideways
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('We could not read that picture. Try another file.');
  }

  const preset = PRESETS[kind];
  let sx = 0;
  let sy = 0;
  let sw = bitmap.width;
  let sh = bitmap.height;
  let outW: number;
  let outH: number;

  if (preset.cover) {
    ({ x: sx, y: sy, w: sw, h: sh } = coverRect(bitmap.width, bitmap.height, preset.cover.width, preset.cover.height, crop.focus));
    outW = Math.min(preset.cover.width, sw);
    outH = Math.round(outW / (preset.cover.width / preset.cover.height));
  } else if (kind === 'avatar') {
    ({ x: sx, y: sy, w: sw, h: sh } = squareRect(bitmap.width, bitmap.height, crop.focus));
    ({ width: outW, height: outH } = fitWithin(sw, sh, preset.maxEdge));
  } else {
    ({ width: outW, height: outH } = fitWithin(bitmap.width, bitmap.height, preset.maxEdge));
  }

  const canvas = makeCanvas(outW, outH);
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) {
    bitmap.close();
    throw new Error('Your browser could not process the picture.');
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, outW, outH);
  bitmap.close();

  let blob: Blob | null = null;
  for (const q of preset.lossless ? [1] : QUALITIES) {
    blob = await encode(canvas, 'image/webp', q);
    if (blob.size <= SOFT_TARGET_BYTES) break;
  }
  if (!blob || blob.type !== 'image/webp') throw new Error('Your browser could not convert the picture to WebP.');
  if (blob.size > MAX_OUTPUT_BYTES) throw new Error('Image is too large even after compression. Please use a smaller picture.');

  return { blob, width: outW, height: outH, bytesBefore: file.size, bytesAfter: blob.size, previewUrl: URL.createObjectURL(blob) };
}

/** Blob → base64 (no data: prefix), for the JSON upload body. */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) binary += String.fromCharCode(...buf.subarray(i, i + chunk));
  return btoa(binary);
}
