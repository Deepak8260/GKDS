'use client';

import { useId, useMemo, useState } from 'react';
import { ICON_NAMES, Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

/** Searchable grid of the site's icon whitelist, with a preview of the current choice. */
export function IconPicker({ label, value, onChange, error }: { label: string; value: string; onChange: (name: string) => void; error?: string }) {
  const [query, setQuery] = useState('');
  const id = useId();
  const names = useMemo(() => ICON_NAMES.filter((n) => n.includes(query.trim().toLowerCase())), [query]);

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-ink">{label}</legend>
      <div className="mb-2 flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-lg border border-line bg-green-50 text-green-800" aria-hidden="true">
          <Icon name={value} size={26} />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted">Selected</p>
          <p className="truncate text-sm font-semibold text-ink">{value || 'none'}</p>
        </div>
        <label htmlFor={id} className="sr-only">
          Search icons
        </label>
        <input
          id={id}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search icons…"
          className="focus-ring ml-auto h-11 w-40 rounded-lg border border-line px-3 text-sm sm:w-56"
        />
      </div>
      <div role="radiogroup" aria-label={label} className="grid max-h-56 grid-cols-5 gap-1.5 overflow-y-auto rounded-lg border border-line p-2 sm:grid-cols-8">
        {names.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={n}
            title={n}
            onClick={() => onChange(n)}
            className={cn('focus-ring flex aspect-square items-center justify-center rounded-lg', n === value ? 'bg-orange-500 text-white' : 'text-green-800 hover:bg-green-50')}
          >
            <Icon name={n} size={22} />
          </button>
        ))}
        {names.length === 0 ? <p className="col-span-full py-4 text-center text-sm text-muted">No icon matches “{query}”.</p> : null}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
