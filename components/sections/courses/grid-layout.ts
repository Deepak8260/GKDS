export interface CourseGridLayout {
  /** Tailwind classes for the `<ul>` grid. */
  grid: string;
  /** Extra classes for the LAST item (e.g. centre a lone final card). */
  last: string;
}

/**
 * Course cards adapt to however many courses are published:
 *  - 1 course  → one full-width card
 *  - 2 courses → two columns
 *  - 3+ courses → two columns; an odd last card is centred at half width
 */
export function courseGridLayout(count: number): CourseGridLayout {
  if (count <= 1) return { grid: 'grid gap-6', last: '' };
  const odd = count % 2 === 1;
  return {
    grid: 'grid gap-6 lg:grid-cols-2',
    last: odd ? 'lg:col-span-2 lg:mx-auto lg:w-[calc(50%-0.75rem)]' : '',
  };
}
