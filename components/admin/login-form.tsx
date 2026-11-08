'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminFetch } from './admin-client';

export function LoginForm({ logo, next }: { logo: string; next: string }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // false until the page is interactive: a click before that would submit the form natively
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !code) return;
    setBusy(true);
    setError('');
    const res = await adminFetch('/api/admin/login', { body: { code } });
    if (res.ok) {
      router.replace(next);
      router.refresh();
      return;
    }
    setError(res.data.message || 'Incorrect code. Please try again.');
    setCode('');
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-7 shadow-card-lg sm:p-9">
        <div className="flex flex-col items-center text-center">
          <Image src={logo} alt="" width={96} height={96} priority className="size-16 object-contain" />
          <p className="mt-3 font-display text-xl font-bold italic text-green-900">Gopal Krushna Driving Training School</p>
          <h1 className="mt-1 text-sm font-semibold uppercase tracking-wider text-orange-600">Admin Panel</h1>
        </div>

        <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
          <div>
            <label htmlFor="access-code" className="mb-1.5 block text-sm font-medium text-ink">
              Enter access code
            </label>
            <div className="relative">
              <input
                id="access-code"
                // no `name`: even a native (pre-hydration) submit can never put the code in the URL
                type={show ? 'text' : 'password'}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                autoComplete="current-password"
                maxLength={200}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-error' : undefined}
                className="focus-ring h-12 w-full rounded-lg border border-line bg-white px-3.5 pr-12 text-base"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide access code' : 'Show access code'}
                aria-pressed={show}
                className="focus-ring absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2.5 text-muted hover:text-ink"
              >
                {show ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <p id="login-error" role="alert" className={error ? 'text-sm font-medium text-red-700' : 'sr-only'}>
            {error}
          </p>

          <Button type="submit" loading={busy} disabled={!ready} className="w-full">
            Unlock
          </Button>
        </form>
      </div>
    </main>
  );
}
