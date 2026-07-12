'use client';

import { APP_NAME } from '@/constants/nav';
import { SidebarNavList } from '@/components/layout/sidebar-nav-list';

export function SidebarNavMobile({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2 border-b border-sidebar-border pb-4 font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
          T
        </span>
        {APP_NAME}
      </div>
      <SidebarNavList onNavigate={onNavigate} />
    </div>
  );
}
