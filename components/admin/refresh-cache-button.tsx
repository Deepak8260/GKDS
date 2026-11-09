'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { adminFetch } from './admin-client';

/** "Refresh website cache": the public pages re-read the content from GitHub right away. */
export function RefreshCacheButton({ variant = 'secondary' }: { variant?: 'primary' | 'secondary' }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    const res = await adminFetch('/api/admin/revalidate', { method: 'POST', body: {} });
    setBusy(false);
    if (res.ok) toast.success('Website cache refreshed. The site shows the latest content now.');
    else toast.error(res.data.message || 'Could not refresh the cache. Please try again.');
  }

  return (
    <Button variant={variant} size="sm" loading={busy} onClick={() => void refresh()} icon={<RefreshCw className="size-4" aria-hidden="true" />}>
      Refresh website cache
    </Button>
  );
}
