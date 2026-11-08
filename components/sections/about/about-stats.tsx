import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { StatBar } from '@/components/ui/stat-bar';
import type { About } from '@/lib/validators';

/** Four-item stat strip under the story. */
export function AboutStats({ stats }: { stats: About['stats'] }) {
  return (
    <Reveal className="py-8 md:py-10">
      <Container>
        <StatBar items={stats} />
      </Container>
    </Reveal>
  );
}
