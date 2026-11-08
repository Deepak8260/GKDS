import type { Metadata } from 'next';
import { AdminPageHeader, EmptyState } from '@/components/admin/blocks';

export const metadata: Metadata = { title: 'Media Library' };

export default function Page() {
  return (
    <>
      <AdminPageHeader title="Media Library" />
      <EmptyState title="Coming soon" description="Upload and organise images (built in a later prompt)." />
    </>
  );
}
