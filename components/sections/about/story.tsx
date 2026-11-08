import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { mediaUrl } from '@/lib/media';
import type { About } from '@/lib/validators';

/** Our Story: framed photo on the left, eyebrow + two-tone title + paragraphs on the right. */
export function Story({ story }: { story: About['story'] }) {
  return (
    <Reveal as="section" className="section-y pb-6 pt-10 md:pb-8 md:pt-16">
      <Container className="grid items-center gap-10 lg:grid-cols-[48fr_52fr] lg:gap-14">
        {/* photo with an orange outline offset down-left */}
        <div className="relative mx-2.5 mb-2.5 lg:mx-0 lg:mb-0 lg:ml-2.5 lg:mr-0">
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-2.5 translate-y-2.5 rounded-2xl border-2 border-orange-500"
          />
          <div className="relative aspect-[6/5] overflow-hidden rounded-2xl bg-green-50 shadow-card">
            <Image
              src={mediaUrl(story.image)}
              alt={story.imageAlt}
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
              style={story.imagePosition ? { objectPosition: story.imagePosition } : undefined}
            />
          </div>
        </div>

        <div>
          <SectionHeading
            eyebrow={story.eyebrow}
            lead={story.titleLead}
            highlight={story.titleHighlight}
            size="lg"
            stack
          />
          <div className="mt-6 space-y-5">
            {story.paragraphs.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-ink md:text-[17px] md:leading-[1.7]">
                {p}
              </p>
            ))}
          </div>
        </div>
      </Container>
    </Reveal>
  );
}
