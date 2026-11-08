import type { Metadata } from 'next';
import { AdminPageHeader, EmptyState } from '@/components/admin/blocks';

export const metadata: Metadata = { title: 'Help' };

export default function Page() {
  return (
    <>
      <AdminPageHeader title="Help" />
      <EmptyState title="Coming soon" description="Guides and recovery steps (built in a later prompt)." />
    </>
  );
}
