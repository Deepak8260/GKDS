'use client';

import { useEffect, useState } from 'react';
import { Pencil, Phone, Plus, Star, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Stars } from '@/components/ui/stars';
import { useToast } from '@/components/ui/toast';
import {
  MAX_FEATURED,
  NO_REVIEW_FILTERS,
  RATING_OPTIONS,
  canFeature,
  featuredCount,
  filterReviews,
  newReview,
  sortReviews,
  type ReviewFilters,
  type ReviewSort,
} from '@/lib/admin/reviews';
import { computeReviewStats } from '@/lib/content/stats';
import { formatRelative } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Review } from '@/lib/validators';
import { adminFetch } from '../admin-client';
import { Tabs } from '../blocks';
import { useConfirm } from '../confirm';
import { Drawer } from '../drawer';
import { Toggle } from '../fields';
import { Area, Choice, ContentEditor, Day, Img, Section, Switch, Text, useEditor } from '../editor';

interface Editing {
  id: string;
  /** The review as it was when the drawer opened (restored by Cancel). Null for a review just added (Cancel removes it). */
  snapshot: Review | null;
}

type Contacts = Record<string, { phone: string }>;

function useReviewList() {
  const ed = useEditor();
  const items = (ed.get('items') as Review[] | undefined) ?? [];
  const setItems = (next: Review[]) => ed.set('items', next);
  const patch = (id: string, change: Partial<Review>) => setItems(items.map((r) => (r.id === id ? { ...r, ...change } : r)));
  return { ed, items, setItems, patch };
}

const absoluteDate = (iso: string) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? '' : new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

/* ------------------------------------------------------------------ */
/* Tab 1: the reviews                                                   */
/* ------------------------------------------------------------------ */

function ReviewCard({ review, contact, onEdit }: { review: Review; contact?: { phone: string }; onEdit: () => void }) {
  const { ed, items, setItems, patch } = useReviewList();
  const toast = useToast();
  const confirm = useConfirm();
  const index = items.findIndex((r) => r.id === review.id);
  const hasError = Object.keys(ed.errors).some((k) => k.startsWith(`items.${index}.`));
  const label = review.name || 'Unnamed review';

  function toggleFeatured() {
    if (!review.featured) {
      const check = canFeature(items, review.id);
      if (!check.ok) return toast.error(check.message);
    }
    patch(review.id, { featured: !review.featured });
  }

  function togglePublished() {
    // a featured review that comes back needs a free Home page slot
    if (!review.published && review.featured) {
      const check = canFeature(items, review.id);
      if (!check.ok) return toast.error(`${check.message} (This review is featured, so it needs a free slot to be shown again.)`);
    }
    patch(review.id, { published: !review.published });
  }

  async function remove() {
    const ok = await confirm({
      title: 'Delete this review?',
      message: 'It is removed from the website when you press Save changes. Its photo, if any, stays in the Media Library.',
      confirmLabel: 'Delete review',
      danger: true,
    });
    if (ok) setItems(items.filter((r) => r.id !== review.id));
  }

  return (
    <li className={cn('rounded-2xl border bg-white p-4 shadow-card', hasError ? 'border-red-300' : 'border-line', !review.published && 'border-dashed')}>
      <div className="flex gap-3">
        <Avatar name={label} src={review.avatar} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="truncate text-base font-bold text-ink">{label}</h3>
            <Stars value={review.rating} size={16} />
            {review.featured ? <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">Featured</span> : null}
            {!review.published ? <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">Hidden</span> : null}
            {hasError ? <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">Needs attention</span> : null}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {absoluteDate(review.date)} · {formatRelative(review.date)}
          </p>
          {/* the text is untrusted visitor input: rendered as plain text only */}
          <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-ink">{review.text || 'No text yet'}</p>
          {contact ? (
            <a href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`} className="focus-ring mt-2 inline-flex min-h-11 items-center gap-1.5 rounded text-sm font-semibold text-green-800 underline underline-offset-2">
              <Phone className="size-4" aria-hidden="true" /> {contact.phone} <span className="font-normal text-muted">(private, only you see this)</span>
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-ink">
          <button
            type="button"
            role="switch"
            aria-checked={review.published}
            aria-label={`Published: ${label}`}
            onClick={togglePublished}
            className={cn('focus-ring relative h-7 w-12 shrink-0 rounded-full transition-colors', review.published ? 'bg-green-700' : 'bg-muted/40')}
          >
            <span aria-hidden="true" className={cn('absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform', review.published && 'translate-x-5')} />
          </button>
          Published
        </label>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={toggleFeatured}
            aria-pressed={review.featured}
            aria-label={`Feature on Home page: ${label}`}
            title={review.featured ? 'Featured on the Home page' : 'Feature on the Home page'}
            className={cn('focus-ring rounded-lg p-2.5 hover:bg-orange-50', review.featured ? 'text-orange-600' : 'text-muted')}
          >
            <Star className={cn('size-5', review.featured && 'fill-orange-500')} aria-hidden="true" />
          </button>
          <Button variant="secondary" size="sm" onClick={onEdit} icon={<Pencil className="size-4" aria-hidden="true" />} aria-label={`Edit ${label}`}>
            Edit
          </Button>
          <button type="button" onClick={() => void remove()} aria-label={`Delete ${label}`} className="focus-ring rounded-lg p-2.5 text-red-600 hover:bg-red-50">
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

function ReviewsTab({ onEdit }: { onEdit: (id: string) => void }) {
  const { ed, items } = useReviewList();
  const [filters, setFilters] = useState<ReviewFilters>(NO_REVIEW_FILTERS);
  const [sort, setSort] = useState<ReviewSort>('newest');
  const [contacts, setContacts] = useState<Contacts>({});

  useEffect(() => {
    let cancelled = false;
    adminFetch<{ contacts: Contacts }>('/api/admin/reviews/contacts').then((res) => {
      if (!cancelled && res.ok) setContacts(res.data.contacts ?? {});
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = sortReviews(filterReviews(items, filters), sort);
  const featured = featuredCount(items);

  return (
    <div data-field-path="items">
      <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900">
        Reviews from visitors are published on the website <strong>straight away</strong>. Here you can fix a typo, hide a review, pick up to {MAX_FEATURED} to feature on the Home page, delete one, or add a review you received by WhatsApp or in person. Changes go live when you press <strong>Save changes</strong>.
      </p>
      {ed.err('items') ? (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {ed.err('items')}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="min-w-0 flex-1 text-sm font-medium text-ink sm:max-w-xs">
          <span className="sr-only">Search reviews</span>
          <input type="search" value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} placeholder="Search name or text…" className="focus-ring h-11 w-full rounded-lg border border-line bg-white px-3 text-sm" />
        </label>
        <label className="text-sm font-medium text-ink">
          <span className="sr-only">Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as ReviewSort)} className="focus-ring h-11 rounded-lg border border-line bg-white px-3 text-sm">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </select>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={filters.featuredOnly} onChange={(e) => setFilters({ ...filters, featuredOnly: e.target.checked })} className="size-5 accent-green-800" />
          Featured only
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={filters.hiddenOnly} onChange={(e) => setFilters({ ...filters, hiddenOnly: e.target.checked })} className="size-5 accent-green-800" />
          Hidden only
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center text-muted">
          {items.length === 0 ? 'No reviews yet. They appear here as soon as visitors post them, or use “Add review”.' : 'No reviews match.'}
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {shown.map((r) => (
            <ReviewCard key={r.id} review={r} contact={contacts[r.id]} onEdit={() => onEdit(r.id)} />
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted">
        {items.length} review{items.length === 1 ? '' : 's'} · {featured} of {MAX_FEATURED} featured on the Home page
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Edit / add drawer                                                    */
/* ------------------------------------------------------------------ */

function ReviewDrawerBody({ id }: { id: string }) {
  const { ed, items, patch } = useReviewList();
  const toast = useToast();
  const index = items.findIndex((r) => r.id === id);
  const review = items[index];
  if (!review) return null;
  const base = `items.${index}`;

  return (
    <>
      <Text path={`${base}.name`} label="Name" required maxLength={60} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Choice
            path={`${base}.rating`}
            label="Rating"
            numeric
            options={RATING_OPTIONS.map((v) => ({ value: String(v), label: `${v} star${v === 1 ? '' : 's'}` }))}
          />
          <div className="mt-2">
            <Stars value={review.rating} size={20} />
          </div>
        </div>
        <Day path={`${base}.date`} label="Date shown" hint="Past dates are fine, for example a review you received earlier." />
      </div>
      <Area path={`${base}.text`} label="Review text" required rows={6} maxLength={600} hint="You can fix typos. Plain text only." />
      <Img path={`${base}.avatar`} kind="avatar" folder="avatars" label="Photo (optional)" hint="Without a photo, the site shows the person's initials." />
      <Switch path={`${base}.published`} label="Published" hint="Hidden reviews are saved but not shown on the website." />
      <Toggle
        label="Feature on the Home page"
        hint={`Up to ${MAX_FEATURED} reviews can be featured.`}
        checked={review.featured}
        onChange={(v) => {
          if (v) {
            const check = canFeature(items, review.id);
            if (!check.ok) return toast.error(check.message);
          }
          patch(review.id, { featured: v });
        }}
      />
      {ed.err(`${base}.featured`) ? <p role="alert" className="text-sm font-medium text-red-700">{ed.err(`${base}.featured`)}</p> : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 2: page settings                                                 */
/* ------------------------------------------------------------------ */

function SummaryPreview() {
  const { items } = useReviewList();
  const s = computeReviewStats(items);
  return (
    <div className="rounded-xl bg-green-50 p-4 text-sm text-green-900">
      <p className="font-semibold">The numbers at the top of the Reviews page are always real</p>
      <p className="mt-1">They are worked out from the published reviews. Hiding or deleting a review changes them. With no published reviews they show a dash.</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        <li className="rounded-lg bg-white p-3">
          <span className="block text-xs text-muted">Average rating</span>
          <span className="text-lg font-bold">{s.rating !== null ? `${s.rating.toFixed(1)} / 5` : '–'}</span>
          <span className="block text-xs text-muted">{s.count} review{s.count === 1 ? '' : 's'}</span>
        </li>
        <li className="rounded-lg bg-white p-3">
          <span className="block text-xs text-muted">Happy learners (4 stars or more)</span>
          <span className="text-lg font-bold">{s.count ? s.happyLearners : '–'}</span>
        </li>
        <li className="rounded-lg bg-white p-3">
          <span className="block text-xs text-muted">Would recommend</span>
          <span className="text-lg font-bold">{s.recommendPercent !== null ? `${s.recommendPercent}%` : '–'}</span>
        </li>
      </ul>
    </div>
  );
}

function SettingsTab() {
  return (
    <>
      <SummaryPreview />
      <div className="mt-6" />
      <Section title="Visitor reviews" paths={['acceptSubmissions']}>
        <Switch path="acceptSubmissions" label="Accept new reviews from visitors" hint="When off, the Leave a Review buttons say “Reviews are currently closed” and the form stops accepting reviews." />
      </Section>
      <Section title="Banner" paths={['hero']}>
        <Text path="hero.title" label="Title" required maxLength={120} />
        <Area path="hero.subtitle" label="Subtitle" required rows={2} maxLength={300} />
        <Img path="hero.image" altPath="hero.imageAlt" label="Banner image" />
      </Section>
      <Section title="Heading above the reviews" paths={['titleLead', 'titleHighlight']}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Text path="titleLead" label="Heading" required maxLength={80} placeholder="What Our Learners Say" />
          <Text path="titleHighlight" label="Highlighted words (optional)" maxLength={60} />
        </div>
      </Section>
      <Section title="Share your experience banner" paths={['ctaTitleLead', 'ctaTitleHighlight', 'ctaText']}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Text path="ctaTitleLead" label="Title (first part)" required maxLength={40} />
          <Text path="ctaTitleHighlight" label="Highlighted words (orange)" required maxLength={60} />
        </div>
        <Area path="ctaText" label="Text" required rows={2} maxLength={200} />
      </Section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* The page                                                             */
/* ------------------------------------------------------------------ */

function AddReviewButton({ onAdd }: { onAdd: (id: string) => void }) {
  const { items, setItems } = useReviewList();
  return (
    <Button
      size="sm"
      onClick={() => {
        const review = newReview();
        setItems([...items, review]);
        onAdd(review.id);
      }}
      icon={<Plus className="size-4" aria-hidden="true" />}
    >
      Add review
    </Button>
  );
}

function DrawerHost({ editing, setEditing }: { editing: Editing | null; setEditing: (e: Editing | null) => void }) {
  const { ed, items, setItems } = useReviewList();
  const review = editing ? items.find((r) => r.id === editing.id) : undefined;

  function cancel() {
    if (!editing) return;
    if (editing.snapshot === null) setItems(items.filter((r) => r.id !== editing.id));
    else {
      const idx = items.findIndex((r) => r.id === editing.id);
      if (idx >= 0) ed.set(`items.${idx}`, editing.snapshot);
    }
    setEditing(null);
  }

  return (
    <Drawer
      open={Boolean(editing && review)}
      title={editing?.snapshot === null ? 'Add review' : 'Edit review'}
      description="Changes apply when you press Done, and go live with Save changes."
      onCancel={cancel}
      onDone={() => setEditing(null)}
    >
      {editing && review ? <ReviewDrawerBody key={review.id} id={review.id} /> : null}
    </Drawer>
  );
}

function ReviewsInner({ editing, setEditing }: { editing: Editing | null; setEditing: (e: Editing | null) => void }) {
  const { items } = useReviewList();
  const open = (id: string) => setEditing({ id, snapshot: structuredClone(items.find((r) => r.id === id) ?? null) });
  return (
    <>
      <Tabs
        tabs={[
          { label: `Reviews (${items.length})`, content: <ReviewsTab onEdit={open} /> },
          { label: 'Summary & page settings', content: <SettingsTab /> },
        ]}
      />
      <DrawerHost editing={editing} setEditing={setEditing} />
    </>
  );
}

export function ReviewsEditor() {
  const [editing, setEditing] = useState<Editing | null>(null);
  return (
    <ContentEditor
      name="reviews"
      title="Reviews"
      description="Reviews are published as soon as visitors post them. Edit, hide, feature or delete them here, and control the Reviews page."
      previewPath="/reviews"
      headerActions={<AddReviewButton onAdd={(id) => setEditing({ id, snapshot: null })} />}
    >
      <ReviewsInner editing={editing} setEditing={setEditing} />
    </ContentEditor>
  );
}

