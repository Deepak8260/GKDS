'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { CourseCard } from '@/components/sections/courses/course-card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { SafeImage as Image } from '@/components/ui/safe-image';
import { duplicateSlugs, MAX_COURSES, moveItem, newCourse, renumber, slugify, uniqueSlug } from '@/lib/admin/courses';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import type { Course } from '@/lib/validators';
import { Tabs } from '../blocks';
import { useConfirm } from '../confirm';
import { Drawer } from '../drawer';
import { TextField } from '../fields';
import { Area, ContentEditor, Img, List, Section, Switch, Text, useEditor, Icons } from '../editor';

interface Editing {
  index: number;
  /** The course as it was when the drawer opened (restored by Cancel). Null for a course just added (Cancel removes it). */
  snapshot: Course | null;
}

const PREVIEW_PHONE = '+91 00000 00000';

/** Everything that changes the list goes through here so order is always 1..n. */
function useCourseList() {
  const ed = useEditor();
  const list = (ed.get('courses') as Course[] | undefined) ?? [];
  const setList = useCallback((next: Course[]) => ed.set('courses', renumber(next)), [ed]);
  return { ed, list, setList };
}

/* ------------------------------------------------------------------ */
/* Tab 1: the course list                                              */
/* ------------------------------------------------------------------ */

function CourseTile({
  course, index, total, onEdit, dragFrom, setDragFrom, dragOver, setDragOver,
}: {
  course: Course;
  index: number;
  total: number;
  onEdit: () => void;
  dragFrom: number | null;
  setDragFrom: (i: number | null) => void;
  dragOver: number | null;
  setDragOver: (i: number | null) => void;
}) {
  const { ed, list, setList } = useCourseList();
  const confirm = useConfirm();
  const hasError = Object.keys(ed.errors).some((k) => k.startsWith(`courses.${index}.`));
  const label = course.title || 'Untitled course';

  async function remove() {
    const ok = await confirm({
      title: 'Delete this course?',
      message: 'It is removed from the list now and from the website when you press Save changes. Its image file stays in the Media Library.',
      confirmLabel: 'Delete course',
      danger: true,
      typeToConfirm: course.title.trim() || 'delete',
    });
    if (ok) setList(list.filter((_, i) => i !== index));
  }

  return (
    <li
      draggable={dragFrom === index}
      onDragOver={(e) => {
        if (dragFrom === null) return;
        e.preventDefault();
        setDragOver(index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (dragFrom !== null) setList(moveItem(list, dragFrom, index));
        setDragFrom(null);
        setDragOver(null);
      }}
      onDragEnd={() => {
        setDragFrom(null);
        setDragOver(null);
      }}
      className={cn(
        'rounded-2xl border bg-white p-4 shadow-card transition-opacity',
        dragOver === index && dragFrom !== index ? 'border-orange-500' : 'border-line',
        !course.published && 'opacity-70',
      )}
    >
      <div className="flex gap-4">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg border border-line bg-green-50">
          {course.image ? <Image src={mediaUrl(course.image)} alt="" fill sizes="128px" className="object-cover" unoptimized /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-green-900">{label}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {course.vehicle ? <Pill className="px-2.5 py-0.5 text-xs">{course.vehicle}</Pill> : null}
            {!course.published ? <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">Hidden</span> : null}
            {hasError ? <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">Needs attention</span> : null}
          </div>
          <p className="mt-1.5 truncate text-xs text-muted">/courses#{course.slug}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-ink">
          <button
            type="button"
            role="switch"
            aria-checked={course.published}
            aria-label={`Published: ${label}`}
            onClick={() => ed.set(`courses.${index}.published`, !course.published)}
            className={cn('focus-ring relative h-7 w-12 shrink-0 rounded-full transition-colors', course.published ? 'bg-green-700' : 'bg-muted/40')}
          >
            <span aria-hidden="true" className={cn('absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform', course.published && 'translate-x-5')} />
          </button>
          Published
        </label>

        <div className="flex items-center gap-0.5">
          <span
            onPointerDown={() => setDragFrom(index)}
            onPointerUp={() => setDragFrom(null)}
            className="cursor-grab touch-none rounded p-2 text-muted"
            aria-hidden="true"
            title="Drag to reorder"
          >
            <GripVertical className="size-5" />
          </span>
          <button type="button" onClick={() => setList(moveItem(list, index, index - 1))} disabled={index === 0} aria-label={`Move up: ${label}`} className="focus-ring rounded-lg p-2.5 text-muted hover:bg-green-50 disabled:opacity-30">
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setList(moveItem(list, index, index + 1))} disabled={index === total - 1} aria-label={`Move down: ${label}`} className="focus-ring rounded-lg p-2.5 text-muted hover:bg-green-50 disabled:opacity-30">
            <ArrowDown className="size-4" aria-hidden="true" />
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

function CoursesTab({ onEdit }: { onEdit: (index: number) => void }) {
  const { ed, list } = useCourseList();
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const published = list.filter((c) => c.published).length;

  return (
    <div data-field-path="courses">
      {list.length > 0 && published === 0 ? (
        <p role="status" className="mb-5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          No course is published, so the Courses page will show an empty state. Turn on Published for at least one course.
        </p>
      ) : null}
      {ed.err('courses') ? (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {ed.err('courses')}
        </p>
      ) : null}

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center text-muted">No courses yet. Use “Add course” to create the first one.</p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {list.map((c, i) => (
            <CourseTile key={c.id} course={c} index={i} total={list.length} onEdit={() => onEdit(i)} dragFrom={dragFrom} setDragFrom={setDragFrom} dragOver={dragOver} setDragOver={setDragOver} />
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted">
        {list.length} of {MAX_COURSES} courses · The order here is the order on the website. Hidden courses are not shown anywhere on the site.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The edit drawer                                                      */
/* ------------------------------------------------------------------ */

function CourseDrawerBody({ index, isNew }: { index: number; isNew: boolean }) {
  const { ed, list } = useCourseList();
  const course = list[index];
  const base = `courses.${index}`;
  // the slug follows the title until the owner edits it by hand
  const [autoSlug, setAutoSlug] = useState(isNew);
  if (!course) return null;

  const others = list.filter((_, i) => i !== index).map((c) => c.slug);
  const savedCourse = (ed.getSaved('courses') as Course[] | undefined)?.find((c) => c.id === course.id);
  const slugChanged = Boolean(savedCourse && savedCourse.slug !== course.slug);
  const dup = duplicateSlugs(list).has(course.slug);

  return (
    <>
      <TextField
        label="Title"
        required
        value={course.title}
        maxLength={80}
        error={ed.err(`${base}.title`)}
        onChange={(v) => {
          ed.set(`${base}.title`, v);
          if (autoSlug) ed.set(`${base}.slug`, uniqueSlug(slugify(v), others));
        }}
      />
      <div>
        <TextField
          label="Web address (slug)"
          required
          value={course.slug}
          maxLength={60}
          error={ed.err(`${base}.slug`) ?? (dup ? 'Another course already uses this slug. Each course needs a unique one.' : undefined)}
          hint={
            <>
              Link to this course: <strong>/courses#{course.slug || '…'}</strong>. Lowercase letters, numbers and hyphens only.
            </>
          }
          onChange={(v) => {
            setAutoSlug(false);
            ed.set(`${base}.slug`, v.toLowerCase().replace(/\s+/g, '-'));
          }}
        />
        {slugChanged ? (
          <p role="status" className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-800">
            Links to this course anchor will change: any old link ending in #{savedCourse?.slug} will stop scrolling to it.
          </p>
        ) : null}
      </div>
      <Area path={`${base}.description`} label="Short description" required rows={3} maxLength={220} />
      <Text path={`${base}.vehicle`} label="Vehicle name" required maxLength={60} placeholder="WagonR" />
      <Img path={`${base}.image`} altPath={`${base}.imageAlt`} label="Course image" kind="courses" folder="courses" required hint="Landscape photo, at least 800 px wide, showing the whole car." />
      <div>
        <p className="mb-2 text-sm font-medium text-ink">Features (the green tick points, 1 to 6)</p>
        <List path={`${base}.features`} noun="feature" min={1} max={6} createItem={() => ''} itemLabel={(v, i) => String(v || `Feature ${i + 1}`)}>
          {(fbase) => <Text path={fbase} label="Feature" required maxLength={80} />}
        </List>
      </div>
      <Switch path={`${base}.published`} label="Published" hint="Hidden courses are saved but not shown on the website." />

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Preview (as it looks on the Courses page)</p>
        <div className="rounded-2xl border border-line bg-cream p-3">
          {/* inert: the preview is for looking at, its link must not be reachable by keyboard */}
          <div inert>
            <CourseCard course={course} phone={PREVIEW_PHONE} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 2: everything else on the page                                   */
/* ------------------------------------------------------------------ */

function PageContentTab() {
  return (
    <>
      <Section accordion title="Banner" summary="Title, subtitle and photo at the top of the page" paths={['hero']}>
        <Text path="hero.title" label="Title" required maxLength={120} />
        <Area path="hero.subtitle" label="Subtitle" required rows={2} maxLength={300} />
        <Img path="hero.image" altPath="hero.imageAlt" label="Banner image" />
      </Section>

      <Section accordion title="Heading above the courses" summary="Short heading and sentence before the course cards" paths={['intro']}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Text path="intro.lead" label="Title (first part)" required maxLength={60} />
          <Text path="intro.highlight" label="Highlighted words (orange)" required maxLength={60} />
        </div>
        <Area path="intro.subtitle" label="Subtitle" required rows={2} maxLength={300} />
      </Section>

      <Section accordion title="What is included" summary="The row of small tiles (3 to 6)" paths={['includedTitle', 'included']}>
        <Text path="includedTitle" label="Section title" required maxLength={80} />
        <List path="included" noun="tile" min={3} max={6} createItem={() => ({ icon: 'star', title: '' })} itemLabel={(v) => String((v as { title?: string }).title || 'New tile')}>
          {(base) => (
            <>
              <Icons path={`${base}.icon`} label="Icon" />
              <Text path={`${base}.title`} label="Title" required maxLength={120} />
            </>
          )}
        </List>
      </Section>

      <Section accordion title="Bottom banner" summary="The call-to-action strip at the end of the page" paths={['cta']}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Text path="cta.lead" label="Title (first part)" required maxLength={80} />
          <Text path="cta.highlight" label="Highlighted words (orange)" required maxLength={60} />
        </div>
        <Area path="cta.text" label="Text" required rows={2} maxLength={300} />
      </Section>

      <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900">
        The Training Highlights block is not shown on the Courses page any more, so it is not editable here. Its saved text is kept as it is.
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* The page                                                             */
/* ------------------------------------------------------------------ */

function AddCourseButton({ onAdd }: { onAdd: (index: number) => void }) {
  const { list, setList } = useCourseList();
  return (
    <Button
      size="sm"
      disabled={list.length >= MAX_COURSES}
      onClick={() => {
        setList([...list, newCourse(list)]);
        onAdd(list.length);
      }}
      icon={<Plus className="size-4" aria-hidden="true" />}
    >
      Add course
    </Button>
  );
}

function DrawerHost({ editing, setEditing }: { editing: Editing | null; setEditing: (e: Editing | null) => void }) {
  const { ed, list, setList } = useCourseList();
  const course = editing ? list[editing.index] : undefined;

  function cancel() {
    if (!editing) return;
    if (editing.snapshot === null) setList(list.filter((_, i) => i !== editing.index));
    else ed.set(`courses.${editing.index}`, editing.snapshot);
    setEditing(null);
  }

  return (
    <Drawer
      open={Boolean(editing && course)}
      title={editing?.snapshot === null ? 'Add course' : `Edit course`}
      description={course?.title || 'New course'}
      onCancel={cancel}
      onDone={() => setEditing(null)}
    >
      {/* remounted per course so the "slug follows title" state starts fresh */}
      {editing && course ? <CourseDrawerBody key={course.id} index={editing.index} isNew={editing.snapshot === null} /> : null}
    </Drawer>
  );
}

function CoursesInner({ editing, setEditing }: { editing: Editing | null; setEditing: (e: Editing | null) => void }) {
  const { list } = useCourseList();
  const open = (index: number) => setEditing({ index, snapshot: structuredClone(list[index]) });
  return (
    <>
      <Tabs
        tabs={[
          { label: 'Courses', content: <CoursesTab onEdit={open} /> },
          { label: 'Page content', content: <PageContentTab /> },
        ]}
      />
      <DrawerHost editing={editing} setEditing={setEditing} />
    </>
  );
}

export function CoursesEditor(): ReactNode {
  const [editing, setEditing] = useState<Editing | null>(null);
  return (
    <ContentEditor
      name="courses"
      title="Courses"
      description="Add, reorder, hide and edit your courses, and the text around them on the Courses page. One Save changes updates everything."
      previewPath="/courses"
      headerActions={<AddCourseButton onAdd={(index) => setEditing({ index, snapshot: null })} />}
    >
      <CoursesInner editing={editing} setEditing={setEditing} />
    </ContentEditor>
  );
}
