import { describe, expect, it } from 'vitest';
import { addressLines } from '@/lib/address';
import { formatTime12, getOpenStatus, istParts, toMinutes, type Schedule } from '@/lib/open-hours';

// Mon–Sat 08:00–18:00 IST, Sunday closed (the school's real hours)
const school: Schedule = { openDays: [1, 2, 3, 4, 5, 6], openFrom: '08:00', openTo: '18:00' };

/** A moment given in IST. IST = UTC+05:30, so subtract that to get the UTC instant. */
const ist = (isoDateTimeIst: string) => new Date(new Date(`${isoDateTimeIst}:00Z`).getTime() - 5.5 * 3600 * 1000);

// 2026-11-08 is a Sunday, 2026-11-09 a Monday … 2026-11-14 a Saturday
describe('istParts', () => {
  it('reads the weekday and minutes in India, not in the server time zone', () => {
    expect(istParts(ist('2026-11-09T09:00'))).toEqual({ day: 1, minutes: 540 });
    expect(istParts(ist('2026-11-08T10:30'))).toEqual({ day: 0, minutes: 630 });
  });
  it('rolls over to the next IST day when it is still the previous day in UTC', () => {
    // 20:00 UTC Sunday = 01:30 IST Monday
    expect(istParts(new Date('2026-11-08T20:00:00Z'))).toEqual({ day: 1, minutes: 90 });
  });
  it('handles midnight', () => {
    expect(istParts(ist('2026-11-09T00:00'))).toEqual({ day: 1, minutes: 0 });
  });
});

describe('getOpenStatus — the acceptance cases', () => {
  it('Monday 9:00 AM → open, closes 6:00 PM', () => {
    expect(getOpenStatus(ist('2026-11-09T09:00'), school)).toEqual({ open: true, label: 'Open now', detail: 'Closes 6:00 PM' });
  });
  it('Sunday 10:00 AM → closed, opens Monday 8:00 AM', () => {
    expect(getOpenStatus(ist('2026-11-08T10:00'), school)).toEqual({ open: false, label: 'Closed now', detail: 'Opens Monday 8:00 AM' });
  });
  it('Monday 6:30 PM → closed, opens Tuesday 8:00 AM', () => {
    expect(getOpenStatus(ist('2026-11-09T18:30'), school)).toEqual({ open: false, label: 'Closed now', detail: 'Opens Tuesday 8:00 AM' });
  });
});

describe('getOpenStatus — boundaries and next opening', () => {
  it('opening minute is open, one minute earlier is closed (opens today)', () => {
    expect(getOpenStatus(ist('2026-11-09T08:00'), school).open).toBe(true);
    const before = getOpenStatus(ist('2026-11-09T07:59'), school);
    expect(before).toEqual({ open: false, label: 'Closed now', detail: 'Opens today 8:00 AM' });
  });
  it('last open minute is 5:59 PM; 6:00 PM is closed', () => {
    expect(getOpenStatus(ist('2026-11-09T17:59'), school).open).toBe(true);
    expect(getOpenStatus(ist('2026-11-09T18:00'), school).open).toBe(false);
  });
  it('Saturday evening skips closed Sunday: opens Monday', () => {
    expect(getOpenStatus(ist('2026-11-14T19:00'), school).detail).toBe('Opens Monday 8:00 AM');
  });
  it('Saturday is an open day', () => {
    expect(getOpenStatus(ist('2026-11-14T12:00'), school).open).toBe(true);
  });
  it('very early morning on a working day: opens today', () => {
    expect(getOpenStatus(ist('2026-11-10T03:00'), school).detail).toBe('Opens today 8:00 AM');
  });
  it('is evaluated in IST even when the visitor/server clock is elsewhere', () => {
    // 03:30 UTC Monday = 09:00 IST Monday → open. (In US Pacific it would still be Sunday evening.)
    expect(getOpenStatus(new Date('2026-11-09T03:30:00Z'), school).open).toBe(true);
    // 12:29 UTC Monday = 17:59 IST open; 12:30 UTC = 18:00 IST closed
    expect(getOpenStatus(new Date('2026-11-09T12:29:00Z'), school).open).toBe(true);
    expect(getOpenStatus(new Date('2026-11-09T12:30:00Z'), school).open).toBe(false);
  });
});

describe('getOpenStatus — unusual schedules', () => {
  it('no open days → always closed, nothing to say about the next opening', () => {
    expect(getOpenStatus(ist('2026-11-09T09:00'), { ...school, openDays: [] })).toEqual({ open: false, label: 'Closed now', detail: '' });
  });
  it('from === to → never open', () => {
    expect(getOpenStatus(ist('2026-11-09T09:00'), { ...school, openFrom: '08:00', openTo: '08:00' }).open).toBe(false);
  });
  it('a single open day: after closing, the next opening is the same weekday next week', () => {
    const onlyMonday: Schedule = { openDays: [1], openFrom: '08:00', openTo: '18:00' };
    expect(getOpenStatus(ist('2026-11-09T19:00'), onlyMonday).detail).toBe('Opens Monday 8:00 AM');
    expect(getOpenStatus(ist('2026-11-11T10:00'), onlyMonday).detail).toBe('Opens Monday 8:00 AM');
  });
  it('overnight hours (22:00–02:00): open late evening and the early hours after', () => {
    const night: Schedule = { openDays: [5, 6], openFrom: '22:00', openTo: '02:00' };
    expect(getOpenStatus(ist('2026-11-13T23:00'), night).open).toBe(true); // Fri 23:00
    expect(getOpenStatus(ist('2026-11-14T01:00'), night).open).toBe(true); // Sat 01:00 (Friday's shift)
    expect(getOpenStatus(ist('2026-11-14T12:00'), night).open).toBe(false);
  });
});

describe('time helpers', () => {
  it('toMinutes', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('08:30')).toBe(510);
    expect(toMinutes('23:59')).toBe(1439);
  });
  it('formatTime12', () => {
    expect(formatTime12('08:00')).toBe('8:00 AM');
    expect(formatTime12('18:00')).toBe('6:00 PM');
    expect(formatTime12('12:00')).toBe('12:00 PM');
    expect(formatTime12('00:00')).toBe('12:00 AM');
    expect(formatTime12('13:05')).toBe('1:05 PM');
    expect(formatTime12('23:59')).toBe('11:59 PM');
  });
});

describe('addressLines', () => {
  const base = { line1: 'Near Baleswar Bus Stand', city: 'Baleswar', state: 'Odisha', pin: '756001' };
  it('matches the design', () => {
    expect(addressLines(base)).toEqual(['Near Baleswar Bus Stand,', 'Baleswar, Odisha – 756001']);
  });
  it('adds line 2 and a landmark', () => {
    expect(addressLines({ ...base, line2: 'Station Road', landmark: 'Opp. Hanuman Mandir' })).toEqual([
      'Near Baleswar Bus Stand, Station Road (Opp. Hanuman Mandir),',
      'Baleswar, Odisha – 756001',
    ]);
  });
  it('does not repeat a landmark that is already in the street line', () => {
    expect(addressLines({ ...base, landmark: 'Bus Stand' })[0]).toBe('Near Baleswar Bus Stand,');
  });
  it('ignores an empty landmark', () => {
    expect(addressLines({ ...base, landmark: '  ' })[0]).toBe('Near Baleswar Bus Stand,');
  });
});
