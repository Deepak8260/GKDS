'use client';

import dynamic from 'next/dynamic';
import { SafeImage as Image } from '@/components/ui/safe-image';
import { useCallback, useMemo, useState } from 'react';
import { Camera, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { mediaUrl } from '@/lib/media';
import { useQueryParam } from '@/lib/hooks/use-query-param';
import type { Dict } from '@/lib/i18n/dict';
import { fmt } from '@/lib/i18n/locales';
import type { GalleryCategory, GalleryItem } from '@/lib/validators';
import { FilterPills, type FilterPill } from './filter-pills';
import { ALL, PAGE_SIZE, countLabel, filterByCategory, resolveCategory } from './gallery-utils';

// loaded on the first click only
const Lightbox = dynamic(() => import('./lightbox'), { ssr: false });

interface GalleryClientProps {
  titleLead: string;
  titleHighlight?: string;
  categories: GalleryCategory[];
  /** Published photos, already sorted by `order`. */
  items: GalleryItem[];
  /** Wording in the page language. */
  t: Dict['gallery'];
}

/** Heading + category filter + photo grid + Load more + lightbox. Filter state lives in `?category=`. */
export function GalleryClient({ titleLead, titleHighlight, categories, items, t }: GalleryClientProps) {
  const [param, setParam] = useQueryParam('category');
  const category = resolveCategory(param, categories);
  const filtered = useMemo(() => filterByCategory(items, category), [items, category]);

  const [limits, setLimits] = useState<Record<string, number>>({});
  const limit = limits[category] ?? PAGE_SIZE;
  const visible = filtered.slice(0, limit);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeLightbox = useCallback(() => setOpenIndex(null), [setOpenIndex]);

  const pills: FilterPill[] = [{ id: ALL, label: t.allPhotos, icon: 'layout-grid' }, ...categories];

  function select(id: string) {
    setParam(id === ALL ? null : id);
    setOpenIndex(null);
  }

  return (
    <>
      <div className="flex flex-col items-center gap-6 text-center">
        <SectionHeading lead={titleLead} highlight={titleHighlight} dash="above" align="center" size="lg" />
        <FilterPills pills={pills} active={category} onChange={select} groupLabel={t.filterLabel} />
      </div>

      {filtered.length > 0 ? (
        <ul
          // re-keyed on filter change so the tiles fade in again
          key={category}
          className="mt-8 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4"
        >
          {visible.map((item, i) => (
            <li key={item.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={fmt(t.openPhoto, { alt: item.alt })}
                className="group focus-ring relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-line bg-green-50 shadow-card"
              >
                <Image
                  src={mediaUrl(item.src)}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 300px, (min-width: 1024px) 380px, (min-width: 480px) 50vw, 100vw"
                  loading={i < 6 ? 'eager' : 'lazy'}
                  className="object-cover transition-transform duration-300 group-hover:scale-105 group-focus-visible:scale-105"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 hidden bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:hover)]:block"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 hidden p-4 text-left text-sm font-medium leading-snug text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:hover)]:block"
                >
                  <span className="line-clamp-2">{item.alt}</span>
                </span>
                <span
                  aria-hidden="true"
                  className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <Maximize2 className="size-4" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Card tone="green-soft" className="mt-8 flex flex-col items-center gap-4 px-6 py-14 text-center">
          <Camera className="size-10 text-orange-500" strokeWidth={1.5} aria-hidden="true" />
          <p className="font-display text-2xl font-bold italic text-green-900">{t.emptyCategory}</p>
          <Button variant="secondary" onClick={() => select(ALL)}>
            {t.viewAll}
          </Button>
        </Card>
      )}

      <div className="mt-6 flex flex-col items-center gap-4">
        <p role="status" aria-live="polite" className="text-sm text-muted">
          {countLabel(visible.length, filtered.length, { none: t.countNone, one: t.countOne, all: t.countAll, part: t.countPart })}
        </p>
        {visible.length < filtered.length ? (
          <Button
            variant="secondary"
            onClick={() => setLimits((l) => ({ ...l, [category]: limit + PAGE_SIZE }))}
          >
            {t.loadMore}
          </Button>
        ) : null}
      </div>

      {openIndex !== null ? (
        <Lightbox items={filtered} index={openIndex} onIndexChange={setOpenIndex} onClose={closeLightbox} t={t} />
      ) : null}
    </>
  );
}
