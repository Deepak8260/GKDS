'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, Menu, Phone, X } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/custom-icons';
import { Button } from '@/components/ui/button';
import { NAV_ITEMS, isActivePath } from '@/lib/nav';
import { cn, telHref, whatsappHref } from '@/lib/utils';
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';
import { useScrollLock } from '@/lib/hooks/use-scroll-lock';
import type { NavCourse } from './desktop-nav';
import type { ReactNode } from 'react';

interface MobileNavProps {
  courses: NavCourse[];
  phone: string;
  whatsapp: string;
  whatsappMessage?: string;
  /** Pre-rendered <RegdBadge/> (server component) */
  badge: ReactNode;
}

/** Hamburger + slide-over menu (below lg). */
export function MobileNav({ courses, phone, whatsapp, whatsappMessage, badge }: MobileNavProps) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const panelRef = useRef<HTMLDivElement>(null);

  // close the menu when the route changes (state adjusted during render, not in an effect)
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useScrollLock(open);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const dur = reduce ? 0 : 0.25;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
        className="focus-ring flex size-11 items-center justify-center rounded-full text-green-900 hover:bg-green-50"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[90]">
            <motion.div
              className="absolute inset-0 bg-green-950/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              id="mobile-menu"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              tabIndex={-1}
              className="absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col bg-white shadow-card-lg"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: dur, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <span className="font-display text-lg font-bold italic text-green-900">Menu</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  data-autofocus
                  onClick={() => setOpen(false)}
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
                      active ? 'bg-orange-50 text-orange-600' : 'text-green-900 hover:bg-green-50',
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
                              <ChevronDown className={cn('size-5 transition-transform', coursesOpen && 'rotate-180')} aria-hidden="true" />
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
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
