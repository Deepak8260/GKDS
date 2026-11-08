import type { Metadata } from 'next';
import { AdminPageHeader, EmptyState } from '@/components/admin/blocks';

export const metadata: Metadata = { title: 'Site Settings' };

export default function Page() {
  return (
    <>
      <AdminPageHeader title="Site Settings" />
      <EmptyState title="Coming soon" description="Contact details, hours, social links and SEO (built in the next prompt)." />
    </>
  );
}
