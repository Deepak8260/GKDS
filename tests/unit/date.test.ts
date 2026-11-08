import { describe, expect, it } from 'vitest';
import { formatRelative } from '@/lib/date';

const now = new Date('2026-11-08T12:00:00.000Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

describe('formatRelative', () => {
  it('says "today" for the same day and for future or invalid dates', () => {
    expect(formatRelative(now.toISOString(), now)).toBe('today');
    expect(formatRelative(daysAgo(0.5), now)).toBe('today');
    expect(formatRelative('2027-01-01T00:00:00.000Z', now)).toBe('today');
    expect(formatRelative('not a date', now)).toBe('today');
  });

  it('counts single days under a week', () => {
    expect(formatRelative(daysAgo(1), now)).toBe('1 day ago');
    expect(formatRelative(daysAgo(2), now)).toBe('2 days ago');
    expect(formatRelative(daysAgo(6), now)).toBe('6 days ago');
  });

  it('counts weeks from 7 to 29 days', () => {
    expect(formatRelative(daysAgo(7), now)).toBe('1 week ago');
    expect(formatRelative(daysAgo(13), now)).toBe('1 week ago');
    expect(formatRelative(daysAgo(14), now)).toBe('2 weeks ago');
    expect(formatRelative(daysAgo(21), now)).toBe('3 weeks ago');
    expect(formatRelative(daysAgo(29), now)).toBe('4 weeks ago');
  });

  it('counts months from 30 days to a year', () => {
    expect(formatRelative(daysAgo(30), now)).toBe('1 month ago');
    expect(formatRelative(daysAgo(59), now)).toBe('1 month ago');
    expect(formatRelative(daysAgo(60), now)).toBe('2 months ago');
    expect(formatRelative(daysAgo(364), now)).toBe('12 months ago');
  });

  it('counts years from 365 days', () => {
    expect(formatRelative(daysAgo(365), now)).toBe('1 year ago');
    expect(formatRelative(daysAgo(729), now)).toBe('1 year ago');
    expect(formatRelative(daysAgo(730), now)).toBe('2 years ago');
  });

  it('accepts Date objects', () => {
    expect(formatRelative(new Date(daysAgo(21)), now)).toBe('3 weeks ago');
  });
});
