import type { Metadata } from 'next';
import Link from 'next/link';
import { ADMIN_NAV } from '@/components/admin/nav';
import { AdminPageHeader } from '@/components/admin/blocks';
import { HealthCard } from '@/components/admin/health-card';
import { getAdminBase } from '@/lib/auth/guard';
import { getAdminCounts } from '@/lib/admin/stats';
import { formatRelative } from '@/lib/date';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const [base, counts] = await Promise.all([getAdminBase(), getAdminCounts()]);

  const cards = [
    { label: 'Courses', value: counts.courses, note: `${counts.coursesPublished} published`, href: '/courses' },
    { label: 'Gallery photos', value: counts.photos, note: `${counts.photosPublished} published`, href: '/gallery' },
    { label: 'Published reviews', value: counts.reviewsPublished, note: 'visible on the website', href: '/reviews' },
    { label: 'Average rating', value: counts.rating !== null ? counts.rating.toFixed(1) : '–', note: counts.reviewsHidden ? `${counts.reviewsHidden} hidden review${counts.reviewsHidden === 1 ? '' : 's'}` : 'from published reviews', href: '/reviews', highlight: false },
  ];

  return (
    <>
      <AdminPageHeader title="Dashboard" description="A quick look at your website and its connection to GitHub." />

      <ul className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <li key={c.label}>
            <Link
              href={`${base}${c.href}`}
              className={`focus-ring block rounded-2xl border bg-white p-5 shadow-card transition-shadow hover:shadow-card-lg ${c.highlight ? 'border-orange-300' : 'border-line'}`}
            >
              <p className="text-sm font-medium text-muted">{c.label}</p>
              <p className={`mt-1 font-display text-4xl font-bold ${c.highlight ? 'text-orange-600' : 'text-green-900'}`}>{c.value}</p>
              <p className="mt-1 text-xs text-muted">{c.note}</p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mb-6 text-sm text-muted">
        Last content update:{' '}
        <strong className="text-ink">
          {counts.lastUpdate ? `${formatRelative(counts.lastUpdate)} (${new Date(counts.lastUpdate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })})` : 'not available (GitHub not connected)'}
        </strong>
      </p>

      <HealthCard />

      <section aria-labelledby="quick-links">
        <h2 id="quick-links" className="mb-3 font-body text-lg font-bold text-green-900">
          Quick links
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_NAV.filter((n) => n.path !== '').map((n) => {
            const Icon = n.icon;
            return (
              <li key={n.path}>
                <Link href={`${base}${n.path}`} className="focus-ring flex min-h-14 items-center gap-3 rounded-xl border border-line bg-white px-4 hover:bg-green-50">
                  <Icon className="size-5 text-orange-600" aria-hidden="true" />
                  <span className="font-medium text-ink">{n.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
