import { stripLocale } from '@/lib/i18n/locales';

export type NavId = 'home' | 'about' | 'courses' | 'gallery' | 'reviews' | 'contact';

export interface NavItem {
  /** Key of the label in the dictionary (`t.nav[id]`). */
  id: NavId;
  href: string;
  /** Items with children render the Courses dropdown. */
  hasDropdown?: boolean;
}

/** Primary navigation order is fixed (see CONTEXT BLOCK §7). */
export const NAV_ITEMS: NavItem[] = [
  { id: 'home', href: '/' },
  { id: 'about', href: '/about' },
  { id: 'courses', href: '/courses', hasDropdown: true },
  { id: 'gallery', href: '/gallery' },
  { id: 'reviews', href: '/reviews' },
  { id: 'contact', href: '/contact' },
];

/** Is `href` the page being shown (or a page below it)? Works for both languages: "/or/about" counts as "/about". */
export function isActivePath(pathname: string, href: string) {
  const path = stripLocale(pathname);
  if (href === '/') return path === '/';
  return path === href || path.startsWith(`${href}/`);
}
