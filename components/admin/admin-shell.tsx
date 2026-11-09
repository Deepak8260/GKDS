'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ExternalLink, LogOut, Menu, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';
import { useScrollLock } from '@/lib/hooks/use-scroll-lock';
import { cn } from '@/lib/utils';
import { adminFetch, useAdminBase } from './admin-client';
import { ConfirmProvider } from './confirm';
import { DirtyGuardProvider, useDirtyGuardApi } from './dirty-guard';
import { ADMIN_NAV } from './nav';

interface AdminShellProps {
  children: ReactNode;
  logo: string;
}

export function AdminShell(props: AdminShellProps) {
  return (
    <DirtyGuardProvider>
      <ConfirmProvider>
        <Shell {...props} />
      </ConfirmProvider>
    </DirtyGuardProvider>
  );
}

function Shell({ children, logo }: AdminShellProps) {
  const base = useAdminBase();
  const pathname = usePathname() ?? base;
  const router = useRouter();
  const toast = useToast();
  const guard = useDirtyGuardApi();
  const [drawer, setDrawer] = useState(false);
  const [health, setHealth] = useState<'unknown' | 'ok' | 'bad'>('unknown');
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useScrollLock(drawer);
  useFocusTrap(drawerRef, drawer);

  // GitHub connection dot (green = OK)
  useEffect(() => {
    let cancelled = false;
    adminFetch<{ connected?: boolean }>('/api/admin/health').then((r) => {
      if (!cancelled) setHealth(r.ok && r.data.connected ? 'ok' : 'bad');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawer(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  const current =
    ADMIN_NAV.slice()
      .reverse()
      .find((item) => {
        const href = `${base}${item.path}`;
        return item.path === '' ? pathname === href || pathname === `${href}/` : pathname === href || pathname.startsWith(`${href}/`);
      }) ?? ADMIN_NAV[0];

  const go = useCallback(
    (e: React.MouseEvent) => {
      // let the browser handle modified clicks / new tabs
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (!guard.confirmLeave()) e.preventDefault();
      else setDrawer(false);
    },
    [guard],
  );

  async function logout() {
    if (!guard.confirmLeave()) return;
    const r = await adminFetch('/api/admin/logout', { method: 'POST', body: {} });
    if (!r.ok) {
      toast.error('Could not sign out. Please try again.');
      return;
    }
    router.replace(`${base}/login`);
    router.refresh();
  }

  const nav = (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {ADMIN_NAV.map((item) => {
          const href = `${base}${item.path}`;
          const active = item.path === current.path;
          const Icon = item.icon;
          return (
            <li key={item.path || 'dashboard'}>
              <Link
                href={href}
                onClick={go}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'focus-ring relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors',
                  active ? 'bg-orange-50 text-orange-700' : 'text-ink/80 hover:bg-green-50',
                )}
              >
                {active ? <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-orange-500" /> : null}
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const sidebarBody = (
    <>
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Image src={logo} alt="" width={64} height={64} className="size-10 object-contain" />
        <div className="leading-tight">
          <p className="font-display text-lg font-bold italic text-green-900">Gopal Krushna</p>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Admin Panel</p>
        </div>
      </div>
      {nav}
      <div className="space-y-1 border-t border-line p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring flex min-h-11 items-center gap-3 rounded-lg px-3 text-[14px] font-medium text-ink/80 hover:bg-green-50"
        >
          <ExternalLink className="size-5" aria-hidden="true" />
          View website <span className="sr-only">(opens in a new tab)</span>
        </a>
        <button
          type="button"
          onClick={logout}
          className="focus-ring flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] font-medium text-ink/80 hover:bg-green-50"
        >
          <LogOut className="size-5" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-cream text-ink">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[120] focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-line bg-white lg:flex">{sidebarBody}</aside>

      {/* mobile drawer */}
      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div ref={drawerRef} role="dialog" aria-modal="true" aria-label="Admin menu" className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-white shadow-card-lg">
            <button
              type="button"
              onClick={() => {
                setDrawer(false);
                menuButton.current?.focus();
              }}
              aria-label="Close menu"
              className="focus-ring absolute right-2 top-2 rounded-full p-2 text-muted hover:text-ink"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            {sidebarBody}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            ref={menuButton}
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            aria-expanded={drawer}
            className="focus-ring -ml-2 rounded-lg p-2.5 text-green-900 lg:hidden"
          >
            <Menu className="size-6" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted">
              Admin <span aria-hidden="true">›</span> {current.label}
            </p>
            <p className="truncate font-display text-xl font-bold text-green-900">{current.title}</p>
          </div>
          <span
            role="status"
            title={health === 'ok' ? 'GitHub connected' : health === 'bad' ? 'GitHub not connected – see Dashboard' : 'Checking GitHub…'}
            className="flex items-center gap-1.5 text-xs text-muted"
          >
            <span
              aria-hidden="true"
              className={cn('size-2.5 rounded-full', health === 'ok' ? 'bg-green-600' : health === 'bad' ? 'bg-red-500' : 'bg-muted/50')}
            />
            <span className="hidden sm:inline">{health === 'ok' ? 'GitHub connected' : health === 'bad' ? 'GitHub not connected' : 'Checking…'}</span>
            <span className="sr-only sm:hidden">{health === 'ok' ? 'GitHub connected' : health === 'bad' ? 'GitHub not connected' : 'Checking GitHub'}</span>
          </span>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring hidden min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-green-800 hover:bg-green-50 md:inline-flex"
          >
            View website <ExternalLink className="size-4" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <button
            type="button"
            onClick={logout}
            className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-green-800 hover:bg-green-50"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Logout</span>
            <span className="sr-only sm:hidden">Logout</span>
          </button>
        </header>

        <main id="admin-main" className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
