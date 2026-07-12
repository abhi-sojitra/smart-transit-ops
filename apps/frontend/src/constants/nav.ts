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
  FileText,
} from 'lucide-react';

export const APP_NAME = 'TransitOps';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Any of these permission codes grants access (VIEW-level). */
  permissions?: string[];
  children?: NavItem[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permissions: ['DASHBOARD:VIEW'],
  },
  {
    title: 'Fleet',
    href: '/fleet',
    icon: Truck,
    permissions: ['VEHICLE:VIEW'],
  },
  {
    title: 'Drivers',
    href: '/drivers',
    icon: Users,
    permissions: ['DRIVER:VIEW'],
  },
  {
    title: 'Trips & Dispatch',
    href: '/trips',
    icon: Route,
    permissions: ['TRIP:VIEW'],
  },
  {
    title: 'Maintenance',
    href: '/maintenance',
    icon: Wrench,
    permissions: ['MAINTENANCE:VIEW'],
  },
  {
    title: 'Fuel & Expense',
    href: '/fuel-expenses',
    icon: Fuel,
    permissions: ['FUEL:VIEW', 'EXPENSE:VIEW'],
    children: [
      { title: 'Fuel Logs', href: '/fuel', icon: Fuel, permissions: ['FUEL:VIEW'] },
      {
        title: 'Expenses',
        href: '/expenses',
        icon: Receipt,
        permissions: ['EXPENSE:VIEW'],
      },
    ],
  },
{
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    permissions: ['DASHBOARD:VIEW', 'REPORTS:VIEW'],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileText,
    permissions: ['REPORTS:VIEW'],
    children: [
      { title: 'Overview', href: '/reports', icon: FileText, permissions: ['REPORTS:VIEW'] },
      { title: 'Executive', href: '/reports/executive', icon: FileText, permissions: ['REPORTS:VIEW'] },
      { title: 'Fleet', href: '/reports/fleet', icon: Truck, permissions: ['REPORTS:VIEW'] },
      { title: 'Drivers', href: '/reports/drivers', icon: Users, permissions: ['REPORTS:VIEW'] },
      { title: 'Vehicles', href: '/reports/vehicles', icon: Truck, permissions: ['REPORTS:VIEW'] },
      { title: 'Trips', href: '/reports/trips', icon: Route, permissions: ['REPORTS:VIEW'] },
      { title: 'Maintenance', href: '/reports/maintenance', icon: Wrench, permissions: ['REPORTS:VIEW'] },
      { title: 'Fuel', href: '/reports/fuel', icon: Fuel, permissions: ['REPORTS:VIEW'] },
      { title: 'Expenses', href: '/reports/expenses', icon: Receipt, permissions: ['REPORTS:VIEW'] },
      { title: 'Financial', href: '/reports/financial', icon: BarChart3, permissions: ['REPORTS:VIEW'] },
      { title: 'Profitability', href: '/reports/profitability', icon: BarChart3, permissions: ['REPORTS:VIEW'] },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    permissions: ['SETTINGS:VIEW', 'USERS:VIEW', 'ROLES:VIEW', 'PERMISSIONS:VIEW'],
  },
];

export function hasAnyPermission(
  granted: string[] | undefined,
  required?: string[],
): boolean {
  if (!required?.length) return true;
  if (!granted?.length) return false;
  if (granted.includes('*')) return true;
  return required.some((code) => granted.includes(code));
}

/** Keep only nav items the user is allowed to see. */
export function filterNavByPermissions(
  items: NavItem[],
  granted: string[] | undefined,
): NavItem[] {
  return items
    .map((item) => {
      const children = item.children
        ? filterNavByPermissions(item.children, granted)
        : undefined;
      const selfAllowed = hasAnyPermission(granted, item.permissions);
      if (children?.length) {
        return { ...item, children };
      }
      if (selfAllowed) {
        return children ? { ...item, children } : item;
      }
      return null;
    })
    .filter((item): item is NavItem => item !== null);
}

export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavSectionActive(pathname: string, item: NavItem) {
  if (isNavActive(pathname, item.href)) return true;
  return item.children?.some((child) => isNavActive(pathname, child.href)) ?? false;
}
