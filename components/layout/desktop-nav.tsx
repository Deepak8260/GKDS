'use client';

import { LocLink as Link } from '@/components/i18n/loc-link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Dict } from '@/lib/i18n/dict';
import { NAV_ITEMS, isActivePath } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/lib/hooks/use-click-outside';

export interface NavCourse {
  title: string;
  slug: string;
}

const linkBase =
  'focus-ring relative inline-flex items-center rounded-md py-2 text-[16px] font-medium transition-colors hover:text-orange-600';
const underline =
  'after:absolute after:inset-x-0 after:-bottom-[7px] after:h-[3px] after:rounded-full after:bg-orange-500 after:content-[""]';

function CoursesMenu({ courses, active, t }: { courses: NavCourse[]; active: boolean; t: Dict['nav'] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const timer = useRef<number | undefined>(undefined);

  // close the dropdown when the route changes (adjusted during render, not in an effect)
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(wrapRef, close, open);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []);

  function focusItem(index: number) {
    const list = items();
    if (list.length === 0) return;
    list[(index + list.length) % list.length].focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        requestAnimationFrame(() => focusItem(0));
      } else {
        focusItem(index + 1);
      }
    } else if (e.key === 'ArrowUp' && open) {
      e.preventDefault();
      focusItem(index <= 0 ? list.length - 1 : index - 1);
    } else if (e.key === 'Home' && open && index >= 0) {
      e.preventDefault();
      focusItem(0);
    } else if (e.key === 'End' && open && index >= 0) {
      e.preventDefault();
      focusItem(list.length - 1);
    }
  }

  return (
    <div
      ref={wrapRef}
      className="relative"
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return;
        window.clearTimeout(timer.current);
        setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'mouse') return;
        timer.current = window.setTimeout(() => setOpen(false), 140);
      }}
    >
      <div className={cn('relative inline-flex items-center gap-0.5', active ? 'text-orange-600' : 'text-green-900')}>
        <Link
          href="/courses"
          aria-current={active ? 'page' : undefined}
          className={cn(linkBase, 'hover:text-orange-600')}
        >
          {t.courses}
        </Link>
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t.coursesMenu}
          onClick={() => setOpen((v) => !v)}
          className="focus-ring -ml-1 flex size-8 items-center justify-center rounded-full hover:text-orange-600"
        >
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>
        {active ? <span aria-hidden="true" className="absolute inset-x-0 -bottom-[7px] h-[3px] rounded-full bg-orange-500" /> : null}
      </div>

      {open ? (
        <ul
          ref={menuRef}
          role="menu"
          aria-label={t.courses}
          className="absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 animate-fade-up rounded-xl border border-line bg-white p-2 shadow-card-lg"
        >
          {courses.map((c) => (
            <li key={c.slug} role="none">
              <Link
                role="menuitem"
                href={`/courses#${c.slug}`}
                className="focus-ring block rounded-lg px-3 py-2.5 text-[15px] font-medium text-green-900 hover:bg-orange-50 hover:text-orange-600"
              >
                {c.title}
              </Link>
            </li>
          ))}
          <li role="none" className="mt-1 border-t border-line pt-1">
            <Link
              role="menuitem"
              href="/courses"
              className="focus-ring block rounded-lg px-3 py-2.5 text-[15px] font-semibold text-orange-600 hover:bg-orange-50"
            >
              {t.allCourses}
            </Link>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

/** Desktop primary navigation (≥ lg) with the Courses dropdown. */
export function DesktopNav({ courses, t }: { courses: NavCourse[]; t: Dict['nav'] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={t.primary} className="hidden items-center gap-7 xl:gap-11 lg:flex">
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href);
        if (item.hasDropdown) {
          return <CoursesMenu key={item.href} courses={courses} active={active} t={t} />;
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(linkBase, active ? ['text-orange-600', underline] : 'text-green-900')}
          >
            {t[item.id]}
          </Link>
        );
      })}
    </nav>
  );
}
