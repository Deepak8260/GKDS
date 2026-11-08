import { WaveDivider } from './wave-divider';

/**
 * Green wave with an orange swoosh that leads from the cream page into the green footer.
 * Place it as the last element of a page, directly above <Footer/>.
 * Height: h-12 (mobile) / md:h-20 — decorations that sit on top of it should offset by the same amount.
 */
export function FooterWave() {
  return (
    <div aria-hidden="true" className="relative z-10 bg-green-900">
      <WaveDivider flip />
    </div>
  );
}
