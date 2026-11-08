import type { Metadata } from 'next';
import { AdminPageHeader, EmptyState } from '@/components/admin/blocks';

export const metadata: Metadata = { title: 'Home Page' };

export default function Page() {
  return (
    <>
      <AdminPageHeader title="Home Page" />
      <EmptyState title="Coming soon" description="Edit the Home page sections (built in the next prompt)." />
    </>
  );
}
