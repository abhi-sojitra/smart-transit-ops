'use client';

import Link from 'next/link';
import {
  Fuel,
  Route,
  Truck,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const actions = [
  { href: '/trips/new', label: 'Trip', icon: Route },
  { href: '/fleet', label: 'Vehicle', icon: Truck },
  { href: '/drivers/new', label: 'Driver', icon: Users },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/fuel/new', label: 'Fuel', icon: Fuel },
  { href: '/expenses/new', label: 'Expense', icon: Wallet },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium text-muted-foreground">Quick add</span>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button key={action.href} variant="outline" size="sm" className="h-8 gap-1.5" asChild>
            <Link href={action.href}>
              <Icon className="h-3.5 w-3.5 text-primary" />
              {action.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
