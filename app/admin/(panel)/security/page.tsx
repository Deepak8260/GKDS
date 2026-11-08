import type { Metadata } from 'next';
import { AdminPageHeader } from '@/components/admin/blocks';
import { SecurityForms } from '@/components/admin/security-forms';
import { getAdminConfig } from '@/lib/auth/admin-config';
import { getGithubConfig } from '@/lib/github';

export const metadata: Metadata = { title: 'Security' };

export default async function SecurityPage() {
  let lastChanged: string | null = null;
  try {
    const { config } = await getAdminConfig();
    lastChanged = config?.hash ? config.updatedAt : null;
  } catch {
    lastChanged = null;
  }
  return (
    <>
      <AdminPageHeader title="Security" description="Change the access code that protects this admin panel." />
      <SecurityForms lastChanged={lastChanged} githubConnected={getGithubConfig() !== null} />
    </>
  );
}
