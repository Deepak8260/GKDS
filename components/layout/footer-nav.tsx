'use client';

import { LocLink as Link } from '@/components/i18n/loc-link';
import { usePathname } from 'next/navigation';
import type { Dict } from '@/lib/i18n/dict';
import { NAV_ITEMS, isActivePath } from '@/lib/nav';
import { cn } from '@/lib/utils';

/** Footer links; the active page is shown in orange. */
export function FooterNav({ t }: { t: Dict['nav'] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={t.footer} className="w-full lg:w-auto">
      <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-0">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'focus-ring inline-flex min-h-11 items-center rounded-md px-1 text-[14px] font-medium transition-colors hover:text-orange-300',
                  active ? 'text-orange-300' : 'text-white',
                )}
              >
                {t[item.id]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
