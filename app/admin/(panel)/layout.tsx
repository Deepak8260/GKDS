import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';
import { getAdminBase, isAdmin } from '@/lib/auth/guard';
import { getPendingCount } from '@/lib/admin/stats';
import { getSite } from '@/lib/content';
import { mediaUrl } from '@/lib/media';

/** Everything except the login page. Defence in depth: the proxy already checked the cookie; this also checks the session version. */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const base = await getAdminBase();
  if (!(await isAdmin())) redirect(`${base}/login`);

  const [site, pending] = await Promise.all([getSite(), getPendingCount()]);
  return (
    <AdminShell pending={pending} logo={mediaUrl(site.logo)}>
      {children}
    </AdminShell>
  );
}
