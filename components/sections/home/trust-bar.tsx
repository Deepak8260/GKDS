import { Container } from '@/components/ui/container';
import { StatBar } from '@/components/ui/stat-bar';
import type { Home } from '@/lib/validators';

/** Floating white strip that straddles the bottom of the hero. */
export function TrustBar({ items }: { items: Home['trustBar'] }) {
  return (
    <Container>
      <StatBar
        overlap
        className="mx-auto max-w-[960px]"
        items={items.map((i) => ({ icon: i.icon, title: i.title, subtitle: i.text }))}
      />
    </Container>
  );
}
