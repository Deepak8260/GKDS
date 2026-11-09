'use client';

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ExternalLink, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatRelative } from '@/lib/date';
import { getAt, prettyPath, setAt } from '@/lib/admin/path';
import { DEFAULTS } from '@/lib/admin/seeds';
import { parseContent } from '@/lib/validators';
import {
  AdminLoading,
  AdminPageHeader,
  Accordion,
  EmptyState,
  FormSection,
  SaveBar,
} from './blocks';
import { useConfirm } from './confirm';
import { FieldShell, NumberField, TextArea, TextField, Toggle } from './fields';
import { IconPicker } from './icon-picker';
import { ImageField } from './image-field';
import { RepeaterField } from './repeater';
import { useAdminResource } from './use-admin-resource';

type EditableName = 'site' | 'home' | 'about';

interface EditorApi {
  name: EditableName;
  get: (path: string) => unknown;
  set: (path: string, value: unknown) => void;
  err: (path: string) => string | undefined;
  errors: Record<string, string>;
  /** Replace the listed paths (or a whole section) with the bundled defaults. */
  resetPaths: (paths: string[]) => void;
}

const EditorContext = createContext<EditorApi | null>(null);

/** Access the draft inside a `<ContentEditor>` (for custom widgets). */
export function useEditor(): EditorApi {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used inside <ContentEditor>');
  return ctx;
}

const str = (v: unknown) =>
  typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v);

/* ------------------------------------------------------------------ */
/* The editor page                                                      */
/* ------------------------------------------------------------------ */

interface ContentEditorProps {
  name: EditableName;
  title: string;
  description: string;
  /** Public page opened by "Preview page". */
  previewPath: string;
  children: ReactNode;
}

/**
 * One editor for one content document. Sections are plain children built from the path-bound fields below,
 * so adding a field later is one line. Validation always uses the same zod schema as the server.
 */
export function ContentEditor({
  name,
  title,
  description,
  previewPath,
  children,
}: ContentEditorProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const r = useAdminResource(name);
  const [attempted, setAttempted] = useState(false);

  // after the first failed save the form re-checks itself on every edit
  const clientErrors = useMemo<Record<string, string>>(() => {
    if (!attempted || !r.draft) return {};
    const parsed = parseContent(name, r.draft);
    return parsed.ok ? {} : parsed.errors;
  }, [attempted, r.draft, name]);
  const errors = useMemo(() => ({ ...r.errors, ...clientErrors }), [r.errors, clientErrors]);

  const set = useCallback(
    (path: string, value: unknown) =>
      r.setDraft((d) => (d ? (setAt(d, path, value) as typeof d) : d)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [r.setDraft],
  );

  const resetPaths = useCallback(
    async (paths: string[]) => {
      const ok = await confirm({
        title: 'Reset to default?',
        message:
          'This replaces what you have typed in this section with the original content. You can still discard before saving.',
        confirmLabel: 'Reset section',
      });
      if (!ok) return;
      r.setDraft((d) => {
        if (!d) return d;
        let next: unknown = d;
        for (const p of paths) next = setAt(next, p, structuredClone(getAt(DEFAULTS[name], p)));
        return next as typeof d;
      });
    },
    [confirm, name, r],
  );

  const api = useMemo<EditorApi>(
    () => ({ name, get: (p) => getAt(r.draft, p), set, err: (p) => errors[p], errors, resetPaths }),
    [name, r.draft, set, errors, resetPaths],
  );

  async function onSave() {
    if (!r.draft) return;
    setAttempted(true);
    const parsed = parseContent(name, r.draft);
    if (!parsed.ok) {
      toast.error('Please fix the highlighted fields.');
      requestAnimationFrame(() =>
        document
          .getElementById('editor-errors')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      );
      return;
    }
    // unknown keys are stripped and text trimmed by the schema: only valid, known data is ever saved
    if (await r.save(parsed.data)) setAttempted(false);
  }

  async function onResetAll() {
    const ok = await confirm({
      title: 'Reset the whole page to default?',
      message:
        'Every section on this page goes back to the original content. Nothing is saved until you press Save changes.',
      confirmLabel: 'Reset all',
      danger: true,
    });
    if (ok) r.setDraft(structuredClone(DEFAULTS[name]) as typeof r.draft);
  }

  if (r.loading) return <AdminLoading label={`Loading ${title}`} />;
  if (r.loadError || !r.draft) {
    return (
      <>
        <AdminPageHeader title={title} />
        <EmptyState
          title="Could not load this page"
          description={r.loadError || 'Please try again.'}
          action={<Button onClick={r.reload}>Try again</Button>}
        />
      </>
    );
  }

  const errorEntries = Object.entries(errors);

  return (
    <EditorContext.Provider value={api}>
      <AdminPageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void onResetAll()}
              icon={<RotateCcw className="size-4" aria-hidden="true" />}
            >
              Reset all
            </Button>
            <Button
              href={previewPath}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="sm"
              iconRight={<ExternalLink className="size-4" aria-hidden="true" />}
            >
              Preview page
            </Button>
          </>
        }
      />
      <p className="-mt-3 mb-6 text-sm text-muted">
        {r.updatedAt
          ? `Last saved ${formatRelative(r.updatedAt)} by admin.`
          : 'Not saved yet — showing the default content.'}
      </p>

      {r.warning ? (
        <p
          role="status"
          className="mb-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800"
        >
          {r.warning}
        </p>
      ) : null}

      {errorEntries.length > 0 ? (
        <div
          id="editor-errors"
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-semibold">
            {errorEntries.length === 1
              ? '1 field needs attention'
              : `${errorEntries.length} fields need attention`}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errorEntries.slice(0, 8).map(([path, message]) => (
              <li key={path}>
                <button
                  type="button"
                  className="focus-ring rounded text-left underline underline-offset-2"
                  onClick={() => focusField(path)}
                >
                  {prettyPath(path)}
                </button>
                : {message}
              </li>
            ))}
          </ul>
          {errorEntries.length > 8 ? (
            <p className="mt-2">…and {errorEntries.length - 8} more.</p>
          ) : null}
        </div>
      ) : null}

      {children}

      <SaveBar
        dirty={r.dirty}
        saving={r.saving}
        onSave={() => void onSave()}
        onDiscard={() => {
          r.discard();
          setAttempted(false);
        }}
      />

      <Modal
        open={r.conflict !== null}
        onClose={r.keepEditing}
        title="This content was changed elsewhere"
        description="Someone (or another device) saved a newer version while you were editing."
      >
        <p className="mb-5 text-sm text-ink">
          <strong>Reload latest</strong> throws away what you typed and shows the newer version.{' '}
          <strong>Keep editing</strong> keeps your changes; saving again will replace the newer
          version.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={r.keepEditing}>
            Keep editing
          </Button>
          <Button size="sm" onClick={r.reloadLatest} data-autofocus>
            Reload latest
          </Button>
        </div>
      </Modal>
    </EditorContext.Provider>
  );
}

/** Move focus to the control for a dotted path (used by the error summary). */
function focusField(path: string) {
  requestAnimationFrame(() => {
    // an error on a list itself ("phones") or on a child ("phones.0") both resolve to the closest wrapper
    let p = path;
    while (p) {
      const wrap = document.querySelector<HTMLElement>(`[data-field-path="${CSS.escape(p)}"]`);
      if (wrap) {
        wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        wrap
          .querySelector<HTMLElement>('input, textarea, select, button')
          ?.focus({ preventScroll: true });
        return;
      }
      p = p.includes('.') ? p.slice(0, p.lastIndexOf('.')) : '';
    }
  });
}

/* ------------------------------------------------------------------ */
/* Sections                                                             */
/* ------------------------------------------------------------------ */

interface SectionProps {
  title: string;
  description?: string;
  /** Paths this section edits: used for "Reset section to default" and to open itself when it has errors. */
  paths: string[];
  /** Collapsible (Home page) instead of a plain card. */
  accordion?: boolean;
  summary?: ReactNode;
  children: ReactNode;
}

export function Section({ title, description, paths, accordion, summary, children }: SectionProps) {
  const ed = useEditor();
  const hasError = Object.keys(ed.errors).some((k) =>
    paths.some((p) => k === p || k.startsWith(`${p}.`)),
  );
  const reset = (
    <div className="flex justify-end">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => ed.resetPaths(paths)}
        icon={<RotateCcw className="size-4" aria-hidden="true" />}
      >
        Reset section to default
      </Button>
    </div>
  );
  if (accordion) {
    return (
      <div className="mb-4">
        <Accordion
          key={String(hasError)}
          title={title}
          summary={summary ?? description}
          defaultOpen={hasError}
        >
          {children}
          {reset}
        </Accordion>
      </div>
    );
  }
  return (
    <FormSection title={title} description={description}>
      {children}
      {reset}
    </FormSection>
  );
}

/* ------------------------------------------------------------------ */
/* Path-bound fields                                                    */
/* ------------------------------------------------------------------ */

interface Common {
  path: string;
  label: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
}

function Wrap({
  path,
  children,
  className,
}: {
  path: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-field-path={path} className={className}>
      {children}
    </div>
  );
}

export function Text({
  path,
  label,
  hint,
  required,
  className,
  maxLength,
  placeholder,
  inputMode,
  type,
}: Common & {
  maxLength?: number;
  placeholder?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
  type?: 'text' | 'email' | 'tel';
}) {
  const ed = useEditor();
  return (
    <Wrap path={path} className={className}>
      <TextField
        label={label}
        hint={hint}
        required={required}
        value={str(ed.get(path))}
        onChange={(v) => ed.set(path, v)}
        maxLength={maxLength}
        placeholder={placeholder}
        inputMode={inputMode}
        type={type}
        error={ed.err(path)}
      />
    </Wrap>
  );
}

export function Area({
  path,
  label,
  hint,
  required,
  className,
  maxLength,
  rows,
  transform,
}: Common & {
  maxLength?: number;
  rows?: number;
  /** Applied to what is typed or pasted before it is stored. */ transform?: (
    value: string,
  ) => string;
}) {
  const ed = useEditor();
  return (
    <Wrap path={path} className={className}>
      <TextArea
        label={label}
        hint={hint}
        required={required}
        value={str(ed.get(path))}
        onChange={(v) => ed.set(path, transform ? transform(v) : v)}
        maxLength={maxLength}
        rows={rows}
        error={ed.err(path)}
      />
    </Wrap>
  );
}

export function Num({
  path,
  label,
  hint,
  required,
  className,
  min,
  max,
  step,
}: Common & { min?: number; max?: number; step?: number }) {
  const ed = useEditor();
  const v = ed.get(path);
  return (
    <Wrap path={path} className={className}>
      <NumberField
        label={label}
        hint={hint}
        required={required}
        value={typeof v === 'number' ? v : undefined}
        onChange={(n) => ed.set(path, n)}
        min={min}
        max={max}
        step={step}
        error={ed.err(path)}
      />
    </Wrap>
  );
}

export function Switch({ path, label, hint, className }: Omit<Common, 'required'>) {
  const ed = useEditor();
  return (
    <Toggle
      label={label}
      hint={hint}
      className={className}
      checked={Boolean(ed.get(path))}
      onChange={(v) => ed.set(path, v)}
    />
  );
}

/** Image + alt text. `altPath` is omitted for images without alt text (logo, favicon, share image). */
export function Img({
  path,
  altPath,
  label,
  hint,
}: {
  path: string;
  altPath?: string;
  label: string;
  hint?: ReactNode;
}) {
  const ed = useEditor();
  return (
    <Wrap path={path}>
      <ImageField
        label={label}
        value={str(ed.get(path))}
        onChange={(v) => ed.set(path, v)}
        alt={altPath ? str(ed.get(altPath)) : undefined}
        onAltChange={altPath ? (v) => ed.set(altPath, v) : undefined}
        error={ed.err(path)}
        altError={altPath ? ed.err(altPath) : undefined}
      />
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </Wrap>
  );
}

export function Icons({ path, label }: { path: string; label: string }) {
  const ed = useEditor();
  return (
    <Wrap path={path}>
      <IconPicker
        label={label}
        value={str(ed.get(path))}
        onChange={(v) => ed.set(path, v)}
        error={ed.err(path)}
      />
    </Wrap>
  );
}

/** A repeatable list at `path`. `children(base, index)` renders one item's fields with paths under `base`. */
export function List({
  path,
  noun,
  min,
  max,
  createItem,
  itemLabel,
  children,
}: {
  path: string;
  noun: string;
  min?: number;
  max?: number;
  createItem: () => unknown;
  /** Heading of one item, e.g. its title. Receives the item value. */
  itemLabel?: (item: unknown, index: number) => string;
  children: (base: string, index: number) => ReactNode;
}) {
  const ed = useEditor();
  const items = (ed.get(path) as unknown[] | undefined) ?? [];
  return (
    <Wrap path={path}>
      <RepeaterField
        items={items}
        onChange={(next) => ed.set(path, next)}
        createItem={createItem}
        noun={noun}
        min={min}
        max={max}
        itemLabel={itemLabel}
        renderItem={(_item, i) => children(`${path}.${i}`, i)}
      />
      {ed.err(path) ? (
        <p role="alert" className="mt-2 text-sm font-medium text-red-700">
          {ed.err(path)}
        </p>
      ) : null}
    </Wrap>
  );
}

/** Tag/keyword input: type and press Enter or comma. */
export function Tags({
  path,
  label,
  hint,
  max = 20,
}: {
  path: string;
  label: string;
  hint?: ReactNode;
  max?: number;
}) {
  const ed = useEditor();
  const [draft, setDraft] = useState('');
  const id = useId();
  const tags = (ed.get(path) as string[] | undefined) ?? [];

  function add(raw: string) {
    const parts = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...tags];
    for (const p of parts)
      if (!next.some((t) => t.toLowerCase() === p.toLowerCase()) && next.length < max) next.push(p);
    ed.set(path, next);
    setDraft('');
  }

  return (
    <Wrap path={path}>
      <FieldShell
        label={label}
        hint={hint ?? 'Type a keyword and press Enter (or add several separated by commas).'}
        error={ed.err(path)}
      >
        {({ id: fieldId, describedBy, invalid }) => (
          <div
            className={`rounded-lg border bg-white p-2 ${invalid ? 'border-red-600' : 'border-line'}`}
          >
            {tags.length > 0 ? (
              <ul className="mb-2 flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <li
                    key={`${t}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-green-50 py-1 pl-3 pr-1 text-sm text-green-900"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() =>
                        ed.set(
                          path,
                          tags.filter((_, idx) => idx !== i),
                        )
                      }
                      aria-label={`Remove ${t}`}
                      className="focus-ring rounded-full p-1.5 hover:bg-green-100"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <input
              id={fieldId || id}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  add(draft);
                } else if (e.key === 'Backspace' && !draft && tags.length) {
                  ed.set(path, tags.slice(0, -1));
                }
              }}
              onBlur={() => add(draft)}
              maxLength={60}
              placeholder={tags.length >= max ? `Maximum of ${max} reached` : 'Add a keyword…'}
              disabled={tags.length >= max}
              aria-describedby={describedBy}
              className="focus-ring h-10 w-full rounded-md px-2 text-base"
            />
          </div>
        )}
      </FieldShell>
    </Wrap>
  );
}

/** 24-hour time input (HH:MM). */
export function Time({ path, label, hint, className }: Omit<Common, 'required'>) {
  const ed = useEditor();
  return (
    <Wrap path={path} className={className}>
      <FieldShell label={label} hint={hint} error={ed.err(path)}>
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            type="time"
            value={str(ed.get(path))}
            onChange={(e) => ed.set(path, e.target.value)}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={`focus-ring block h-12 w-full rounded-lg border bg-white px-3.5 text-base text-ink ${invalid ? 'border-red-600' : 'border-line'}`}
          />
        )}
      </FieldShell>
    </Wrap>
  );
}

/** Dropdown bound to a path; `numeric` stores the option value as a number. */
export function Choice({
  path,
  label,
  hint,
  className,
  options,
  numeric,
}: Omit<Common, 'required'> & { options: { value: string; label: string }[]; numeric?: boolean }) {
  const ed = useEditor();
  return (
    <Wrap path={path} className={className}>
      <FieldShell label={label} hint={hint} error={ed.err(path)}>
        {({ id, describedBy, invalid }) => (
          <select
            id={id}
            value={str(ed.get(path))}
            onChange={(e) => ed.set(path, numeric ? Number(e.target.value) : e.target.value)}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={`focus-ring block h-12 w-full rounded-lg border bg-white px-3.5 text-base text-ink ${invalid ? 'border-red-600' : 'border-line'}`}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </FieldShell>
    </Wrap>
  );
}
