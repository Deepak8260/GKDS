import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { VideoPlayer } from '@/components/ui/video-player';
import { videoSource } from '@/lib/video';
import type { GalleryVideo } from '@/lib/validators';

/** Driving videos on the gallery page: a grid of click-to-play YouTube videos. */
export function DrivingVideos({
  title,
  subtitle,
  videos,
}: {
  title: string;
  subtitle?: string;
  videos: GalleryVideo[];
}) {
  const playable = videos.flatMap((v) => {
    const id = videoSource(v.url);
    return id ? [{ ...v, vid: id }] : [];
  });
  if (playable.length === 0) return null;
  return (
    <section
      id="videos"
      className="section-y border-t border-line pt-10 md:pt-14"
      aria-label={title}
    >
      <Container>
        <SectionHeading eyebrow="Watch" lead={title} subtitle={subtitle} size="md" />
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {playable.map((v) => (
            <li key={v.id}>
              <VideoPlayer source={v.vid} title={v.title} />
              <p className="mt-3 text-base font-semibold text-ink">{v.title}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
