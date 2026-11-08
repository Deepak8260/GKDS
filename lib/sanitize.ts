/**
 * Control characters (except tab / newline / carriage return, which are collapsed later) plus
 * invisible and bidirectional-override characters. Built from numeric code-point ranges so the
 * source file contains no raw control characters.
 */
const REMOVABLE_RANGES: Array<[number, number]> = [
  [0x0000, 0x0008],
  [0x000b, 0x000c],
  [0x000e, 0x001f],
  [0x007f, 0x007f],
  [0x200b, 0x200f], // zero-width space/joiners, LRM/RLM
  [0x2028, 0x2029], // line / paragraph separators
  [0x202a, 0x202e], // bidi embedding / override
  [0x2060, 0x2060], // word joiner
  [0xfeff, 0xfeff], // BOM / zero-width no-break space
];
const CONTROL_AND_INVISIBLE = new RegExp(
  `[${REMOVABLE_RANGES.map(([a, b]) => `${String.fromCharCode(a)}-${String.fromCharCode(b)}`).join('')}]`,
  'g',
);

/**
 * Make free text safe to store and show: strips HTML tags and control characters, collapses all
 * whitespace to single spaces, trims and caps the length. (React escapes on render too; this keeps
 * stored data clean.)
 */
export function sanitizeText(input: string, max: number): string {
  return input
    .replace(CONTROL_AND_INVISIBLE, '')
    .replace(/<[^>]*>/g, ' ') // whole tags
    .replace(/[<>]/g, '') // stray angle brackets
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .trim();
}

const URL_PATTERNS = [
  /\bhttps?:\/\//i,
  /\bwww\./i,
  /\b[a-z0-9][a-z0-9-]*\.(?:com|net|org|in|co|io|info|biz|xyz|me|app|link|ly|shop|online|site|top|club|store|live|click)\b/i,
];
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export type ContactInfoKind = 'url' | 'email' | 'phone';

/**
 * Spam guard: reviews should not contain links, email addresses or phone numbers.
 * Returns what was found, or null if the text is clean.
 */
export function findContactInfo(text: string): ContactInfoKind | null {
  if (EMAIL_PATTERN.test(text)) return 'email';
  if (URL_PATTERNS.some((re) => re.test(text))) return 'url';
  // 8+ digits in a row once spaces, dashes, dots and brackets are ignored (e.g. "+91 98765 43210")
  if (/\+?\d{8,}/.test(text.replace(/[\s().-]/g, ''))) return 'phone';
  return null;
}
