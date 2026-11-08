import type { Metadata } from 'next';
import { AdminPageHeader, EmptyState } from '@/components/admin/blocks';

export const metadata: Metadata = { title: 'Courses' };

export default function Page() {
  return (
    <>
      <AdminPageHeader title="Courses" />
      <EmptyState title="Coming soon" description="Add, edit and reorder courses (built in a later prompt)." />
    </>
  );
}
