'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Page title row: title, description and action buttons. */
export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold text-green-900 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

/** A titled white card that groups related fields. */
export function FormSection({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('mb-6 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6', className)}>
      <h2 className="font-body text-lg font-bold text-green-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <p className="font-display text-xl font-bold text-green-900">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

type Tone = 'green' | 'orange' | 'red' | 'gray';
const TONES: Record<Tone, string> = {
  green: 'bg-green-50 text-green-800',
  orange: 'bg-orange-50 text-orange-700',
  red: 'bg-red-50 text-red-700',
  gray: 'bg-gray-100 text-gray-700',
};

export function StatusPill({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', TONES[tone])}>{children}</span>;
}

/** Skeleton block for loading states. */
export function AdminSkeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-green-50', className)} />;
}

export function AdminLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <AdminSkeleton className="mb-4 h-8 w-48" />
      <AdminSkeleton className="mb-4 h-40 w-full rounded-2xl" />
      <AdminSkeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}

/** Collapsible section (one `aria-expanded` button controlling a region). */
export function Accordion({ title, summary, defaultOpen = false, children }: { title: string; summary?: ReactNode; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="rounded-xl border border-line bg-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="focus-ring flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink">{title}</span>
          {summary ? <span className="block truncate text-xs text-muted">{summary}</span> : null}
        </span>
        <ChevronDown className={cn('size-5 shrink-0 text-muted transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      <div id={id} role="region" aria-label={title} hidden={!open} className="space-y-4 border-t border-line p-4">
        {children}
      </div>
    </div>
  );
}

/** Tabs with arrow-key navigation. */
export function Tabs({ tabs, initial = 0 }: { tabs: { label: string; content: ReactNode }[]; initial?: number }) {
  const [active, setActive] = useState(initial);
  const id = useId();
  function onKey(e: React.KeyboardEvent, i: number) {
    let next = i;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    else return;
    e.preventDefault();
    setActive(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  }
  return (
    <div>
      <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            id={`${id}-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={active === i}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'focus-ring -mb-px min-h-11 whitespace-nowrap border-b-2 px-4 text-sm font-semibold',
              active === i ? 'border-orange-500 text-orange-700' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.label} id={`${id}-panel-${i}`} role="tabpanel" aria-labelledby={`${id}-tab-${i}`} hidden={active !== i}>
          {t.content}
        </div>
      ))}
    </div>
  );
}

/** Sticky bottom bar: "You have unsaved changes · Discard · Save changes". */
export function SaveBar({ dirty, saving, onSave, onDiscard, disabledReason }: { dirty: boolean; saving: boolean; onSave: () => void; onDiscard: () => void; disabledReason?: string }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3">
        <p className={cn('text-sm', dirty ? 'font-medium text-orange-700' : 'text-muted')} role="status">
          {saving ? 'Saving…' : dirty ? 'You have unsaved changes' : 'All changes saved'}
          {disabledReason ? <span className="ml-2 text-red-700">{disabledReason}</span> : null}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={onDiscard} disabled={!dirty || saving}>
            Discard
          </Button>
          <Button size="sm" onClick={onSave} disabled={!dirty || saving} icon={saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : undefined}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
