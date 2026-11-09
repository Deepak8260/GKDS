import { Container } from '@/components/ui/container';
import { StatBar } from '@/components/ui/stat-bar';

const ITEMS = [
  { icon: 'shield-check', title: 'Learn with Certified Instructors' },
  { icon: 'car', title: 'Safe & Practical Training' },
  { icon: 'target', title: 'Personalized Guidance' },
  { icon: 'thumbs-up', title: 'Build Confidence on the Road' },
];

/** Full-width cream band above the footer with four reassurance points. */
export function WhyStrip() {
  return (
    <section aria-label="Why learn with us" className="bg-orange-50 py-6 md:py-8">
      <Container>
        <StatBar flat iconSize={44} items={ITEMS} />
      </Container>
    </section>
  );
}
