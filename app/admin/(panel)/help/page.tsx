import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminPageHeader, FormSection } from '@/components/admin/blocks';
import { BackupCard } from '@/components/admin/backup-card';
import { RefreshCacheButton } from '@/components/admin/refresh-cache-button';
import { lastRevalidated } from '@/lib/admin/revalidate-state';
import { getAdminBase } from '@/lib/auth/guard';
import { getGithubConfig } from '@/lib/github';
import pkg from '@/package.json';

export const metadata: Metadata = { title: 'Help' };
export const dynamic = 'force-dynamic';

interface Guide {
  id: string;
  title: string;
  steps: string[];
  href: string;
  link: string;
}

const GUIDES: Guide[] = [
  {
    id: 'contact',
    title: 'Change phone numbers, address or timings',
    steps: ['Open Site Settings.', 'Edit the Contact, Address or Working hours section.', 'Press Save changes at the bottom.'],
    href: '/settings',
    link: 'Take me to Site Settings',
  },
  {
    id: 'photos',
    title: 'Add or hide a photo in the gallery',
    steps: ['Open Gallery.', 'Choose a category, then “Choose photos” (several at once is fine).', 'Describe each new photo in a few words (alt text).', 'Use the switch under a photo to hide or show it, then press Save changes.'],
    href: '/gallery',
    link: 'Take me to the Gallery',
  },
  {
    id: 'reviews',
    title: 'Manage reviews and feature one on the Home page',
    steps: [
      'Reviews from visitors appear on the website straight away. There is nothing to approve.',
      'Open Reviews to fix a typo, hide a review or delete one.',
      'Press the star on up to 3 reviews to feature them on the Home page.',
      'Got a review on WhatsApp? Use Add review. Press Save changes when you are done.',
    ],
    href: '/reviews',
    link: 'Take me to Reviews',
  },
  {
    id: 'courses',
    title: 'Add or edit a course',
    steps: ['Open Courses and press Add course (or Edit on an existing one).', 'Fill in the title, a short description, the vehicle, a picture and the tick-point features.', 'Turn on Published, press Done, then Save changes.'],
    href: '/courses',
    link: 'Take me to Courses',
  },
  {
    id: 'images',
    title: 'Replace the logo or a page picture',
    steps: ['Open the page that shows the picture (for the logo: Site Settings).', 'Under the picture press Upload new, or Choose from library.', 'Large photos are made smaller automatically. Press Save changes.'],
    href: '/settings',
    link: 'Take me to Site Settings',
  },
  {
    id: 'code',
    title: 'Change the admin access code (and what to do if you forget it)',
    steps: [
      'Open Security, type the current code, then the new one twice.',
      'Other devices are signed out automatically.',
      'Forgot it? In your Vercel project open Settings → Environment Variables, set ADMIN_CODE_RESET to 1 and redeploy.',
      'Log in with the ADMIN_CODE value, choose a new code on the Security page, then remove ADMIN_CODE_RESET and redeploy again.',
    ],
    href: '/security',
    link: 'Take me to Security',
  },
  {
    id: 'history',
    title: 'Go back to an older version, or download a backup',
    steps: [
      'On any page editor press History to see the last 20 changes.',
      'Pick one to see exactly what would change, then Restore this version. It loads as a draft, and Save changes keeps it as a new version.',
      'To keep a copy of everything, use Download backup below or on the Dashboard.',
    ],
    href: '/',
    link: 'Take me to the Dashboard',
  },
  {
    id: 'live',
    title: 'Why changes appear within seconds, and what to do if they do not',
    steps: [
      'Every save is stored in your GitHub repository and the website refreshes by itself within a few seconds.',
      'If a page still looks old, press Refresh website cache below, then reload the page.',
      'Also check the GitHub connection on the Dashboard: all rows should be green.',
    ],
    href: '/',
    link: 'Check the GitHub connection',
  },
  {
    id: 'launch',
    title: 'Set the website address (before launch)',
    steps: [
      'In Vercel open Settings → Environment Variables.',
      'Set NEXT_PUBLIC_SITE_URL to your real website address, for example https://www.yourschool.in (no slash at the end).',
      'Redeploy. Search engines and WhatsApp share cards then use the right address.',
    ],
    href: '/',
    link: 'See the launch checklist',
  },
  {
    id: 'prefix',
    title: '/admin or /malika: which one?',
    steps: ['Both open exactly the same panel. Use whichever you remember.', 'What protects the panel is the access code, not the address.'],
    href: '/security',
    link: 'Take me to Security',
  },
];

function formatTime(iso: string | null): string {
  if (!iso) return 'not since this server started';
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
}

export default async function HelpPage() {
  const base = await getAdminBase();
  const github = getGithubConfig();

  return (
    <>
      <AdminPageHeader title="Help" description="Short, step-by-step guides for the things you do most. Every guide has a button that takes you straight there." actions={<RefreshCacheButton variant="primary" />} />

      <ul className="mb-6 grid gap-4 lg:grid-cols-2">
        {GUIDES.map((g) => (
          <li key={g.id} className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <h2 className="font-body text-lg font-bold text-green-900">{g.title}</h2>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink">
              {g.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <Link href={`${base}${g.href}`} className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-full border-[1.5px] border-orange-500 px-4 text-sm font-semibold text-orange-600 hover:bg-orange-50">
              {g.link}
            </Link>
          </li>
        ))}
      </ul>

      <BackupCard />

      <FormSection title="System information" description="Useful when you ask for help.">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">App version</dt>
            <dd className="font-semibold text-ink">{pkg.version}</dd>
          </div>
          <div>
            <dt className="text-muted">Content repository</dt>
            <dd className="font-semibold text-ink">{github ? `${github.owner}/${github.repo}` : 'not connected'}</dd>
          </div>
          <div>
            <dt className="text-muted">Content branch</dt>
            <dd className="font-semibold text-ink">{github ? github.branch : '–'}</dd>
          </div>
          <div>
            <dt className="text-muted">Website cache last refreshed from here</dt>
            <dd className="font-semibold text-ink">{formatTime(lastRevalidated())}</dd>
          </div>
        </dl>
      </FormSection>
    </>
  );
}
