import type { Metadata } from 'next';
import { AdminPageHeader, EmptyState } from '@/components/admin/blocks';

export const metadata: Metadata = { title: 'About Page' };

export default function Page() {
  return (
    <>
      <AdminPageHeader title="About Page" />
      <EmptyState title="Coming soon" description="Edit the About page (built in the next prompt)." />
    </>
  );
}
