import { en } from '@/lib/i18n/dict';
import { fmt } from '@/lib/i18n/locales';

const DAY = 24 * 60 * 60 * 1000;

export type TimeLabels = typeof en.time;

/**
 * "today", "3 days ago", "1 week ago", "3 weeks ago", "1 month ago", "2 months ago", "1 year ago"…
 * Future or invalid dates read as "today".
 * (Lives in lib/date.ts, not lib/utils/date.ts: a `lib/utils/` folder would sit next to `lib/utils.ts`.)
 */
export function formatRelative(date: string | Date, now: Date = new Date(), labels: TimeLabels = en.time): string {
  const then = typeof date === 'string' ? Date.parse(date) : date.getTime();
  if (Number.isNaN(then)) return labels.today;
  const days = Math.floor((now.getTime() - then) / DAY);

  if (days < 1) return labels.today;
  if (days < 7) return days === 1 ? labels.dayAgo : fmt(labels.daysAgo, { n: days });
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? labels.weekAgo : fmt(labels.weeksAgo, { n: weeks });
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? labels.monthAgo : fmt(labels.monthsAgo, { n: months });
  }
  const years = Math.floor(days / 365);
  return years === 1 ? labels.yearAgo : fmt(labels.yearsAgo, { n: years });
}
