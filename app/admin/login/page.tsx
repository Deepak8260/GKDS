import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/login-form';
import { getAdminBase, isAdmin } from '@/lib/auth/guard';
import { safeNextPath } from '@/lib/auth/constants';
import { getSite } from '@/lib/content';
import { mediaUrl } from '@/lib/media';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [base, { next }, site] = await Promise.all([getAdminBase(), searchParams, getSite()]);
  const target = safeNextPath(next, base);
  if (await isAdmin()) redirect(target);
  return <LoginForm logo={mediaUrl(site.logo)} next={target} />;
}
