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
              'inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-primary/15 font-medium text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
