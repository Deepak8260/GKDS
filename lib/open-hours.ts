import { en } from '@/lib/i18n/dict';
import { fmt } from '@/lib/i18n/locales';

/** Wording for the badge (English by default; the Odia site passes its own). */
export type HoursLabels = typeof en.hours;

/** Working-hours logic for the "Open now / Closed now" badge. Pure functions, always evaluated in India time (IST). */

export interface Schedule {
  /** 0 = Sunday … 6 = Saturday. */
  openDays: number[];
  /** "HH:MM", 24-hour, IST. */
  openFrom: string;
  openTo: string;
  /** Days whose hours differ from openFrom/openTo. */
  dayHours?: { day: number; from: string; to: string }[];
}

export interface OpenStatus {
  open: boolean;
  /** "Open now" / "Closed now". */
  label: string;
  /** "Closes 6:00 PM" / "Opens Monday 8:00 AM" ("" if the school has no opening days). */
  detail: string;
}

export const TIME_ZONE = 'Asia/Kolkata';
const DAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** "08:30" → 510 (minutes after midnight). */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** "18:00" → "6:00 PM"; "08:30" → "8:30 AM"; "00:00" → "12:00 AM". */
export function formatTime12(hhmm: string, labels: Pick<HoursLabels, 'am' | 'pm'> = en.hours): string {
  const total = toMinutes(hhmm);
  const h24 = Math.floor(total / 60) % 24;
  const m = total % 60;
  const suffix = h24 >= 12 ? labels.pm : labels.am;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** The weekday (0 = Sunday) and minutes after midnight in India at `date`. */
export function istParts(date: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
  return { day: DAY_INDEX[get('weekday')] ?? 0, minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}

/**
 * Is the school open at `date`, and what should the badge say?
 *  - open  → "Open now" · "Closes 6:00 PM"
 *  - closed → "Closed now" · "Opens today 8:00 AM" / "Opens Monday 8:00 AM"
 * The opening minute is inclusive and the closing minute exclusive (open 08:00–17:59, closed from 18:00).
 */
export function getOpenStatus(date: Date, schedule: Schedule, labels: HoursLabels = en.hours): OpenStatus {
  const { day, minutes } = istParts(date);
  const time = (hhmm: string) => formatTime12(hhmm, labels);
  const closed: OpenStatus = { open: false, label: labels.closedNow, detail: '' };

  // the opening range for each weekday (null = closed all day)
  const rangeFor = (d: number): { from: number; to: number; fromText: string; toText: string } | null => {
    if (!schedule.openDays.includes(d)) return null;
    const o = schedule.dayHours?.find((x) => x.day === d);
    const fromText = o?.from ?? schedule.openFrom;
    const toText = o?.to ?? schedule.openTo;
    const from = toMinutes(fromText);
    const to = toMinutes(toText);
    return from === to ? null : { from, to, fromText, toText };
  };

  const today = rangeFor(day);
  const yesterday = rangeFor((day + 6) % 7);
  if (today) {
    const overnight = today.from > today.to; // e.g. 22:00 → 02:00
    if (overnight ? minutes >= today.from : minutes >= today.from && minutes < today.to) {
      return { open: true, label: labels.openNow, detail: fmt(labels.closes, { time: time(today.toText) }) };
    }
  }
  if (yesterday && yesterday.from > yesterday.to && minutes < yesterday.to) {
    return { open: true, label: labels.openNow, detail: fmt(labels.closes, { time: time(yesterday.toText) }) };
  }

  // find the next opening: later today, otherwise the next open weekday (up to a week away)
  for (let offset = 0; offset <= 7; offset++) {
    const d = (day + offset) % 7;
    const r = rangeFor(d);
    if (!r) continue;
    if (offset === 0) {
      if (minutes < r.from) return { open: false, label: labels.closedNow, detail: fmt(labels.opensToday, { time: time(r.fromText) }) };
      continue; // already past today's opening
    }
    return { open: false, label: labels.closedNow, detail: fmt(labels.opensDay, { day: labels.days[d], time: time(r.fromText) }) };
  }
  return closed;
}
