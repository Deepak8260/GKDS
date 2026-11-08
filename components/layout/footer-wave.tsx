import { WaveDivider } from './wave-divider';

/**
 * Green wave with an orange swoosh that leads from the cream page into the green footer.
 * Rendered once by <Footer/>, so every page ends the same way.
 * Height: h-6 (mobile) / md:h-10 — decorations that sit on top of it should offset by the same amount.
 */
export function FooterWave() {
  return (
    <div aria-hidden="true" className="relative z-10 bg-green-900">
      <WaveDivider flip className="h-6 md:h-10" />
    </div>
  );
}
