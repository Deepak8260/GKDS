/** Working-hours logic for the "Open now / Closed now" badge. Pure functions, always evaluated in India time (IST). */

export interface Schedule {
  /** 0 = Sunday … 6 = Saturday. */
  openDays: number[];
  /** "HH:MM", 24-hour, IST. */
  openFrom: string;
  openTo: string;
}

export interface OpenStatus {
  open: boolean;
  /** "Open now" / "Closed now". */
  label: string;
  /** "Closes 6:00 PM" / "Opens Monday 8:00 AM" ("" if the school has no opening days). */
  detail: string;
}

export const TIME_ZONE = 'Asia/Kolkata';
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const DAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** "08:30" → 510 (minutes after midnight). */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** "18:00" → "6:00 PM"; "08:30" → "8:30 AM"; "00:00" → "12:00 AM". */
export function formatTime12(hhmm: string): string {
  const total = toMinutes(hhmm);
  const h24 = Math.floor(total / 60) % 24;
  const m = total % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
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
export function getOpenStatus(date: Date, schedule: Schedule): OpenStatus {
  const { openDays, openFrom, openTo } = schedule;
  const { day, minutes } = istParts(date);
  const from = toMinutes(openFrom);
  const to = toMinutes(openTo);
  const days = new Set(openDays);

  if (days.size === 0 || from === to) return { open: false, label: 'Closed now', detail: '' };

  const overnight = from > to; // e.g. 22:00 → 02:00
  const openToday = days.has(day) && (overnight ? minutes >= from : minutes >= from && minutes < to);
  const openFromYesterday = overnight && days.has((day + 6) % 7) && minutes < to;

  if (openToday || openFromYesterday) {
    return { open: true, label: 'Open now', detail: `Closes ${formatTime12(openTo)}` };
  }

  // find the next opening: later today, otherwise the next open weekday (up to a week away)
  for (let offset = 0; offset <= 7; offset++) {
    const d = (day + offset) % 7;
    if (!days.has(d)) continue;
    if (offset === 0) {
      if (minutes < from) return { open: false, label: 'Closed now', detail: `Opens today ${formatTime12(openFrom)}` };
      continue; // already past today's opening
    }
    return { open: false, label: 'Closed now', detail: `Opens ${DAY_NAMES[d]} ${formatTime12(openFrom)}` };
  }
  return { open: false, label: 'Closed now', detail: '' };
}
