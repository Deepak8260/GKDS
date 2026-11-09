import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { YoutubePlayer } from '@/components/ui/youtube-player';
import { youtubeId } from '@/lib/video';
import type { Home } from '@/lib/validators';

/** "A message from the owner": welcome video with a short text. Not shown until a video link is set in the admin. */
export function OwnerMessage({ message }: { message: Home['ownerMessage'] }) {
  const id = message ? youtubeId(message.videoUrl) : null;
  if (!message || !id) return null;
  return (
    <Reveal as="section" className="section-y bg-orange-50/50" aria-label={message.title}>
      <Container className="grid items-center gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <YoutubePlayer id={id} title={message.videoTitle || message.title} />
        <div>
          <SectionHeading eyebrow={message.eyebrow} lead={message.title} size="sm" />
          <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-ink">
            {message.body}
          </p>
          {message.ownerName ? (
            <p className="mt-5 border-l-4 border-orange-500 pl-4 leading-tight">
              <span className="block text-base font-bold text-ink">{message.ownerName}</span>
              {message.ownerRole ? (
                <span className="block text-sm text-ink/75">{message.ownerRole}</span>
              ) : null}
            </p>
          ) : null}
        </div>
      </Container>
    </Reveal>
  );
}
