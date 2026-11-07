/**
 * Decorative bottom edge of the Home hero: the layered green + saffron ribbon artwork,
 * stretched along the bottom of the hero. Purely visual, so it is a CSS background
 * (an <img> stretched to a different aspect ratio would be flagged by Lighthouse).
 */
export function HeroWaves() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-24 bg-[length:100%_100%] bg-bottom bg-no-repeat sm:h-28 md:h-36 lg:h-40"
      style={{ backgroundImage: 'url(/assets/decor/green-saffron-wave.webp)' }}
    />
  );
}
