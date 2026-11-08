import { SafeImage as Image } from '@/components/ui/safe-image';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

interface FramedImageProps {
  src: string;
  alt: string;
  sizes: string;
  /** Tailwind aspect-ratio class for the photo, e.g. "aspect-[6/5]". */
  aspect?: string;
  /** CSS object-position, e.g. "75% center" (crop focus point). */
  position?: string;
  className?: string;
}

/** Rounded photo with a 2px orange outline offset down-left behind it (About story, Course highlights). */
export function FramedImage({ src, alt, sizes, aspect = 'aspect-[6/5]', position, className }: FramedImageProps) {
  return (
    <div className={cn('relative mx-2.5 mb-2.5 lg:mx-0 lg:mb-0 lg:ml-2.5 lg:mr-0', className)}>
      <span
        aria-hidden="true"
        className="absolute inset-0 -translate-x-2.5 translate-y-2.5 rounded-2xl border-2 border-orange-500"
      />
      <div className={cn('relative overflow-hidden rounded-2xl bg-green-50 shadow-card', aspect)}>
        <Image
          src={mediaUrl(src)}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
          style={position ? { objectPosition: position } : undefined}
        />
      </div>
    </div>
  );
}
