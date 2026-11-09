import {
  CircleHelp,
  Car,
  FolderOpen,
  House,
  Images,
  Info,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Star,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  /** Path under the admin prefix ('' = dashboard). */
  path: string;
  label: string;
  title: string;
  icon: LucideIcon;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { path: '', label: 'Dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { path: '/settings', label: 'Site Settings', title: 'Site Settings', icon: Settings },
  { path: '/home', label: 'Home Page', title: 'Home Page', icon: House },
  { path: '/about', label: 'About Page', title: 'About Page', icon: Info },
  { path: '/courses', label: 'Courses', title: 'Courses', icon: Car },
  { path: '/gallery', label: 'Gallery', title: 'Gallery', icon: Images },
  { path: '/media', label: 'Media Library', title: 'Media Library', icon: FolderOpen },
  { path: '/reviews', label: 'Reviews', title: 'Reviews', icon: Star },
  { path: '/security', label: 'Security', title: 'Security', icon: ShieldCheck },
  { path: '/help', label: 'Help', title: 'Help', icon: CircleHelp },
];
