import type { Site } from '@/lib/validators';

/**
 * Postal address as display lines, e.g.
 *   ["Near Baleswar Bus Stand,", "Baleswar, Odisha – 756001"]
 * Line 1 is `line1` (+ `, line2`), with the landmark in brackets when one is set.
 */
export function addressLines(address: Site['address']): string[] {
  const street = [address.line1, address.line2].filter(Boolean).join(', ');
  const landmark = address.landmark?.trim();
  const first = landmark && !street.toLowerCase().includes(landmark.toLowerCase()) ? `${street} (${landmark})` : street;
  return [`${first},`, `${address.city}, ${address.state} – ${address.pin}`];
}
