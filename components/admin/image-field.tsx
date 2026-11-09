'use client';

import { useId, useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, Trash2, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SafeImage as Image } from '@/components/ui/safe-image';
import { formatBytes, processImage, rejectReason, type ImageKind } from '@/lib/image-client';
import { mediaUrl } from '@/lib/media';
import type { UploadFolder } from '@/lib/media-upload';
import { useConfirm } from './confirm';
import { TextField } from './fields';
import { MediaPickerModal } from './media-picker';
import { uploadImage } from './media-client';

interface ImageFieldProps {
  label: string;
  /** Media path ("media/…" or "/assets/…"). */
  value: string;
  onChange: (path: string) => void;
  alt?: string;
  onAltChange?: (alt: string) => void;
  error?: string;
  altError?: string;
  /** Compression preset (default: a page photo, long edge 1920 px). */
  kind?: ImageKind;
  /** Library folder new uploads go into. */
  folder?: UploadFolder;
  /** Shown under the picture, e.g. "Landscape, at least 800 px wide". */
  aspectHint?: string;
  /** A picture is mandatory here: removing it asks for confirmation. */
  required?: boolean;
}

type Phase = { state: 'idle' } | { state: 'working'; text: string } | { state: 'done'; text: string } | { state: 'error'; text: string };

/**
 * Image chooser used by every admin form: shows the current picture, lets you pick from the media library
 * or upload a new one (compressed in the browser first), and asks for alt text.
 * Uploaded files are stored on GitHub immediately, even before the form is saved.
 */
export function ImageField({ label, value, onChange, alt, onAltChange, error, altError, kind = 'pages', folder = 'pages', aspectHint, required }: ImageFieldProps) {
  const confirm = useConfirm();
  const fileInput = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [picker, setPicker] = useState(false);
  const [phase, setPhase] = useState<Phase>({ state: 'idle' });
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const rejected = rejectReason(file);
    if (rejected) return setPhase({ state: 'error', text: rejected });
    try {
      setPhase({ state: 'working', text: 'Compressing…' });
      const processed = await processImage(file, kind);
      setPhase({ state: 'working', text: `Uploading (${formatBytes(processed.bytesBefore)} → ${formatBytes(processed.bytesAfter)})…` });
      const result = await uploadImage(folder, file.name, processed.blob, (s) => setPhase({ state: 'working', text: `GitHub is busy, retrying in ${s}s…` }));
      onChange(result.path);
      setPhase({ state: 'done', text: `Uploaded. ${formatBytes(processed.bytesBefore)} → ${formatBytes(processed.bytesAfter)}.` });
    } catch (err) {
      setPhase({ state: 'error', text: err instanceof Error ? err.message : 'Upload failed.' });
    }
  }

  async function remove() {
    if (required) {
      const ok = await confirm({ title: 'Remove this picture?', message: 'A picture is needed here. You must choose another one before saving.', confirmLabel: 'Remove picture', danger: true });
      if (!ok) return;
    }
    onChange('');
    setPhase({ state: 'idle' });
  }

  const working = phase.state === 'working';

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`relative h-28 w-40 shrink-0 overflow-hidden rounded-lg border bg-green-50 ${dragging ? 'border-orange-500 ring-2 ring-orange-300' : 'border-line'}`}
        >
          {value ? (
            <Image src={mediaUrl(value)} alt="" fill sizes="160px" className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full items-center justify-center px-2 text-center text-xs text-muted">Drop a picture here</span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <p className="truncate text-xs text-muted">{value || 'No image chosen'}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPicker(true)} icon={<Images className="size-4" aria-hidden="true" />}>
              Choose from library
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInput.current?.click()}
              disabled={working}
              icon={working ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
            >
              Upload new
            </Button>
            {value ? (
              <Button variant="ghost" size="sm" onClick={() => void remove()} icon={<Trash2 className="size-4" aria-hidden="true" />}>
                Remove
              </Button>
            ) : null}
            <label htmlFor={inputId} className="sr-only">
              Upload a picture for {label}
            </label>
            <input
              ref={fileInput}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                void handleFile(file);
              }}
            />
          </div>

          <p role="status" aria-live="polite" className={`text-xs ${phase.state === 'error' ? 'font-medium text-red-700' : phase.state === 'done' ? 'text-green-800' : 'text-muted'}`}>
            {phase.state === 'idle' ? (aspectHint ?? 'JPG, PNG or WebP. Big photos are made smaller automatically.') : phase.text}
          </p>
          <p className="text-xs text-muted">Uploaded pictures are saved right away, even if you do not press Save. Unused ones can be removed from the Media Library.</p>

          <details className="text-sm">
            <summary className="focus-ring inline-block cursor-pointer rounded text-xs font-semibold text-green-800">Advanced: set image path</summary>
            <div className="mt-2">
              <TextField
                label="Image path or https URL"
                value={value}
                onChange={onChange}
                maxLength={300}
                placeholder="/assets/photos/… or media/pages/…"
                hint="Use a path that already exists on the site (for example /assets/photos/vehicles/wagonr-training-car.webp) or an https:// image link."
              />
            </div>
          </details>

          {onAltChange ? (
            <div>
              <TextField
                label="Image description (alt text)"
                required={Boolean(value)}
                value={alt ?? ''}
                onChange={onAltChange}
                maxLength={200}
                error={altError}
                hint="Describe the photo for visually impaired visitors and for Google."
              />
              {value && !(alt ?? '').trim() && !altError ? (
                <p role="status" className="mt-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-xs text-orange-800">
                  Alt text is empty. Please describe this picture.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      <MediaPickerModal open={picker} onClose={() => setPicker(false)} onPick={onChange} />
    </div>
  );
}
