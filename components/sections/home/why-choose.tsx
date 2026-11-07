import { Container } from '@/components/ui/container';
import { IconTile } from '@/components/ui/icon-tile';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import type { Home } from '@/lib/validators';

/** Full-width peach band: heading on the left, five icon tiles on the right. */
export function WhyChoose({ why }: { why: Home['whyChoose'] }) {
  return (
    <Reveal as="section" className="bg-orange-50 py-10 md:py-12">
      <Container className="grid items-center gap-8 lg:grid-cols-[280px_1fr] lg:gap-10">
        <SectionHeading eyebrow={why.eyebrow} lead={why.lead} highlight={why.highlight} />
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
          {why.items.map((item, i) => (
            <li key={`${item.title}-${i}`} className="last:odd:col-span-2 md:last:odd:col-span-1">
              <IconTile icon={item.icon} label={item.title} className="h-full" />
            </li>
          ))}
        </ul>
      </Container>
    </Reveal>
  );
}
