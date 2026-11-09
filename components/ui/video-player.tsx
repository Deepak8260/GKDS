import type { VideoSource } from '@/lib/video';
import { cn } from '@/lib/utils';
import { YoutubePlayer } from './youtube-player';

/** Plays either a YouTube video (click-to-play) or a video file hosted on the site. */
export function VideoPlayer({ source, title, className }: { source: VideoSource; title: string; className?: string }) {
  if (source.kind === 'youtube') return <YoutubePlayer id={source.id} title={title} className={className} />;
  return (
    <div className={cn('relative aspect-video w-full overflow-hidden rounded-2xl bg-green-950 shadow-card', className)}>
      {/* only the first moments are fetched until the visitor presses play */}
      <video controls preload="metadata" playsInline aria-label={title} className="absolute inset-0 size-full bg-black object-contain">
        <source src={source.src} type={source.src.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
      </video>
    </div>
  );
}
