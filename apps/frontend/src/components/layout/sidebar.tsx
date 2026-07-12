'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NAV_ITEMS, APP_NAME } from '@/constants/nav';
import { useUiStore } from '@/store';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex',
        className,
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
        {!sidebarCollapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
              T
            </span>
            {APP_NAME}
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground"
          >
            T
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(sidebarCollapsed && 'hidden')}
          onClick={toggleSidebar}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {sidebarCollapsed ? (
        <div className="flex justify-center py-2">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Expand sidebar">
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-sidebar-foreground/80 hover:bg-muted hover:text-foreground',
                sidebarCollapsed && 'justify-center px-2',
              )}
              title={item.title}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed ? <span>{item.title}</span> : null}
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}
