'use client';

import { useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RepeaterProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  /** Creates a blank item for "Add". */
  createItem: () => T;
  /** Renders the fields of one item. */
  renderItem: (item: T, index: number, update: (next: T) => void) => ReactNode;
  /** Short name shown in button labels ("course", "feature"). */
  noun: string;
  max?: number;
  min?: number;
  /** Text used for aria labels, e.g. the item's title. */
  itemLabel?: (item: T, index: number) => string;
  /** Called before an item is removed; return false to cancel (e.g. a confirm dialog). */
  beforeRemove?: (item: T, index: number) => boolean | Promise<boolean>;
}

/**
 * Add / remove / reorder list. Reordering works with drag handles (mouse/touch via native drag and drop)
 * AND with up/down buttons, so it is fully keyboard accessible.
 */
export function RepeaterField<T>({ items, onChange, createItem, renderItem, noun, max, min = 0, itemLabel, beforeRemove }: RepeaterProps<T>) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const announce = (msg: string) => {
    if (liveRef.current) liveRef.current.textContent = msg;
  };

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    announce(`${noun} moved to position ${to + 1} of ${items.length}`);
  }

  async function remove(index: number) {
    if (beforeRemove && !(await beforeRemove(items[index], index))) return;
    onChange(items.filter((_, i) => i !== index));
    announce(`${noun} removed`);
  }

  const canAdd = max === undefined || items.length < max;
  const label = (item: T, i: number) => itemLabel?.(item, i) || `${noun} ${i + 1}`;

  return (
    <div>
      <p ref={liveRef} className="sr-only" role="status" aria-live="polite" />
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li
            key={i}
            draggable={dragFrom === i}
            onDragOver={(e) => {
              if (dragFrom === null) return;
              e.preventDefault();
              setDragOver(i);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragFrom !== null) move(dragFrom, i);
              setDragFrom(null);
              setDragOver(null);
            }}
            onDragEnd={() => {
              setDragFrom(null);
              setDragOver(null);
            }}
            className={cn('rounded-xl border bg-white', dragOver === i && dragFrom !== i ? 'border-orange-500' : 'border-line')}
          >
            <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
              <span
                onPointerDown={() => setDragFrom(i)}
                onPointerUp={() => setDragFrom(null)}
                className="cursor-grab touch-none rounded p-2 text-muted"
                aria-hidden="true"
                title="Drag to reorder"
              >
                <GripVertical className="size-5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{label(item, i)}</span>
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${label(item, i)} up`} className="focus-ring rounded-lg p-2.5 text-muted hover:bg-green-50 disabled:opacity-30">
                <ArrowUp className="size-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label={`Move ${label(item, i)} down`} className="focus-ring rounded-lg p-2.5 text-muted hover:bg-green-50 disabled:opacity-30">
                <ArrowDown className="size-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => void remove(i)} disabled={items.length <= min} aria-label={`Remove ${label(item, i)}`} className="focus-ring rounded-lg p-2.5 text-red-600 hover:bg-red-50 disabled:opacity-30">
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4 p-4">{renderItem(item, i, (next) => onChange(items.map((x, idx) => (idx === i ? next : x))))}</div>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Button variant="secondary" size="sm" onClick={() => onChange([...items, createItem()])} disabled={!canAdd} icon={<Plus className="size-4" aria-hidden="true" />}>
          Add {noun}
        </Button>
        {!canAdd ? <span className="ml-3 text-xs text-muted">Maximum of {max} reached</span> : null}
      </div>
    </div>
  );
}
