import { describe, expect, it } from 'vitest';
import { publicReviewSchema } from '@/lib/validators';

const valid = {
  name: 'Amit Sahoo',
  rating: 5,
  text: 'Very good training and supportive instructors.',
  company: '',
  startedAt: 1_700_000_000_000,
};
const parse = (over: Record<string, unknown>) => publicReviewSchema.safeParse({ ...valid, ...over });
const msg = (over: Record<string, unknown>) => {
  const r = parse(over);
  return r.success ? null : r.error.issues[0].message;
};

describe('publicReviewSchema', () => {
  it('accepts a normal review', () => expect(parse({}).success).toBe(true));

  describe('name (2–60 characters, letters, spaces . \' -)', () => {
    it('boundaries', () => {
      expect(parse({ name: 'A' }).success).toBe(false);
      expect(parse({ name: 'Al' }).success).toBe(true);
      expect(parse({ name: 'A'.repeat(60) }).success).toBe(true);
      expect(parse({ name: 'A'.repeat(61) }).success).toBe(false);
    });
    it('allows accents, apostrophes, dots, hyphens and other scripts', () => {
      for (const n of ['José', "O'Neil", 'Anne-Marie', 'Dr. Das', 'Ananya Mishra', 'ସୁମନ ବେହେରା', "D’Souza"]) {
        expect(parse({ name: n }).success, n).toBe(true);
      }
    });
    it('rejects digits, symbols, links and markup', () => {
      for (const n of ['Amit123', 'a@b.com', '<b>Amit</b>', 'Amit_Sahoo', '1234', '😀😀']) {
        expect(parse({ name: n }).success, n).toBe(false);
      }
    });
    it('trims surrounding spaces before checking the length', () => {
      expect(parse({ name: '   A   ' }).success).toBe(false);
      const r = parse({ name: '  Amit  ' });
      expect(r.success && r.data.name).toBe('Amit');
    });
  });

  describe('rating (whole stars 1–5)', () => {
    it('accepts 1 to 5', () => {
      for (const r of [1, 2, 3, 4, 5]) expect(parse({ rating: r }).success).toBe(true);
    });
    it('rejects 0, 6, halves, strings and missing', () => {
      for (const r of [0, 6, 4.5, -1, '5', null, undefined, NaN]) expect(parse({ rating: r }).success, String(r)).toBe(false);
      expect(msg({ rating: undefined })).toBe('Please choose a star rating.');
    });
  });

  describe('text (20–600 characters)', () => {
    it('boundaries', () => {
      expect(parse({ text: 'x'.repeat(19) }).success).toBe(false);
      expect(parse({ text: 'x'.repeat(20) }).success).toBe(true);
      expect(parse({ text: 'x'.repeat(600) }).success).toBe(true);
      expect(parse({ text: 'x'.repeat(601) }).success).toBe(false);
    });
    it('gives friendly messages', () => {
      expect(msg({ text: 'short' })).toBe('Please write at least 20 characters.');
      expect(msg({ text: 'x'.repeat(601) })).toBe('Please keep your review under 600 characters.');
    });
    it('counts length after trimming', () => {
      expect(parse({ text: `   ${'x'.repeat(10)}   ` }).success).toBe(false);
    });
  });

  it('defaults the honeypot to an empty string and requires startedAt', () => {
    const noCompany: Record<string, unknown> = { ...valid };
    delete noCompany.company;
    const r = publicReviewSchema.safeParse(noCompany);
    expect(r.success && r.data.company).toBe('');
    expect(parse({ startedAt: undefined }).success).toBe(false);
    expect(parse({ startedAt: -5 }).success).toBe(false);
  });

  it('has no photo or email field (phone is optional and admin-only)', () => {
    expect(Object.keys(publicReviewSchema.shape).sort()).toEqual(['company', 'name', 'phone', 'photo', 'rating', 'startedAt', 'text']);
  });

  it('accepts an empty or valid Indian mobile number and rejects junk', () => {
    const base = { name: 'Amit Sahoo', rating: 5, text: 'Great instructors and very patient training.', startedAt: 1 };
    expect(publicReviewSchema.safeParse({ ...base, phone: '' }).success).toBe(true);
    expect(publicReviewSchema.safeParse({ ...base, phone: '98765 43210' }).success).toBe(true);
    expect(publicReviewSchema.safeParse({ ...base, phone: '12345' }).success).toBe(false);
  });
});
