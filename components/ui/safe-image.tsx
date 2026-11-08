'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

const FALLBACK = '/assets/placeholders/no-image.svg';

/**
 * next/image that never shows a broken-image icon: if the file fails to load (deleted from the
 * data repo, network trouble) it swaps to the neutral placeholder instead.
 */
export function SafeImage({ src, alt, ...rest }: ImageProps) {
  // remember which src failed, so a changed src gets a fresh attempt without an effect
  const [failedSrc, setFailedSrc] = useState<ImageProps['src'] | null>(null);
  const failed = failedSrc === src;
  return (
    <Image
      {...rest}
      src={failed ? FALLBACK : src}
      alt={alt}
      unoptimized={failed || rest.unoptimized}
      onError={(e) => {
        if (!failed) setFailedSrc(src);
        rest.onError?.(e);
      }}
    />
  );
}
