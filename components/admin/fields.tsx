'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Shared wrapper: label, optional hint, control, error. Every field below uses it. */
interface FieldShellProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  /** Extra text at the right of the label row (e.g. a character counter). */
  aside?: ReactNode;
  className?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

export function FieldShell({ label, hint, error, required, aside, className, children }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint ? hintId : '', error ? errId : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
          {required ? <span className="text-orange-600" aria-hidden="true"> *</span> : null}
        </label>
        {aside ? <span className="text-xs text-muted">{aside}</span> : null}
      </div>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} role="alert" className="mt-1.5 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const control = (invalid: boolean) =>
  cn(
    'focus-ring block w-full rounded-lg border bg-white px-3.5 text-base text-ink placeholder:text-muted/70 disabled:bg-green-50/50 disabled:text-muted',
    invalid ? 'border-red-600' : 'border-line',
  );

interface BaseFieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function TextField({
  label, hint, error, required, disabled, className, value, onChange, maxLength, placeholder, type = 'text', inputMode, autoComplete,
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'password';
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
  autoComplete?: string;
}) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          inputMode={inputMode}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(control(invalid), 'h-12')}
        />
      )}
    </FieldShell>
  );
}

/** Textarea with a live character counter. */
export function TextArea({
  label, hint, error, required, disabled, className, value, onChange, maxLength, rows = 4, placeholder,
}: BaseFieldProps & { value: string; onChange: (value: string) => void; maxLength?: number; rows?: number; placeholder?: string }) {
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
      aside={maxLength ? `${value.length}/${maxLength}` : undefined}
    >
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(control(invalid), 'resize-y py-3')}
        />
      )}
    </FieldShell>
  );
}

export function NumberField({
  label, hint, error, required, disabled, className, value, onChange, min, max, step = 1,
}: BaseFieldProps & { value: number | undefined; onChange: (value: number | undefined) => void; min?: number; max?: number; step?: number }) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value ?? ''}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(control(invalid), 'h-12')}
        />
      )}
    </FieldShell>
  );
}

export function SelectField({
  label, hint, error, required, disabled, className, value, onChange, options,
}: BaseFieldProps & { value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(control(invalid), 'h-12')}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

/** A URL field: accepts https://, http://, tel:, mailto: or an on-site path starting with "/". */
export function UrlField(props: Omit<Parameters<typeof TextField>[0], 'type' | 'inputMode'>) {
  return <TextField {...props} type="text" inputMode="text" autoComplete="url" placeholder={props.placeholder ?? 'https://…'} />;
}

/** On/off switch with a visible label (role="switch"). */
export function Toggle({
  label, hint, checked, onChange, disabled, className,
}: { label: string; hint?: ReactNode; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; className?: string }) {
  const id = useId();
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'focus-ring relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50',
          checked ? 'bg-green-700' : 'bg-muted/40',
        )}
      >
        <span aria-hidden="true" className={cn('absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
      </button>
    </div>
  );
}
