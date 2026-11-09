'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { codeStrength } from '@/lib/auth/strength';
import { CODE_MAX, CODE_MIN } from '@/lib/auth/constants';
import { cn } from '@/lib/utils';
import { adminFetch } from './admin-client';
import { FormSection } from './blocks';
import { useConfirm } from './confirm';
import { TextField } from './fields';

const METER = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-600'];

export function SecurityForms({ lastChanged, githubConnected }: { lastChanged: string | null; githubConnected: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const confirm = useConfirm();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; again?: string }>({});
  const [busy, setBusy] = useState(false);
  const [outBusy, setOutBusy] = useState(false);
  const strength = codeStrength(next);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!current) nextErrors.current = 'Enter your current code.';
    if (next.length < CODE_MIN) nextErrors.next = `Use at least ${CODE_MIN} characters.`;
    else if (next.length > CODE_MAX) nextErrors.next = `Use at most ${CODE_MAX} characters.`;
    if (again !== next) nextErrors.again = 'The two new codes do not match.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    const res = await adminFetch('/api/admin/security/code', { body: { current, next } });
    setBusy(false);
    if (res.ok) {
      toast.success('Access code updated. Other devices were signed out.');
      setCurrent('');
      setNext('');
      setAgain('');
      router.refresh();
    } else if (res.data.message) {
      const field = (res.data as { field?: 'current' | 'next' }).field;
      if (field) setErrors({ [field]: res.data.message });
      else toast.error(res.data.message);
    }
  }

  async function signOutEverywhere() {
    const ok = await confirm({ title: 'Sign out everywhere?', message: 'Every other device will need the access code again. You stay signed in here.', confirmLabel: 'Sign out others' });
    if (!ok) return;
    setOutBusy(true);
    const res = await adminFetch('/api/admin/security/signout-all', { body: {} });
    setOutBusy(false);
    if (res.ok) toast.success(res.data.message || 'Signed out everywhere else.');
    else toast.error(res.data.message || 'Could not sign out other devices.');
  }

  return (
    <>
      <div className="mb-6 flex gap-3 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-900">
        <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>
          Using <strong>/malika</strong> or <strong>/admin</strong> makes no difference — the access code is what protects the panel.
        </p>
      </div>

      {!githubConnected ? (
        <div role="note" className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          GitHub is not connected, so a new code cannot be stored yet. The code from the <code>ADMIN_CODE</code> setting (or the default one from the documentation) is in use.
        </div>
      ) : null}

      <FormSection
        title="Change access code"
        description={lastChanged ? `Last changed: ${new Date(lastChanged).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Last changed: never (using the default from the environment)'}
      >
        <form onSubmit={onSubmit} noValidate className="max-w-md space-y-5">
          <TextField label="Current code" type="password" autoComplete="current-password" value={current} onChange={setCurrent} error={errors.current} />
          <div>
            <TextField
              label="New code"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={setNext}
              error={errors.next}
              maxLength={CODE_MAX}
              hint={`${CODE_MIN}–${CODE_MAX} characters, any characters allowed.`}
            />
            {next ? (
              <div className="mt-2" aria-live="polite">
                <div className="flex gap-1" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < strength.level ? METER[strength.level] : 'bg-line')} />
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted">
                  Strength: <strong>{strength.label}</strong>
                  {strength.warning ? <span className="text-orange-700"> — {strength.warning}</span> : null}
                </p>
              </div>
            ) : null}
          </div>
          <TextField label="Confirm new code" type="password" autoComplete="new-password" value={again} onChange={setAgain} error={errors.again} maxLength={CODE_MAX} />
          <Button type="submit" loading={busy} disabled={!githubConnected}>
            Update access code
          </Button>
        </form>
      </FormSection>

      <FormSection title="Sign out everywhere" description="Use this if you think someone else may have your code or you left a device signed in.">
        <Button variant="secondary" onClick={signOutEverywhere} loading={outBusy} disabled={!githubConnected}>
          Sign out all other devices
        </Button>
      </FormSection>
    </>
  );
}
