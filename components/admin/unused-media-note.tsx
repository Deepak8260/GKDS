'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatBytes } from '@/lib/image-client';
import { useAdminBase } from './admin-client';
import { listMedia } from './media-client';

/** Dashboard hint: pictures nobody uses any more (loaded after the page, because it asks GitHub). */
export function UnusedMediaNote() {
  const base = useAdminBase();
  const [unused, setUnused] = useState<{ count: number; bytes: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMedia()
      .then((list) => {
        if (cancelled) return;
        const free = list.files.filter((f) => f.usedIn.length === 0);
        setUnused(free.length ? { count: free.length, bytes: free.reduce((s, f) => s + f.size, 0) } : null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!unused) return null;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <p className="text-sm text-ink">
        {unused.count} picture{unused.count === 1 ? ' is' : 's are'} not used anywhere ({formatBytes(unused.bytes)}).
      </p>
      <Link href={`${base}/media`} className="focus-ring inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-green-800 underline underline-offset-2">
        Open the Media Library
      </Link>
    </li>
  );
}
