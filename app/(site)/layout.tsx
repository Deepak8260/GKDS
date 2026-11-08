import type { ReactNode } from 'react';
import { SiteShell } from '@/components/layout/site-shell';
import { JsonLd } from '@/components/seo/json-ld';
import { getReviewStats, getSite } from '@/lib/content';
import { parseCount } from '@/lib/format';
import { siteGraph } from '@/lib/json-ld';

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [site, stats] = await Promise.all([getSite(), getReviewStats()]);
  // ONE school entity for the whole site; pages refer to it by @id.
  const graph = siteGraph(site, { value: stats.rating, count: parseCount(stats.ratingCount, 1) });
  return (
    <>
      <JsonLd data={graph} />
      <SiteShell>{children}</SiteShell>
    </>
  );
}
