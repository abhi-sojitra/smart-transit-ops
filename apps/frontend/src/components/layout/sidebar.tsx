'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { APP_NAME } from '@/constants/nav';
import { useUiStore } from '@/store';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { SidebarNavList } from '@/components/layout/sidebar-nav-list';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'hidden h-full max-h-dvh shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex',
        className,
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-3">
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
        <div className="flex shrink-0 justify-center py-2">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Expand sidebar">
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <SidebarNavList onNavigate={onNavigate} collapsed={sidebarCollapsed} />
    </motion.aside>
  );
}
