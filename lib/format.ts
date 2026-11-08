/** "4.8" — one decimal place, so a perfect score reads "5.0". */
export function formatRating(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

/** "250+" → 250 (for structured data); falls back to `fallback` when there are no digits. */
export function parseCount(label: string, fallback: number): number {
  const n = parseInt(label.replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
