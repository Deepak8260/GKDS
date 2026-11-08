const DAY = 24 * 60 * 60 * 1000;

/**
 * "today", "3 days ago", "1 week ago", "3 weeks ago", "1 month ago", "2 months ago", "1 year ago"…
 * Future or invalid dates read as "today".
 * (Lives in lib/date.ts, not lib/utils/date.ts: a `lib/utils/` folder would sit next to `lib/utils.ts`.)
 */
export function formatRelative(date: string | Date, now: Date = new Date()): string {
  const then = typeof date === 'string' ? Date.parse(date) : date.getTime();
  if (Number.isNaN(then)) return 'today';
  const days = Math.floor((now.getTime() - then) / DAY);

  if (days < 1) return 'today';
  if (days < 7) return days === 1 ? '1 day ago' : `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}
