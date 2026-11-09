'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { mediaUrl } from '@/lib/media';
import { TextField } from './fields';

interface ImageFieldProps {
  label: string;
  /** Media path ("media/…" or "/assets/…"). */
  value: string;
  onChange: (path: string) => void;
  alt?: string;
  onAltChange?: (alt: string) => void;
  error?: string;
  altError?: string;
}

/**
 * Image chooser. The real upload + media-library picker arrives with prompt 13; until then
 * "Choose / Upload" is a stub that fills in the placeholder image path.
 */
export function ImageField({
  label,
  value,
  onChange,
  alt,
  onAltChange,
  error,
  altError,
}: ImageFieldProps) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-lg border border-line bg-green-50">
          {value ? (
            <Image
              src={mediaUrl(value)}
              alt=""
              fill
              sizes="160px"
              className="object-cover"
              unoptimized
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="truncate text-xs text-muted">{value || 'No image chosen'}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onChange('/assets/placeholders/no-image.svg')}
          >
            Choose / Upload
          </Button>
          <p className="text-xs text-muted">
            Uploading from your device is coming in the Media step.
          </p>
          <details className="text-sm">
            <summary className="focus-ring inline-block cursor-pointer rounded text-xs font-semibold text-green-800">
              Advanced: set image path
            </summary>
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
            <TextField
              label="Image description (alt text)"
              value={alt ?? ''}
              onChange={onAltChange}
              maxLength={200}
              error={altError}
              hint="Describe the picture for visitors who cannot see it."
            />
          ) : null}
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
