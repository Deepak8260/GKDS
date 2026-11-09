'use client';

import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, CircleAlert, GripVertical, ImagePlus, LoaderCircle, Pencil, RotateCw, Settings2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { SafeImage as Image } from '@/components/ui/safe-image';
import { filterItems, filtersActive, galleryStats, categoryCounts, categoryDeleteBlock, MAX_CATEGORIES, moveBefore, newCategory, newPhoto, NO_FILTERS, renumberItems, type GalleryFilters } from '@/lib/admin/gallery';
import { formatBytes, processImage, rejectReason } from '@/lib/image-client';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import type { GalleryCategory, GalleryItem } from '@/lib/validators';
import { useConfirm } from '../confirm';
import { Drawer } from '../drawer';
import { TextField } from '../fields';
import { Area, Choice, ContentEditor, Icons, Img, Section, Switch, Text, useEditor } from '../editor';
import { uploadImage } from '../media-client';
import { useUploadQueue, type UploadItem } from '../use-upload-queue';

const ACCEPT = 'image/jpeg,image/png,image/webp';

function useGallery() {
  const ed = useEditor();
  const items = (ed.get('items') as GalleryItem[] | undefined) ?? [];
  const categories = (ed.get('categories') as GalleryCategory[] | undefined) ?? [];
  const setItems = (next: GalleryItem[]) => ed.set('items', renumberItems(next));
  return { ed, items, categories, setItems };
}

const labelOf = (it: GalleryItem, index: number) => it.alt.trim() || `Photo ${index + 1}`;

/* ------------------------------------------------------------------ */
/* Upload zone                                                          */
/* ------------------------------------------------------------------ */

function UploadStatusCard({ item, onRetry, onRemove }: { item: UploadItem; onRetry: () => void; onRemove: () => void }) {
  const label: Record<UploadItem['status'], string> = {
    queued: 'Waiting…',
    compressing: 'Making it smaller…',
    uploading: 'Uploading…',
    done: 'Uploaded',
    error: item.error ?? 'Failed',
  };
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-white p-2.5">
      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-green-50">
        {item.previewUrl ? <Image src={item.previewUrl} alt="" fill sizes="48px" className="object-cover" unoptimized /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{item.name}</p>
        <p className={cn('text-xs', item.status === 'error' ? 'font-medium text-red-700' : item.status === 'done' ? 'text-green-800' : 'text-muted')} role={item.status === 'error' ? 'alert' : undefined}>
          {item.note ?? label[item.status]}
          {item.before && item.after ? ` · ${formatBytes(item.before)} → ${formatBytes(item.after)}` : ''}
        </p>
      </div>
      {item.status === 'compressing' || item.status === 'uploading' ? <LoaderCircle className="size-5 animate-spin text-muted" aria-hidden="true" /> : null}
      {item.status === 'error' ? (
        <button type="button" onClick={onRetry} aria-label={`Retry ${item.name}`} className="focus-ring flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-green-800 hover:bg-green-50">
          <RotateCw className="size-4" aria-hidden="true" /> Retry
        </button>
      ) : null}
      {item.status === 'done' || item.status === 'error' ? (
        <button type="button" onClick={onRemove} aria-label={`Dismiss ${item.name}`} className="focus-ring rounded-lg p-2.5 text-muted hover:bg-green-50">
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </li>
  );
}

function UploadZone() {
  const { ed, categories } = useGallery();
  const [category, setCategory] = useState('');
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const effective = categories.some((c) => c.id === category) ? category : (categories[0]?.id ?? '');

  const queue = useUploadQueue({
    onUploaded: (it) => {
      // added to the draft the moment its file is stored; failed uploads never create an entry
      ed.update('items', (cur) => renumberItems([...((cur as GalleryItem[]) ?? []), newPhoto(it.path!, String(it.meta))]));
    },
  });

  function addFiles(list: FileList | File[] | null) {
    const files = Array.from(list ?? []);
    if (files.length === 0 || !effective) return;
    queue.add(files, 'gallery', 'gallery', effective);
  }

  return (
    <div className="mb-6 rounded-2xl border-2 border-dashed border-line bg-white p-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn('flex flex-col items-center gap-3 rounded-xl px-4 py-6 text-center transition-colors', dragging && 'bg-orange-50')}
      >
        <ImagePlus className="size-9 text-orange-500" strokeWidth={1.5} aria-hidden="true" />
        <p className="font-semibold text-green-900">Drag photos here, or choose them from your phone or computer</p>
        <p className="text-sm text-muted">JPG, PNG or WebP. Big photos are made smaller automatically before they are uploaded.</p>
        <div className="flex flex-wrap items-end justify-center gap-3">
          <label className="text-left text-sm font-medium text-ink">
            Add to category
            <select value={effective} onChange={(e) => setCategory(e.target.value)} className="focus-ring mt-1 block h-11 rounded-lg border border-line bg-white px-3 text-base">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <Button size="sm" onClick={() => input.current?.click()} icon={<ImagePlus className="size-4" aria-hidden="true" />}>
            Choose photos
          </Button>
          <label htmlFor="gallery-upload" className="sr-only">
            Choose photos to upload
          </label>
          <input
            ref={input}
            id="gallery-upload"
            type="file"
            multiple
            accept={ACCEPT}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {queue.total > 0 ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <p role="status" aria-live="polite" className="font-medium text-ink">
              {queue.busy ? `Uploading ${queue.finished} of ${queue.total}…` : `${queue.finished} of ${queue.total} done`}
            </p>
            {!queue.busy ? (
              <button type="button" onClick={queue.clearFinished} className="focus-ring min-h-11 rounded px-2 text-sm font-semibold text-green-800 underline underline-offset-2">
                Clear finished
              </button>
            ) : null}
          </div>
          <div role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={queue.total} aria-valuenow={queue.finished} className="mb-3 h-2 overflow-hidden rounded-full bg-green-50">
            <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${(queue.finished / queue.total) * 100}%` }} />
          </div>
          <ul className="space-y-2">
            {queue.items.map((it) => (
              <UploadStatusCard key={it.id} item={it} onRetry={() => queue.retry(it.id)} onRemove={() => queue.remove(it.id)} />
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Uploaded photos are added below with empty alt text. Describe each one, then press Save changes to publish them.</p>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filters, bulk bar and grid                                           */
/* ------------------------------------------------------------------ */

function FilterBar({ filters, setFilters }: { filters: GalleryFilters; setFilters: (f: GalleryFilters) => void }) {
  const { items, categories } = useGallery();
  const counts = categoryCounts(items);
  const tab = (id: string, label: string, count: number) => (
    <button
      key={id || 'all'}
      type="button"
      aria-pressed={filters.category === id}
      onClick={() => setFilters({ ...filters, category: id })}
      className={cn('focus-ring min-h-11 whitespace-nowrap rounded-full border px-4 text-sm font-semibold', filters.category === id ? 'border-green-800 bg-green-800 text-white' : 'border-line bg-white text-ink hover:bg-green-50')}
    >
      {label} <span>({count})</span>
    </button>
  );
  return (
    <div className="mb-4 space-y-3">
      <div role="group" aria-label="Filter by category" className="flex gap-2 overflow-x-auto pb-1">
        {tab('', 'All', items.length)}
        {categories.map((c) => tab(c.id, c.label, counts[c.id] ?? 0))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="min-w-0 flex-1 text-sm font-medium text-ink sm:max-w-xs">
          <span className="sr-only">Search by alt text</span>
          <input type="search" value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} placeholder="Search alt text…" className="focus-ring h-11 w-full rounded-lg border border-line bg-white px-3 text-sm" />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={filters.missingAlt} onChange={(e) => setFilters({ ...filters, missingAlt: e.target.checked })} className="size-5 accent-green-800" />
          Missing alt text only
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={filters.hiddenOnly} onChange={(e) => setFilters({ ...filters, hiddenOnly: e.target.checked })} className="size-5 accent-green-800" />
          Hidden only
        </label>
        {filtersActive(filters) ? (
          <button type="button" onClick={() => setFilters(NO_FILTERS)} className="focus-ring min-h-11 rounded px-2 text-sm font-semibold text-green-800 underline underline-offset-2">
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}

function BulkBar({ selected, setSelected, visibleIds }: { selected: Set<string>; setSelected: (s: Set<string>) => void; visibleIds: string[] }) {
  const { items, categories, setItems } = useGallery();
  const confirm = useConfirm();
  const [target, setTarget] = useState('');
  const chosen = items.filter((i) => selected.has(i.id));
  if (selected.size === 0) return null;

  const mapSelected = (fn: (i: GalleryItem) => GalleryItem) => setItems(items.map((i) => (selected.has(i.id) ? fn(i) : i)));

  async function del() {
    const ok = await confirm({
      title: `Delete ${chosen.length} photo${chosen.length === 1 ? '' : 's'}?`,
      message: 'They are removed from the gallery when you press Save changes. The picture files stay in the Media Library until you delete them there.',
      confirmLabel: 'Delete photos',
      danger: true,
    });
    if (!ok) return;
    setItems(items.filter((i) => !selected.has(i.id)));
    setSelected(new Set());
  }

  return (
    <div role="region" aria-label="Bulk actions" className="sticky top-16 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 p-3 shadow-card lg:top-0">
      <p className="mr-2 text-sm font-semibold text-orange-800">{selected.size} selected</p>
      <Button variant="secondary" size="sm" onClick={() => setSelected(new Set(visibleIds))}>
        Select all
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setSelected(new Set())}>
        Select none
      </Button>
      <Button size="sm" onClick={() => mapSelected((i) => ({ ...i, published: true }))}>
        Publish
      </Button>
      <Button variant="secondary" size="sm" onClick={() => mapSelected((i) => ({ ...i, published: false }))}>
        Unpublish
      </Button>
      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <span className="sr-only">Change category to</span>
        <select value={target} onChange={(e) => setTarget(e.target.value)} className="focus-ring h-11 rounded-lg border border-line bg-white px-2 text-sm">
          <option value="">Change category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <Button
        variant="secondary"
        size="sm"
        disabled={!target}
        onClick={() => {
          mapSelected((i) => ({ ...i, category: target }));
          setTarget('');
        }}
      >
        Apply
      </Button>
      <Button variant="secondary" size="sm" onClick={() => void del()} icon={<Trash2 className="size-4" aria-hidden="true" />} className="ml-auto !border-red-300 !text-red-700">
        Delete
      </Button>
    </div>
  );
}

function PhotoTile({
  item, filtered, visibleIds, selected, toggleSelect, onEdit, dragFrom, setDragFrom, dragOver, setDragOver,
}: {
  item: GalleryItem;
  filtered: boolean;
  visibleIds: string[];
  selected: boolean;
  toggleSelect: () => void;
  onEdit: () => void;
  dragFrom: string | null;
  setDragFrom: (id: string | null) => void;
  dragOver: string | null;
  setDragOver: (id: string | null) => void;
}) {
  const { ed, items, categories, setItems } = useGallery();
  const label = labelOf(item, items.findIndex((i) => i.id === item.id));
  const category = categories.find((c) => c.id === item.category)?.label ?? item.category;
  const hasError = Object.keys(ed.errors).some((k) => k.startsWith(`items.${items.findIndex((i) => i.id === item.id)}.`));
  const posInVisible = visibleIds.indexOf(item.id);

  const moveStep = (delta: -1 | 1) => {
    const neighbour = visibleIds[posInVisible + delta];
    if (neighbour) setItems(moveBefore(items, item.id, neighbour));
  };

  return (
    <li
      draggable={dragFrom === item.id}
      onDragOver={(e) => {
        if (dragFrom === null) return;
        e.preventDefault();
        setDragOver(item.id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (dragFrom && dragFrom !== item.id) setItems(moveBefore(items, dragFrom, item.id));
        setDragFrom(null);
        setDragOver(null);
      }}
      onDragEnd={() => {
        setDragFrom(null);
        setDragOver(null);
      }}
      className={cn('overflow-hidden rounded-2xl border bg-white shadow-card', dragOver === item.id && dragFrom !== item.id ? 'border-orange-500' : 'border-line', !item.published && 'border-dashed')}
    >
      <div className="relative aspect-[4/3] bg-green-50">
        <Image src={mediaUrl(item.src)} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" unoptimized />
        <label className="absolute left-2 top-2 flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow">
          <input type="checkbox" checked={selected} onChange={toggleSelect} aria-label={`Select ${label}`} className="size-5 accent-green-800" />
        </label>
        {!filtered ? (
          <span onPointerDown={() => setDragFrom(item.id)} onPointerUp={() => setDragFrom(null)} className="absolute right-2 top-2 cursor-grab touch-none rounded-full bg-white/90 p-2.5 text-muted shadow" aria-hidden="true" title="Drag to reorder">
            <GripVertical className="size-5" />
          </span>
        ) : null}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-800">{category}</span>
          {!item.published ? <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">Hidden</span> : null}
          {!item.alt.trim() || hasError ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
              <CircleAlert className="size-3.5" aria-hidden="true" /> {!item.alt.trim() ? 'Missing alt text' : 'Needs attention'}
            </span>
          ) : null}
        </div>
        <p className="line-clamp-2 min-h-8 text-xs text-muted">{item.alt.trim() || 'No description yet'}</p>
        <div className="flex items-center justify-between gap-1 border-t border-line pt-2">
          <button
            type="button"
            role="switch"
            aria-checked={item.published}
            aria-label={`Published: ${label}`}
            onClick={() => setItems(items.map((i) => (i.id === item.id ? { ...i, published: !i.published } : i)))}
            className={cn('focus-ring relative h-7 w-12 shrink-0 rounded-full transition-colors', item.published ? 'bg-green-700' : 'bg-muted/40')}
          >
            <span aria-hidden="true" className={cn('absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform', item.published && 'translate-x-5')} />
          </button>
          <div className="flex items-center">
            <button type="button" onClick={() => moveStep(-1)} disabled={posInVisible <= 0} aria-label={`Move earlier: ${label}`} className="focus-ring rounded-lg p-2.5 text-muted hover:bg-green-50 disabled:opacity-30">
              <ArrowUp className="size-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => moveStep(1)} disabled={posInVisible === visibleIds.length - 1} aria-label={`Move later: ${label}`} className="focus-ring rounded-lg p-2.5 text-muted hover:bg-green-50 disabled:opacity-30">
              <ArrowDown className="size-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={onEdit} aria-label={`Edit ${label}`} className="focus-ring rounded-lg p-2.5 text-green-800 hover:bg-green-50">
              <Pencil className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Edit drawer                                                          */
/* ------------------------------------------------------------------ */

function PhotoDrawerBody({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const { ed, items, categories, setItems } = useGallery();
  const confirm = useConfirm();
  const index = items.findIndex((i) => i.id === id);
  const item = items[index];
  const [phase, setPhase] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  if (!item) return null;
  const base = `items.${index}`;

  async function replace(file: File | undefined) {
    if (!file) return;
    const rejected = rejectReason(file);
    if (rejected) return setPhase(rejected);
    try {
      setPhase('Making it smaller…');
      const processed = await processImage(file, 'gallery');
      setPhase('Uploading…');
      const result = await uploadImage('gallery', file.name, processed.blob);
      ed.set(`${base}.src`, result.path);
      setPhase(`Replaced. ${formatBytes(processed.bytesBefore)} → ${formatBytes(processed.bytesAfter)}. The alt text and category were kept.`);
    } catch (e) {
      setPhase(e instanceof Error ? e.message : 'Upload failed.');
    }
  }

  async function del() {
    const ok = await confirm({
      title: 'Delete this photo?',
      message: 'It is removed from the gallery when you press Save changes. The picture file stays in the Media Library; once it is not used anywhere you can delete the file there.',
      confirmLabel: 'Delete photo',
      danger: true,
    });
    if (!ok) return;
    setItems(items.filter((i) => i.id !== id));
    onDeleted();
  }

  return (
    <>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-green-50">
        <Image src={mediaUrl(item.src)} alt="" fill sizes="600px" className="object-cover" unoptimized />
      </div>
      <Area path={`${base}.alt`} label="Alt text (description of the photo)" required rows={3} maxLength={200} hint="Describe the photo for visually impaired visitors and for Google." />
      <Choice path={`${base}.category`} label="Category" options={categories.map((c) => ({ value: c.id, label: c.label }))} />
      <Switch path={`${base}.published`} label="Published" hint="Hidden photos are saved but not shown on the website." />
      <div>
        <p className="mb-1.5 text-sm font-medium text-ink">Replace the picture</p>
        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} icon={<ImagePlus className="size-4" aria-hidden="true" />}>
          Upload a replacement
        </Button>
        <label htmlFor="gallery-replace" className="sr-only">
          Choose a replacement picture
        </label>
        <input
          ref={fileRef}
          id="gallery-replace"
          type="file"
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            void replace(f);
          }}
        />
        <p role="status" aria-live="polite" className="mt-1.5 text-xs text-muted">
          {phase || 'Keeps this photo’s alt text, category and position.'}
        </p>
      </div>
      <div className="border-t border-line pt-4">
        <Button variant="secondary" size="sm" onClick={() => void del()} icon={<Trash2 className="size-4" aria-hidden="true" />} className="!border-red-300 !text-red-700">
          Delete photo
        </Button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Categories manager                                                   */
/* ------------------------------------------------------------------ */

function CategoriesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { ed, items, categories } = useGallery();
  const confirm = useConfirm();
  const [label, setLabel] = useState('');
  const setCats = (next: GalleryCategory[]) => ed.set('categories', next);

  function move(i: number, to: number) {
    if (to < 0 || to >= categories.length) return;
    const next = categories.slice();
    const [m] = next.splice(i, 1);
    next.splice(to, 0, m);
    setCats(next);
  }

  async function remove(i: number) {
    const c = categories[i];
    const ok = await confirm({ title: `Delete the “${c.label}” category?`, message: 'It disappears from the gallery when you press Save changes.', confirmLabel: 'Delete category', danger: true });
    if (ok) setCats(categories.filter((_, idx) => idx !== i));
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage categories" description="The “All Photos” button is built in. Changes apply when you press Save changes." className="sm:max-w-2xl">
      <ul className="space-y-4">
        {categories.map((c, i) => {
          const block = categoryDeleteBlock(c.id, items);
          return (
            <li key={c.id} className="rounded-xl border border-line p-3">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Text path={`categories.${i}.label`} label={`Category ${i + 1} name`} required maxLength={40} />
                </div>
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${c.label} up`} className="focus-ring mb-0.5 rounded-lg p-2.5 text-muted hover:bg-green-50 disabled:opacity-30">
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === categories.length - 1} aria-label={`Move ${c.label} down`} className="focus-ring mb-0.5 rounded-lg p-2.5 text-muted hover:bg-green-50 disabled:opacity-30">
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => void remove(i)}
                  disabled={Boolean(block) || categories.length <= 1}
                  aria-label={`Delete ${c.label}`}
                  title={block ?? 'Delete category'}
                  className="focus-ring mb-0.5 rounded-lg p-2.5 text-red-600 hover:bg-red-50 disabled:opacity-30"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
              {block ? <p className="mt-1.5 text-xs text-muted">Cannot delete: {block}</p> : null}
              <details className="mt-2">
                <summary className="focus-ring inline-block cursor-pointer rounded text-xs font-semibold text-green-800">Icon: {c.icon}</summary>
                <div className="mt-2">
                  <Icons path={`categories.${i}.icon`} label="Icon" />
                </div>
              </details>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-4">
        <div className="min-w-0 flex-1">
          <TextField label="New category name" value={label} onChange={setLabel} maxLength={40} placeholder="Road Safety Week" />
        </div>
        <Button
          size="sm"
          disabled={!label.trim() || categories.length >= MAX_CATEGORIES}
          onClick={() => {
            setCats([...categories, newCategory(label.trim(), categories)]);
            setLabel('');
          }}
        >
          Add category
        </Button>
      </div>
      {categories.length >= MAX_CATEGORIES ? <p className="mt-2 text-xs text-muted">Maximum of {MAX_CATEGORIES} categories reached.</p> : null}
      <div className="mt-5 flex justify-end">
        <Button size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* The page                                                             */
/* ------------------------------------------------------------------ */

function GalleryBody({ catOpen, closeCategories }: { catOpen: boolean; closeCategories: () => void }) {
  const { ed, items } = useGallery();
  const [filters, setFilters] = useState<GalleryFilters>(NO_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; snapshot: GalleryItem } | null>(null);

  const stats = galleryStats(items);
  const visible = filterItems(items, filters);
  const visibleIds = visible.map((i) => i.id);
  const filtered = filtersActive(filters);

  function cancelEdit() {
    if (!editing) return;
    const idx = items.findIndex((i) => i.id === editing.id);
    if (idx >= 0) ed.set(`items.${idx}`, editing.snapshot);
    setEditing(null);
  }

  return (
    <>
      <ul className="mb-5 flex flex-wrap gap-2" aria-label="Gallery summary">
        {[
          [`${stats.total} photo${stats.total === 1 ? '' : 's'}`, 'bg-green-50 text-green-800'],
          [`${stats.published} published`, 'bg-green-50 text-green-800'],
          [`${stats.hidden} hidden`, 'bg-gray-100 text-gray-700'],
          [`${stats.missingAlt} missing alt text`, stats.missingAlt ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-800'],
        ].map(([text, tone]) => (
          <li key={text} className={cn('rounded-full px-3 py-1 text-sm font-semibold', tone)}>
            {text}
          </li>
        ))}
      </ul>

      <UploadZone />
      <FilterBar filters={filters} setFilters={setFilters} />
      <BulkBar selected={selected} setSelected={setSelected} visibleIds={visibleIds} />

      {ed.err('items') ? (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {ed.err('items')}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center text-muted">{items.length === 0 ? 'No photos yet. Upload some above.' : 'No photos match these filters.'}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((it) => (
            <PhotoTile
              key={it.id}
              item={it}
              filtered={filtered}
              visibleIds={visibleIds}
              selected={selected.has(it.id)}
              toggleSelect={() => {
                const next = new Set(selected);
                if (next.has(it.id)) next.delete(it.id);
                else next.add(it.id);
                setSelected(next);
              }}
              onEdit={() => setEditing({ id: it.id, snapshot: structuredClone(it) })}
              dragFrom={dragFrom}
              setDragFrom={setDragFrom}
              dragOver={dragOver}
              setDragOver={setDragOver}
            />
          ))}
        </ul>
      )}
      {filtered ? <p className="mt-3 text-xs text-muted">Reordering by dragging is available when no filter is on. The arrows move a photo within the filtered list.</p> : null}

      <div className="mt-8">
        <Section accordion title="Page settings" summary="Banner and the heading above the photos" paths={['hero', 'titleLead', 'titleHighlight']}>
          <Text path="hero.title" label="Banner title" required maxLength={120} />
          <Area path="hero.subtitle" label="Banner subtitle" required rows={2} maxLength={300} />
          <Img path="hero.image" altPath="hero.imageAlt" label="Banner image" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Text path="titleLead" label="Heading (first word)" required maxLength={40} />
            <Text path="titleHighlight" label="Heading (highlighted word)" maxLength={40} />
          </div>
        </Section>
      </div>

      <Drawer open={Boolean(editing)} title="Edit photo" description="Changes apply when you press Done, and are saved with Save changes." onCancel={cancelEdit} onDone={() => setEditing(null)}>
        {editing ? <PhotoDrawerBody key={editing.id} id={editing.id} onDeleted={() => setEditing(null)} /> : null}
      </Drawer>
      <CategoriesModal open={catOpen} onClose={closeCategories} />
    </>
  );
}

export function GalleryEditor() {
  const [catOpen, setCatOpen] = useState(false);
  return (
    <ContentEditor
      name="gallery"
      title="Gallery"
      description="Upload photos, describe them, organise them into categories and decide what visitors see. Everything is saved together with Save changes."
      previewPath="/gallery"
      headerActions={
        <Button variant="secondary" size="sm" onClick={() => setCatOpen(true)} icon={<Settings2 className="size-4" aria-hidden="true" />}>
          Manage categories
        </Button>
      }
    >
      <GalleryBody catOpen={catOpen} closeCategories={() => setCatOpen(false)} />
    </ContentEditor>
  );
}

