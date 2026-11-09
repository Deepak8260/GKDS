'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { pathLabel, type TranslationRow } from '@/lib/i18n/admin';
import { cn } from '@/lib/utils';
import { adminFetch } from './admin-client';
import { AdminLoading, AdminPageHeader, EmptyState, FormSection, SaveBar, StatusPill } from './blocks';
import { useDirtyGuard } from './dirty-guard';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

const DOCS = [
  { id: 'home', label: 'Home page' },
  { id: 'about', label: 'About page' },
  { id: 'courses', label: 'Courses' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'reviews', label: 'Reviews page' },
  { id: 'site', label: 'Site settings' },
] as const;
type DocId = (typeof DOCS)[number]['id'];

interface Loaded {
  rows: TranslationRow[];
  sha: string | null;
  connected: boolean;
}

type Filter = 'all' | 'missing' | 'stale';

/**
 * Odia translations of the editable website text. English on the left (read-only), Odia on the right.
 * A box left empty means visitors on the Odia site see the English text for that line.
 */
export function TranslationsEditor() {
  const toast = useToast();
  const [doc, setDoc] = useState<DocId>('home');
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [base, setBase] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const apply = useCallback((res: Loaded) => {
    setLoaded(res);
    const map = Object.fromEntries(res.rows.map((r) => [r.path, r.or]));
    setValues(map);
    setBase(map);
  }, []);

  const load = useCallback(
    (name: DocId) => {
      setLoaded(null);
      setError('');
      adminFetch<Loaded>(`/api/admin/translations/${name}`).then((res) => {
        if (res.ok) apply({ rows: res.data.rows, sha: res.data.sha, connected: res.data.connected });
        else setError(res.data.message || 'Could not load the translations.');
      });
    },
    [apply],
  );

  useEffect(() => {
    let cancelled = false;
    adminFetch<Loaded>(`/api/admin/translations/${doc}`).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setError('');
        apply({ rows: res.data.rows, sha: res.data.sha, connected: res.data.connected });
      } else {
        setError(res.data.message || 'Could not load the translations.');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [doc, apply]);

  const dirty = useMemo(() => Object.keys(values).some((k) => (values[k] ?? '') !== (base[k] ?? '')), [values, base]);
  useDirtyGuard(dirty);

  const rows = loaded?.rows ?? [];
  const translated = rows.filter((r) => (values[r.path] ?? '').trim()).length;
  const staleCount = rows.filter((r) => r.stale && values[r.path] === base[r.path]).length;

  const shown = rows.filter((r) => {
    const v = (values[r.path] ?? '').trim();
    if (filter === 'missing' && v) return false;
    if (filter === 'stale' && !(r.stale && values[r.path] === base[r.path])) return false;
    const q = query.trim().toLowerCase();
    return !q || r.en.toLowerCase().includes(q) || v.toLowerCase().includes(q) || pathLabel(r.path).toLowerCase().includes(q);
  });

  async function save() {
    if (!loaded) return;
    setSaving(true);
    const res = await adminFetch<{ sha: string }>(`/api/admin/translations/${doc}`, { method: 'PUT', body: { translations: values, sha: loaded.sha } });
    setSaving(false);
    if (res.ok) {
      toast.success('Translations saved. The Odia website updates within a few seconds.');
      load(doc);
    } else if (res.status === 409 && res.data.conflict) {
      toast.error('Someone saved these translations meanwhile. Reload the page to see the latest ones.');
    } else {
      toast.error(res.data.message || 'Could not save the translations.');
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Translations"
        description="The Odia version of your website text. English is on the left; type the Odia on the right. A line left empty shows in English on the Odia site."
        actions={
          <Button href="/or" target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
            View Odia website
          </Button>
        }
      />

      <FormSection title="Choose a page" description="Each page has its own list. Buttons, menus and other fixed words are already translated.">
        <div role="tablist" aria-label="Page to translate" className="flex flex-wrap gap-2">
          {DOCS.map((d) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={doc === d.id}
              onClick={() => {
                if (dirty && !window.confirm('You have unsaved translations. Switch page and discard them?')) return;
                setDoc(d.id);
              }}
              className={cn('focus-ring min-h-11 rounded-full border px-4 text-sm font-semibold', doc === d.id ? 'border-green-800 bg-green-800 text-white' : 'border-line bg-white text-ink hover:bg-green-50')}
            >
              {d.label}
            </button>
          ))}
        </div>
      </FormSection>

      {error ? <EmptyState title="Could not load" description={error} action={<Button onClick={() => load(doc)}>Try again</Button>} /> : null}
      {!error && !loaded ? <AdminLoading label="Loading translations" /> : null}

      {loaded && !error ? (
        <>
          {!loaded.connected ? (
            <p role="status" className="mb-5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              GitHub is not connected, so you can read the built-in translations but not save changes yet.
            </p>
          ) : null}

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p role="status" className="text-sm font-semibold text-ink">
              {translated} of {rows.length} lines have Odia text
              {staleCount ? <span className="ml-2 text-orange-700">· {staleCount} changed in English since they were translated</span> : null}
            </p>
          </div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <label className="min-w-0 flex-1 text-sm font-medium text-ink sm:max-w-xs">
              <span className="sr-only">Search translations</span>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search English or Odia…" className="focus-ring h-11 w-full rounded-lg border border-line bg-white px-3 text-sm" />
            </label>
            <label className="text-sm font-medium text-ink">
              <span className="sr-only">Show</span>
              <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="focus-ring h-11 rounded-lg border border-line bg-white px-3 text-sm">
                <option value="all">All lines</option>
                <option value="missing">Not translated yet</option>
                <option value="stale">English changed since translation</option>
              </select>
            </label>
          </div>

          {shown.length === 0 ? (
            <EmptyState title="Nothing to show" description={rows.length === 0 ? 'This page has no text to translate.' : 'No line matches these filters.'} />
          ) : (
            <ul className="space-y-4">
              {shown.map((r) => {
                const id = `tr-${doc}-${r.path}`;
                const changed = (values[r.path] ?? '') !== (base[r.path] ?? '');
                return (
                  <li key={r.path} className="rounded-2xl border border-line bg-white p-4 shadow-card">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted">{pathLabel(r.path)}</span>
                      {changed ? <StatusPill tone="orange">Edited</StatusPill> : r.source === 'saved' ? <StatusPill tone="green">Saved</StatusPill> : r.source === 'built-in' ? <StatusPill tone="gray">Built-in</StatusPill> : <StatusPill tone="red">Not translated</StatusPill>}
                      {r.stale && !changed ? <StatusPill tone="orange">English changed</StatusPill> : null}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">English</p>
                        <p lang="en" className="whitespace-pre-line rounded-lg bg-green-50/60 p-3 text-sm text-ink">
                          {r.en}
                        </p>
                      </div>
                      <div>
                        <label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                          Odia (ଓଡ଼ିଆ)
                        </label>
                        <textarea
                          id={id}
                          lang="or"
                          value={values[r.path] ?? ''}
                          onChange={(e) => setValues((v) => ({ ...v, [r.path]: e.target.value }))}
                          rows={Math.min(8, Math.max(2, Math.ceil(r.en.length / 60)))}
                          maxLength={2000}
                          className="focus-ring block w-full resize-y rounded-lg border border-line bg-white p-3 text-base"
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <SaveBar
            dirty={dirty}
            saving={saving}
            onSave={() => void save()}
            onDiscard={() => setValues(base)}
            disabledReason={!loaded.connected ? 'GitHub is not connected' : undefined}
          />
        </>
      ) : null}
    </>
  );
}
