'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import {
  NAV_ITEMS,
  isNavActive,
  isNavSectionActive,
  type NavItem,
} from '@/constants/nav';
import { cn } from '@/utils/cn';

function childLinkClass(active: boolean, nested: boolean) {
  return cn(
    'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
    nested ? 'py-2 pl-4 pr-3' : 'px-3 py-2.5',
    active
      ? 'bg-primary/15 text-primary'
      : 'text-sidebar-foreground/80 hover:bg-muted hover:text-foreground',
  );
}

function NavChildren({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="ml-5 space-y-0.5 border-l border-border/70">
      {item.children!.map((child, index) => {
        const ChildIcon = child.icon;
        const active = isNavActive(pathname, child.href);
        return (
          <motion.div
            key={child.href}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, delay: index * 0.04, ease: 'easeOut' }}
          >
            <Link
              href={child.href}
              onClick={onNavigate}
              className={childLinkClass(active, true)}
            >
              <ChildIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{child.title}</span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

function ExpandableNavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const sectionActive = isNavSectionActive(pathname, item);
  const parentActive = isNavActive(pathname, item.href);
  const [open, setOpen] = useState(sectionActive);

  useEffect(() => {
    if (sectionActive) setOpen(true);
  }, [sectionActive, pathname]);

  const Icon = item.icon;

  return (
    <div className="space-y-0.5">
      <div
        className={cn(
          'flex items-center rounded-lg transition-colors',
          parentActive
            ? 'bg-primary/15 text-primary'
            : 'text-sidebar-foreground/80 hover:bg-muted hover:text-foreground',
        )}
      >
        <Link
          href={item.href}
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium"
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.title}</span>
        </Link>
        <button
          type="button"
          aria-label={open ? `Collapse ${item.title}` : `Expand ${item.title}`}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="mr-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-black/5"
        >
          <motion.span
            animate={{ rotate: open ? 0 : -90 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="inline-flex"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <NavChildren item={item} pathname={pathname} onNavigate={onNavigate} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function SidebarNavList({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'space-y-1',
        !collapsed && 'min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-2',
      )}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const sectionActive = isNavSectionActive(pathname, item);
        const hasChildren = Boolean(item.children?.length);

        if (collapsed) {
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium transition-colors',
                sectionActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-sidebar-foreground/80 hover:bg-muted hover:text-foreground',
              )}
              title={item.title}
            >
              <Icon className="h-4 w-4 shrink-0" />
            </Link>
          );
        }

        if (hasChildren) {
          return (
            <ExpandableNavItem
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          );
        }

        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={childLinkClass(active, false)}
            title={item.title}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
