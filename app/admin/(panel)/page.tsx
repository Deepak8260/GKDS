import type { Metadata } from 'next';
import Link from 'next/link';
import { CircleAlert, CircleCheck, ExternalLink, Info } from 'lucide-react';
import { AdminPageHeader, FormSection } from '@/components/admin/blocks';
import { BackupCard } from '@/components/admin/backup-card';
import { HealthCard } from '@/components/admin/health-card';
import { RefreshCacheButton } from '@/components/admin/refresh-cache-button';
import { UnusedMediaNote } from '@/components/admin/unused-media-note';
import { Button } from '@/components/ui/button';
import { computeAttention, computeChecklist, progress } from '@/lib/admin/readiness';
import { getAdminCounts, getRecentChanges } from '@/lib/admin/stats';
import { getAdminConfig } from '@/lib/auth/admin-config';
import { getAdminBase } from '@/lib/auth/guard';
import { getCourses, getGallery, getReviews, getSite } from '@/lib/content';
import { formatRelative } from '@/lib/date';
import { getGithubConfig } from '@/lib/github';

export const metadata: Metadata = { title: 'Dashboard' };

function Ring({ percent }: { percent: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 72 72" className="size-[72px] shrink-0" aria-hidden="true">
      <circle cx="36" cy="36" r={r} fill="none" strokeWidth="8" className="stroke-green-100" />
      <circle cx="36" cy="36" r={r} fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} transform="rotate(-90 36 36)" className="stroke-green-700" />
      <text x="36" y="41" textAnchor="middle" className="fill-green-900 text-[15px] font-bold">
        {percent}%
      </text>
    </svg>
  );
}

export default async function DashboardPage() {
  const [base, counts, site, courses, gallery, reviews, recent] = await Promise.all([
    getAdminBase(),
    getAdminCounts(),
    getSite(),
    getCourses(),
    getGallery(),
    getReviews(),
    getRecentChanges(10),
  ]);

  let hasStoredCode = false;
  try {
    const { config } = await getAdminConfig();
    hasStoredCode = Boolean(config?.hash);
  } catch {
    hasStoredCode = true; // the stored config could not be read: do not claim the default code is in use
  }
  const envCode = process.env.ADMIN_CODE?.trim();
  const input = {
    site,
    courses,
    gallery,
    reviews,
    hasStoredCode,
    envCodeIsDefault: !envCode || envCode === 'gkds1993',
    siteUrlSet: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    githubConnected: Boolean(getGithubConfig()),
  };
  const attention = computeAttention(input);
  const checklist = computeChecklist(input);
  const done = progress(checklist);
  const missingAlt = gallery.items.filter((p) => !p.alt.trim()).length;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

  const cards = [
    { label: 'Courses', value: counts.courses, note: `${counts.coursesPublished} published`, href: '/courses' },
    { label: 'Gallery photos', value: counts.photos, note: `${counts.photosPublished} published${missingAlt ? ` · ${missingAlt} missing alt text` : ''}`, href: '/gallery' },
    { label: 'Published reviews', value: counts.reviewsPublished, note: counts.reviewsHidden ? `${counts.reviewsHidden} hidden` : 'visible on the website', href: '/reviews' },
    { label: 'Average rating', value: counts.rating !== null ? counts.rating.toFixed(1) : '–', note: 'from published reviews', href: '/reviews' },
  ];

  const quick = [
    { label: 'Add a photo', href: '/gallery' },
    { label: 'Add a course', href: '/courses' },
    { label: 'Edit phone numbers', href: '/settings' },
    { label: 'Manage reviews', href: '/reviews' },
  ];

  return (
    <>
      <AdminPageHeader
        title="Welcome back"
        description={`${today} (India time)`}
        actions={
          <>
            <RefreshCacheButton />
            <Button href="/" target="_blank" rel="noopener noreferrer" variant="secondary" size="sm" iconRight={<ExternalLink className="size-4" aria-hidden="true" />}>
              View website
            </Button>
          </>
        }
      />

      <ul className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <li key={c.label}>
            <Link href={`${base}${c.href}`} className="focus-ring block rounded-2xl border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-lg">
              <p className="text-sm font-medium text-muted">{c.label}</p>
              <p className="mt-1 font-display text-4xl font-bold text-green-900">{c.value}</p>
              <p className="mt-1 text-xs text-muted">{c.note}</p>
            </Link>
          </li>
        ))}
      </ul>

      <FormSection title="Needs attention" description="Things worth fixing before or soon after launch. This list only shows real problems.">
        <ul className="-my-2 divide-y divide-line" aria-label="Things that need attention">
          {attention.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <p className="flex items-start gap-2 text-sm text-ink">
                {a.severity === 'warning' ? <CircleAlert className="mt-0.5 size-4 shrink-0 text-orange-600" aria-hidden="true" /> : <Info className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />}
                <span>
                  <span className="sr-only">{a.severity === 'warning' ? 'Warning: ' : 'Note: '}</span>
                  {a.message}
                </span>
              </p>
              <Link href={`${base}${a.href}`} className={a.id === 'default-code' ? 'focus-ring inline-flex min-h-11 items-center rounded-full bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700' : 'focus-ring inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-green-800 underline underline-offset-2'}>
                {a.action}
              </Link>
            </li>
          ))}
          <UnusedMediaNote />
        </ul>
        {attention.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-green-800">
            <CircleCheck className="size-5" aria-hidden="true" /> Nothing needs your attention right now.
          </p>
        ) : null}
      </FormSection>

      <FormSection title="Is your site ready to launch?" description="A short checklist worked out from your real content.">
        <div className="flex items-center gap-4">
          <Ring percent={done.percent} />
          <p className="text-sm text-ink">
            <strong>
              {done.done} of {done.total}
            </strong>{' '}
            done
          </p>
        </div>
        <ul className="divide-y divide-line">
          {checklist.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
              <p className="flex items-center gap-2.5 text-sm text-ink">
                {c.done ? <CircleCheck className="size-5 shrink-0 text-green-700" aria-hidden="true" /> : <CircleAlert className="size-5 shrink-0 text-orange-600" aria-hidden="true" />}
                <span>
                  <span className="sr-only">{c.done ? 'Done: ' : 'Not done: '}</span>
                  {c.label}
                </span>
              </p>
              {!c.done ? (
                <Link href={`${base}${c.href}`} className="focus-ring inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-green-800 underline underline-offset-2">
                  {c.todo}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </FormSection>

      <FormSection title="Quick actions">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quick.map((q) => (
            <li key={q.label}>
              <Link href={`${base}${q.href}`} className="focus-ring flex min-h-14 items-center justify-center rounded-xl border border-line bg-white px-4 text-center font-medium text-ink hover:bg-green-50">
                {q.label}
              </Link>
            </li>
          ))}
        </ul>
      </FormSection>

      <FormSection title="Recent changes" description="The latest changes saved to your website content.">
        {recent.length === 0 ? (
          <p className="text-sm text-muted">{getGithubConfig() ? 'No changes yet.' : 'Not available: GitHub is not connected.'}</p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((c) => (
              <li key={c.sha} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="text-ink">{c.message}</span>
                <span className="text-muted">
                  {c.date ? formatRelative(c.date) : ''}{' '}
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="focus-ring rounded font-semibold text-green-800 underline underline-offset-2">
                    View<span className="sr-only"> on GitHub (opens in a new tab)</span>
                  </a>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted">
          Last content update:{' '}
          <strong className="text-ink">{counts.lastUpdate ? `${formatRelative(counts.lastUpdate)} (${new Date(counts.lastUpdate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })})` : 'not available (GitHub not connected)'}</strong>
        </p>
      </FormSection>

      <HealthCard />
      <BackupCard />
    </>
  );
}
