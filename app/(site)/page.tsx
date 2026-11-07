import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';

/** Placeholder — the real Home page is built in prompt 03. */
export default function HomePage() {
  return (
    <Container className="section-y">
      <SectionHeading
        eyebrow="Foundation ready"
        lead="Learn to Drive"
        highlight="with Confidence"
        as="h1"
        size="lg"
        subtitle="The shared design system, header and footer are in place. The Home page content arrives in prompt 03."
      />
    </Container>
  );
}
