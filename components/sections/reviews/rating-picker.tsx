'use client';

import { useState } from 'react';
import { Award } from 'lucide-react';
import type { Dict } from '@/lib/i18n/dict';
import { fmt } from '@/lib/i18n/locales';
import { cn } from '@/lib/utils';

const STAR_PATH =
  'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z';

interface RatingPickerProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  errorId?: string;
  t: Dict['reviewForm'];
}

/**
 * Whole-star rating picker built on a real radio group, so arrow keys, focus and screen readers
 * behave natively. Hovering previews a rating. Shown as a soft orange panel with a word above each star.
 */
export function RatingPicker({ value, onChange, error, errorId, t }: RatingPickerProps) {
  const WORDS = t.words;
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-orange-50 to-orange-50/40 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-5 sm:px-5"
    >
      <div className="flex items-center gap-3 sm:w-[44%] sm:border-r sm:border-orange-200/70 sm:pr-4">
        <Award className="size-9 shrink-0 text-orange-500" strokeWidth={1.5} aria-hidden="true" />
        <div>
          <legend className="float-left w-full whitespace-nowrap text-base font-bold text-ink">
            {t.rate} <span aria-hidden="true" className="text-red-600">*</span>
            <span className="sr-only">{t.required}</span>
          </legend>
          <p className="clear-both text-sm text-muted">{t.rateHint}</p>
        </div>
      </div>

      <div className="flex flex-1 items-end justify-between gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            onMouseEnter={() => setHover(n)}
            className="relative flex cursor-pointer flex-col items-center gap-1.5 rounded-lg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orange-500"
          >
            <span
              aria-hidden="true"
              className={cn(
                'whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 shadow-sm transition-colors',
                n === shown ? 'bg-orange-500 text-white' : 'bg-white/80 text-ink',
              )}
            >
              {WORDS[n]}
            </span>
            <input
              type="radio"
              name="rating"
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
              aria-label={fmt(t.starsOption, { n, stars: n === 1 ? t.star : t.starsWord, word: WORDS[n] })}
            />
            <svg viewBox="0 0 24 24" className="size-8 sm:size-9" aria-hidden="true">
              <path
                d={STAR_PATH}
                strokeLinejoin="round"
                strokeWidth={1.6}
                className={cn('transition-colors', n <= shown ? 'fill-orange-500 stroke-orange-500' : 'fill-white/40 stroke-orange-500')}
              />
            </svg>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
