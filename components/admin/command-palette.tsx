'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';

export interface PaletteItem {
  id: string;
  label: string;
  /** Small grey text, e.g. "Page" or "Action". */
  hint: string;
  run: () => void;
}

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  items: PaletteItem[];
}

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return Boolean(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable));
};

const SHORTCUTS: [string, string][] = [
  ['Ctrl K  or  ⌘ K', 'Search: jump to any page or action'],
  ['?', 'Show this list of shortcuts'],
  ['Esc', 'Close a window or drawer'],
  ['Tab / Shift Tab', 'Move between buttons and fields'],
  ['↑ ↓ and Enter', 'Choose an item in the search window'],
];

/** Ctrl/⌘-K search over the admin pages and actions, plus a "?" shortcuts overlay. */
export function CommandPalette({ open, setOpen, shortcutsOpen, setShortcutsOpen, items }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === '?' && !isTyping(e.target) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen, setShortcutsOpen]);

  return (
    <>
      {open ? <Palette items={items} close={() => setOpen(false)} /> : null}
      <Modal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} title="Keyboard shortcuts">
        <dl className="divide-y divide-line text-sm">
          {SHORTCUTS.map(([keys, what]) => (
            <div key={keys} className="flex items-center justify-between gap-4 py-2.5">
              <dt className="font-semibold text-ink">{what}</dt>
              <dd className="shrink-0 rounded bg-green-50 px-2 py-1 font-mono text-xs text-green-900">{keys}</dd>
            </div>
          ))}
        </dl>
      </Modal>
    </>
  );
}

function Palette({ items, close }: { items: PaletteItem[]; close: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.label.toLowerCase().includes(q) || i.hint.toLowerCase().includes(q)) : items;
  }, [items, query]);
  const index = Math.min(active, Math.max(shown.length - 1, 0));

  function choose(item: PaletteItem | undefined) {
    if (!item) return;
    close();
    item.run();
  }

  return (
    <Modal open onClose={close} title="Search the admin panel" description="Type to find a page or an action.">
      <input
        ref={input}
        data-autofocus
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={shown[index] ? `${listId}-${shown[index].id}` : undefined}
        aria-label="Search pages and actions"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive(Math.min(index + 1, shown.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive(Math.max(index - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            choose(shown[index]);
          }
        }}
        placeholder="Courses, Gallery, Backup…"
        className="focus-ring mb-3 h-12 w-full rounded-lg border border-line px-3.5 text-base"
      />
      <ul id={listId} role="listbox" aria-label="Results" className="max-h-72 space-y-1 overflow-y-auto">
        {shown.map((item, i) => (
          <li
            key={item.id}
            id={`${listId}-${item.id}`}
            role="option"
            aria-selected={i === index}
            onMouseEnter={() => setActive(i)}
            onClick={() => choose(item)}
            className={cn('flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-sm', i === index ? 'bg-orange-50 text-orange-800' : 'text-ink hover:bg-green-50')}
          >
            <span className="font-medium">{item.label}</span>
            <span className="text-xs text-muted">{item.hint}</span>
          </li>
        ))}
        {shown.length === 0 ? (
          <li role="option" aria-selected="false" aria-disabled="true" className="px-3 py-6 text-center text-sm text-muted">
            Nothing matches “{query}”.
          </li>
        ) : null}
      </ul>
    </Modal>
  );
}
