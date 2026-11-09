'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { youtubeEmbedUrl, youtubeThumbnail } from '@/lib/video';
import { cn } from '@/lib/utils';

interface YoutubePlayerProps {
  id: string;
  title: string;
  className?: string;
}

/**
 * Click-to-play YouTube video. Until it is played only a thumbnail is on the page, so nothing from YouTube loads
 * (fast pages, no tracking); playing swaps in the privacy-friendly youtube-nocookie player.
 */
export function YoutubePlayer({ id, title, className }: YoutubePlayerProps) {
  const [playing, setPlaying] = useState(false);
  return (
    <div
      className={cn(
        'relative aspect-video w-full overflow-hidden rounded-2xl bg-green-950 shadow-card',
        className,
      )}
    >
      {playing ? (
        <iframe
          src={youtubeEmbedUrl(id)}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${title}`}
          className="focus-ring group absolute inset-0 block size-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a remote YouTube thumbnail, not worth the image optimiser */}
          <img
            src={youtubeThumbnail(id)}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent"
          />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-orange-600 text-white shadow-lg ring-4 ring-white/70 transition-transform group-hover:scale-110 md:size-20"
          >
            <Play className="ml-1 size-7 fill-current md:size-9" />
          </span>
        </button>
      )}
    </div>
  );
}
