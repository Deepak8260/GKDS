import { describe, expect, it } from 'vitest';
import { findContactInfo, sanitizeText } from '@/lib/sanitize';

const ch = (...codes: number[]) => String.fromCharCode(...codes);

describe('sanitizeText', () => {
  it('strips HTML tags and keeps the words', () => {
    expect(sanitizeText('<b>Great</b> training, <i>very</i> helpful', 600)).toBe('Great training, very helpful');
    expect(sanitizeText('Nice <script>alert(1)</script> school', 600)).toBe('Nice alert(1) school');
  });

  it('removes stray angle brackets', () => {
    expect(sanitizeText('5 > 3 and 2 < 4', 600)).toBe('5 3 and 2 4');
  });

  it('removes control and zero-width characters', () => {
    const dirty = `Good${ch(0)}${ch(7)} train${ch(0x200b)}ing${ch(0xfeff)}${ch(0x202e)} here`;
    expect(sanitizeText(dirty, 600)).toBe('Good training here');
  });

  it('collapses whitespace and newlines and trims', () => {
    expect(sanitizeText('  Very   good\n\n  school \t today  ', 600)).toBe('Very good school today');
  });

  it('caps the length', () => {
    const out = sanitizeText('a'.repeat(700), 600);
    expect(out).toHaveLength(600);
    expect(sanitizeText('hello world', 5)).toBe('hello');
  });

  it('leaves normal text, accents and Odia/Hindi untouched', () => {
    expect(sanitizeText('Excellent training — José & Anne-Marie said "great"!', 600)).toBe(
      'Excellent training — José & Anne-Marie said "great"!',
    );
    expect(sanitizeText('ବହୁତ ଭଲ ଶିକ୍ଷା', 600)).toBe('ବହୁତ ଭଲ ଶିକ୍ଷା');
  });
});

describe('findContactInfo', () => {
  it('flags links', () => {
    expect(findContactInfo('visit https://spam.example now')).toBe('url');
    expect(findContactInfo('see www.cheap-licences.com')).toBe('url');
    expect(findContactInfo('buy at cheaplicence.in today')).toBe('url');
    expect(findContactInfo('HTTP://EVIL.TEST')).toBe('url');
  });

  it('flags email addresses', () => {
    expect(findContactInfo('mail me at someone@gmail.com')).toBe('email');
  });

  it('flags phone numbers however they are written', () => {
    expect(findContactInfo('call 9876543210')).toBe('phone');
    expect(findContactInfo('call +91 98765 43210')).toBe('phone');
    expect(findContactInfo('call 98765-43210')).toBe('phone');
    expect(findContactInfo('call (0678) 123-4567')).toBe('phone');
  });

  it('allows ordinary reviews, including numbers and abbreviations', () => {
    expect(findContactInfo('Very good training and supportive instructors. Highly recommended!')).toBeNull();
    expect(findContactInfo('I got my licence in 2 weeks. 5/5 would recommend, paid 3500 only.')).toBeNull();
    expect(findContactInfo('Trained 30+ years of experience, Mr. Das is great. U.S. style teaching.')).toBeNull();
    expect(findContactInfo('They teach on WagonR and Maruti 800.')).toBeNull();
  });
});
