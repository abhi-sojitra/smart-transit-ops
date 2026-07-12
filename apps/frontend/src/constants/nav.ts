import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
} from 'lucide-react';

export const APP_NAME = 'TransitOps';

export const NAV_ITEMS = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Fleet', href: '/fleet', icon: Truck },
  { title: 'Drivers', href: '/drivers', icon: Users },
  { title: 'Trips & Dispatch', href: '/trips', icon: Route },
  { title: 'Maintenance', href: '/maintenance', icon: Wrench },
  { title: 'Fuel & Expense', href: '/fuel-expenses', icon: Fuel },
  { title: 'Analytics', href: '/analytics', icon: BarChart3 },
  { title: 'Settings', href: '/settings', icon: Settings },
] as const;
