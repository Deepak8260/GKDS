import type { Metadata } from 'next';
import { AdminPageHeader, EmptyState } from '@/components/admin/blocks';

export const metadata: Metadata = { title: 'Reviews' };

export default function Page() {
  return (
    <>
      <AdminPageHeader title="Reviews" />
      <EmptyState title="Coming soon" description="Approve or reject visitor reviews (built in a later prompt)." />
    </>
  );
}
