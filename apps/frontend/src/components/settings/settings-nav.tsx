'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Bell,
  Building2,
  KeyRound,
  LayoutDashboard,
  Palette,
  ScrollText,
  Shield,
  UserCircle,
  Users,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const LINKS = [
  { href: '/settings', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/settings/company', label: 'Company', icon: Building2 },
  { href: '/settings/users', label: 'Users', icon: Users },
  { href: '/settings/roles', label: 'Roles', icon: Shield },
  { href: '/settings/permissions', label: 'Permissions', icon: KeyRound },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings/security', label: 'Security', icon: Shield },
  { href: '/settings/appearance', label: 'Appearance', icon: Palette },
  { href: '/settings/audit', label: 'Audit Logs', icon: ScrollText },
  { href: '/settings/activity', label: 'Activity', icon: Activity },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {LINKS.map((link) => {
        const Icon = link.icon;
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'inline-flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-semibold leading-snug transition-colors',
              active
                ? 'bg-amber-100 text-slate-950 dark:bg-amber-950/60 dark:text-amber-100'
                : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-white',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
