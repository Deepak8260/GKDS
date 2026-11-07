'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Menu, Phone, X } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/custom-icons';
import { Button } from '@/components/ui/button';
import { NAV_ITEMS, isActivePath } from '@/lib/nav';
import { cn, telHref, whatsappHref } from '@/lib/utils';
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';
import { useScrollLock } from '@/lib/hooks/use-scroll-lock';
import type { NavCourse } from './desktop-nav';

interface MobileNavProps {
  courses: NavCourse[];
  phone: string;
  whatsapp: string;
  whatsappMessage?: string;
  /** Pre-rendered <RegdBadge/> (server component) */
  badge: ReactNode;
}

type Phase = 'closed' | 'open' | 'closing';

/** Hamburger + slide-over menu (below lg). CSS animations only (no animation library). */
export function MobileNav({ courses, phone, whatsapp, whatsappMessage, badge }: MobileNavProps) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('closed');
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const panelRef = useRef<HTMLDivElement>(null);

  // close the menu when the route changes (state adjusted during render, not in an effect)
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setPhase('closed');
  }

  const close = useCallback(() => setPhase((p) => (p === 'open' ? 'closing' : p)), []);
  const visible = phase !== 'closed';

  useScrollLock(visible);
  useFocusTrap(panelRef, phase === 'open');

  useEffect(() => {
    if (phase !== 'open') return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase, close]);

  const closing = phase === 'closing';

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={phase === 'open'}
        aria-controls="mobile-menu"
        onClick={() => setPhase('open')}
        className="focus-ring flex size-11 items-center justify-center rounded-full text-green-900 hover:bg-green-50"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>

      {visible ? (
        <div className="fixed inset-0 z-[90]">
          <div
            className={cn('absolute inset-0 bg-green-950/60', closing ? 'animate-fade-out' : 'animate-fade-in')}
            onClick={close}
            aria-hidden="true"
          />
          <div
            id="mobile-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            tabIndex={-1}
            onAnimationEnd={(e) => {
              if (closing && e.target === e.currentTarget) setPhase('closed');
            }}
            className={cn(
              'absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col bg-white shadow-card-lg',
              closing ? 'animate-slide-out' : 'animate-slide-in',
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <span className="font-display text-lg font-bold italic text-green-900">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                data-autofocus
                onClick={close}
                className="focus-ring flex size-11 items-center justify-center rounded-full text-ink hover:bg-green-50"
              >
                <X className="size-6" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-3">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const row = cn(
                    'focus-ring flex min-h-12 flex-1 items-center rounded-xl px-4 text-[17px] font-semibold',
                    active ? 'bg-orange-50 text-orange-700' : 'text-green-900 hover:bg-green-50',
                  );
                  if (item.hasDropdown) {
                    return (
                      <li key={item.href}>
                        <div className="flex items-center">
                          <Link href={item.href} aria-current={active ? 'page' : undefined} className={row}>
                            {item.label}
                          </Link>
                          <button
                            type="button"
                            aria-label="Toggle courses list"
                            aria-expanded={coursesOpen}
                            onClick={() => setCoursesOpen((v) => !v)}
                            className="focus-ring flex size-12 shrink-0 items-center justify-center rounded-xl text-green-900 hover:bg-green-50"
                          >
                            <ChevronDown
                              className={cn('size-5 transition-transform', coursesOpen && 'rotate-180')}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                        {coursesOpen ? (
                          <ul className="ml-4 mt-1 space-y-1 border-l-2 border-orange-100 pl-3">
                            {courses.map((c) => (
                              <li key={c.slug}>
                                <Link
                                  href={`/courses#${c.slug}`}
                                  className="focus-ring flex min-h-11 items-center rounded-lg px-3 text-[15px] font-medium text-ink hover:bg-green-50"
                                >
                                  {c.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  }
                  return (
                    <li key={item.href}>
                      <Link href={item.href} aria-current={active ? 'page' : undefined} className={row}>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="space-y-3 border-t border-line px-5 py-4">
              <Button href={telHref(phone)} icon={<Phone className="size-5" aria-hidden="true" />} className="w-full">
                Call Now
              </Button>
              <Button
                href={whatsappHref(whatsapp, whatsappMessage)}
                variant="secondary"
                tone="green"
                icon={<WhatsappIcon size={20} className="text-whatsapp" />}
                className="w-full"
              >
                WhatsApp
              </Button>
              <div className="pt-1">{badge}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
