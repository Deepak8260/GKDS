import { Container } from '@/components/ui/container';
import { FramedImage } from '@/components/ui/framed-image';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import type { About } from '@/lib/validators';

/** Our Story: framed photo on the left, eyebrow + two-tone title + paragraphs on the right. */
export function Story({ story }: { story: About['story'] }) {
  return (
    <Reveal as="section" className="section-y pb-6 pt-10 md:pb-8 md:pt-10">
      <Container className="grid items-center gap-10 lg:grid-cols-[40fr_60fr] lg:gap-12">
        <FramedImage
          src={story.image}
          alt={story.imageAlt}
          sizes="(min-width: 1024px) 440px, 100vw"
          aspect="aspect-[4/3]"
          className="mx-auto w-full max-w-[460px] lg:max-w-none"
          position={story.imagePosition}
        />

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
              <p key={i} className="text-base leading-relaxed text-ink md:text-[14.5px] md:leading-[1.7]">
                {p}
              </p>
            ))}
          </div>
        </div>
      </Container>
    </Reveal>
  );
}
