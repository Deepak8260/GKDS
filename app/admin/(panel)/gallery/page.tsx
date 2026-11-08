import type { Metadata } from 'next';
import { AdminPageHeader, EmptyState } from '@/components/admin/blocks';

export const metadata: Metadata = { title: 'Gallery' };

export default function Page() {
  return (
    <>
      <AdminPageHeader title="Gallery" />
      <EmptyState title="Coming soon" description="Manage gallery photos and categories (built in a later prompt)." />
    </>
  );
}
