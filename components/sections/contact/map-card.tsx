import { addressLines } from '@/lib/address';
import type { Site } from '@/lib/validators';

/**
 * Google map in a rounded card. The iframe is lazy-loaded and the box has a fixed aspect ratio and a
 * green background, so nothing jumps while the map loads. An info chip sits over the top-left corner.
 */
export function MapCard({ site }: { site: Site }) {
  const lines = addressLines(site.address);
  return (
    // w-full matters: with an aspect-ratio box, a min-height alone can force the width past the screen on phones
    <div className="relative aspect-[4/3] min-h-[300px] w-full max-w-full overflow-hidden rounded-2xl border border-line bg-green-50 shadow-card focus-within:ring-2 focus-within:ring-orange-500 sm:aspect-[16/10]">
      <iframe
        src={site.map.embedUrl}
        title={`Map: ${site.name}, ${site.address.city}`}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 size-full border-0"
      />
      <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[75%] rounded-xl bg-white p-3 shadow-card sm:max-w-[280px]">
        <p className="text-sm font-bold leading-snug text-ink">{site.name}</p>
        <p className="mt-1 text-[12.5px] leading-snug text-muted">
          {lines.map((l, i) => (
            <span key={i} className="block">
              {l}
            </span>
          ))}
        </p>
        <a
          href={site.map.directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring pointer-events-auto mt-1 inline-flex min-h-11 items-center rounded text-[12.5px] font-semibold text-blue-700 hover:underline"
        >
          View larger map
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}
