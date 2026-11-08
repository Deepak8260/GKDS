'use client';

import { useCallback, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useClickOutside } from '@/lib/hooks/use-click-outside';
import { cn } from '@/lib/utils';
import { SORT_OPTIONS, type SortMode } from './review-utils';

interface SortSelectProps {
  value: SortMode;
  onChange: (value: SortMode) => void;
}

/**
 * Accessible "select-only combobox" (WAI-ARIA pattern): a button that opens a listbox.
 * Enter / Space / ↓ / ↑ open it, ↑ ↓ Home End move, Enter / Space choose, Esc closes, Tab closes.
 */
export function SortSelect({ value, onChange }: SortSelectProps) {
  const uid = useId();
  const labelId = `${uid}-label`;
  const buttonId = `${uid}-button`;
  const listId = `${uid}-list`;
  const optionId = (i: number) => `${uid}-option-${i}`;

  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, SORT_OPTIONS.findIndex((o) => o.id === value));
  const [active, setActive] = useState(selectedIndex);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(wrapRef, close, open);

  function openList() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(index: number) {
    onChange(SORT_OPTIONS[index].id);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const last = SORT_OPTIONS.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(last);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <span id={labelId} className="sr-only">
        Sort reviews by
      </span>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${labelId} ${buttonId}`}
        aria-activedescendant={open ? optionId(active) : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className="focus-ring inline-flex h-11 min-w-[11.5rem] items-center justify-between gap-3 rounded-xl border border-green-800 bg-white px-4 text-[15px] font-semibold text-green-900 hover:bg-green-50"
      >
        {SORT_OPTIONS[selectedIndex].label}
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          className="absolute right-0 z-30 mt-2 w-full min-w-[12.5rem] animate-fade-up overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-card-lg"
        >
          {SORT_OPTIONS.map((opt, i) => (
            <li
              key={opt.id}
              id={optionId(i)}
              role="option"
              aria-selected={opt.id === value}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={cn(
                'flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-[15px] font-medium text-green-900',
                i === active && 'bg-orange-50',
                opt.id === value && 'font-semibold',
              )}
            >
              {opt.label}
              {opt.id === value ? <Check className="size-4 text-orange-600" aria-hidden="true" /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
