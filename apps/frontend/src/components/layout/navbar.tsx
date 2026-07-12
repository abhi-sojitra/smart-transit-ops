'use client';

import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { AvatarMenu } from '@/components/layout/avatar-menu';
import { useUiStore } from '@/store';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { SidebarNavMobile } from '@/components/layout/sidebar-nav-mobile';

export function Navbar() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <SearchInput
          placeholder="Search fleet, drivers, trips..."
          containerClassName="hidden max-w-md flex-1 sm:block"
          aria-label="Global search"
        />

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <AvatarMenu />
        </div>
      </header>

      <Drawer open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <DrawerContent>
          <SidebarNavMobile onNavigate={() => setMobileSidebarOpen(false)} />
        </DrawerContent>
      </Drawer>
    </>
  );
}
