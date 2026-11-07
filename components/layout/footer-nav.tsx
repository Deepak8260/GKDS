'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, isActivePath } from '@/lib/nav';
import { cn } from '@/lib/utils';

/** Footer links; the active page is shown in orange. */
export function FooterNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Footer" className="w-full lg:w-auto">
      <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'focus-ring rounded-md py-1 text-[15px] font-medium transition-colors hover:text-orange-500',
                  active ? 'text-orange-500' : 'text-white',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
