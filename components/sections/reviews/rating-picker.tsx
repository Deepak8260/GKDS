'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const STAR_PATH =
  'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z';
const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

interface RatingPickerProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  errorId?: string;
}

/**
 * Whole-star rating picker built on a real radio group, so arrow keys, focus and screen readers
 * behave natively. Hovering previews a rating.
 */
export function RatingPicker({ value, onChange, error, errorId }: RatingPickerProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 text-sm font-semibold text-ink">
        Rate your experience <span aria-hidden="true">*</span>
        <span className="sr-only"> (required)</span>
      </legend>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            onMouseEnter={() => setHover(n)}
            className="relative flex size-11 cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orange-500"
          >
            <input
              type="radio"
              name="rating"
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
              aria-label={`${n} ${n === 1 ? 'star' : 'stars'}, ${WORDS[n]}`}
            />
            <svg
              viewBox="0 0 24 24"
              className={cn('size-9 transition-colors', n <= shown ? 'text-orange-500' : 'text-orange-300/45')}
              fill="currentColor"
              aria-hidden="true"
            >
              <path d={STAR_PATH} />
            </svg>
          </label>
        ))}
        <span className="ml-2 min-w-20 text-sm font-semibold text-green-800" aria-hidden="true">
          {WORDS[shown]}
        </span>
      </div>
    </fieldset>
  );
}
