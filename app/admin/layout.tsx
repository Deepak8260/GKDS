import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast';

// Nothing in the admin area is cached, indexed or statically generated.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | Admin' },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Admin area, reachable at /admin and (as an alias, via a rewrite in next.config.ts) /malika.
 * The access code protects it, not the URL.
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
