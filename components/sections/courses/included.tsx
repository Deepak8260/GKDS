import { Container } from '@/components/ui/container';
import { IconTile } from '@/components/ui/icon-tile';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import type { Courses } from '@/lib/validators';

interface IncludedProps {
  title: Courses['includedTitle'];
  items: Courses['included'];
}

/** "What's Included in the Training?": a row of icon tiles. */
export function Included({ title, items }: IncludedProps) {
  return (
    <Reveal as="section" className="py-8 md:py-12">
      <Container>
        <SectionHeading lead={title} dash="before" size="sm" />
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 xl:gap-4">
          {items.map((item, i) => (
            <li key={`${item.title}-${i}`} className="last:odd:col-span-2 md:last:odd:col-span-1">
              <IconTile icon={item.icon} label={item.title} variant="horizontal" className="h-full" />
            </li>
          ))}
        </ul>
      </Container>
    </Reveal>
  );
}
