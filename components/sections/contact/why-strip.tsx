import { Container } from '@/components/ui/container';
import { StatBar } from '@/components/ui/stat-bar';
import { tFor } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locales';

const ICONS = ['shield-check', 'car', 'target', 'thumbs-up'];

/** Full-width cream band above the footer with four reassurance points. */
export function WhyStrip({ locale = 'en' }: { locale?: Locale }) {
  const t = tFor(locale).contact;
  const items = ICONS.map((icon, i) => ({ icon, title: t.why[i] }));
  return (
    <section aria-label={t.whyLabel} className="bg-orange-50 py-6 md:py-8">
      <Container>
        <StatBar flat iconSize={44} items={items} />
      </Container>
    </section>
  );
}
