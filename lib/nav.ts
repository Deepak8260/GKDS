export interface NavItem {
  label: string;
  href: string;
  /** Items with children render the Courses dropdown. */
  hasDropdown?: boolean;
}

/** Primary navigation order is fixed (see CONTEXT BLOCK §7). */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Courses', href: '/courses', hasDropdown: true },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Contact', href: '/contact' },
];

export function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
