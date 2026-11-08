import { CheckList } from '@/components/ui/check-list';
import { Container } from '@/components/ui/container';
import { FramedImage } from '@/components/ui/framed-image';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import type { Courses } from '@/lib/validators';

/** "Training Highlights": framed photo of a lesson on the left, check-list on the right. */
export function Highlights({ highlights }: { highlights: Courses['highlights'] }) {
  return (
    <Reveal as="section" className="section-y">
      <Container className="grid items-center gap-10 lg:grid-cols-[52fr_48fr] lg:gap-14">
        <FramedImage
          src={highlights.image}
          alt={highlights.imageAlt}
          sizes="(min-width: 1024px) 600px, 100vw"
          aspect="aspect-[16/10]"
        />
        <div>
          <SectionHeading lead={highlights.lead} highlight={highlights.highlight} size="md" />
          <CheckList className="mt-7 gap-4" size="lg" items={highlights.items} />
        </div>
      </Container>
    </Reveal>
  );
}
