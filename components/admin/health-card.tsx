'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminFetch } from './admin-client';
import { AdminSkeleton, FormSection } from './blocks';

interface CheckItem {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

/** GitHub connection check with a "Re-check" button. */
export function HealthCard() {
  const [checks, setChecks] = useState<CheckItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = useCallback(() => {
    adminFetch<{ checks: CheckItem[] }>('/api/admin/health').then((res) => {
      if (res.ok) {
        setChecks((res.data as { checks: CheckItem[] }).checks);
        setFailed(false);
      } else {
        setFailed(true);
      }
      setBusy(false);
    });
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <FormSection title="GitHub connection" description="The website's content and photos live in your private GitHub repository.">
      {checks === null && !failed ? (
        <div role="status">
          <span className="sr-only">Checking GitHub…</span>
          <AdminSkeleton className="h-24 w-full" />
        </div>
      ) : failed ? (
        <p role="alert" className="text-sm text-red-700">Could not run the check. Please try again.</p>
      ) : (
        <ul className="divide-y divide-line">
          {checks?.map((c) => (
            <li key={c.id} className="flex items-start gap-3 py-3">
              <span className={c.ok ? 'mt-0.5 flex size-6 items-center justify-center rounded-full bg-green-100 text-green-700' : 'mt-0.5 flex size-6 items-center justify-center rounded-full bg-red-100 text-red-700'}>
                {c.ok ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
                <span className="sr-only">{c.ok ? 'OK' : 'Problem'}</span>
              </span>
              <div className="min-w-0">
                <p className="font-medium text-ink">{c.label}</p>
                <p className="text-sm text-muted">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button
        variant="secondary"
        size="sm"
        loading={busy}
        onClick={() => {
          setBusy(true);
          run();
        }}
      >
        Re-check
      </Button>
    </FormSection>
  );
}
