/**
 * Google Maps "Embed a map" gives an `<iframe src="…">` snippet. People paste the whole thing, so pull out the `src`.
 * A plain URL is returned trimmed; anything else is returned unchanged (the schema will then report it).
 */
export function extractMapSrc(input: string): string {
  const text = input.trim();
  if (!/<iframe/i.test(text)) return text;
  const match = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(text);
  const src = (match?.[1] ?? match?.[2] ?? '').trim();
  return src.replace(/&amp;/g, '&');
}
