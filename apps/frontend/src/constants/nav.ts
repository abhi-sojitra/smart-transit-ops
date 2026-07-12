import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  Receipt,
} from 'lucide-react';

export const APP_NAME = 'TransitOps';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
};

export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Fleet', href: '/fleet', icon: Truck },
  { title: 'Drivers', href: '/drivers', icon: Users },
  { title: 'Trips & Dispatch', href: '/trips', icon: Route },
  { title: 'Maintenance', href: '/maintenance', icon: Wrench },
  {
    title: 'Fuel & Expense',
    href: '/fuel-expenses',
    icon: Fuel,
    children: [
      { title: 'Fuel Logs', href: '/fuel', icon: Fuel },
      { title: 'Expenses', href: '/expenses', icon: Receipt },
      { title: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  { title: 'Settings', href: '/settings', icon: Settings },
];

export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavSectionActive(pathname: string, item: NavItem) {
  if (isNavActive(pathname, item.href)) return true;
  return item.children?.some((child) => isNavActive(pathname, child.href)) ?? false;
}
