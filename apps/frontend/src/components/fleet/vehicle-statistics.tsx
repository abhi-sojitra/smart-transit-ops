'use client';

import {
  Truck,
  CheckCircle,
  Route,
  Wrench,
  Archive,
  AlertTriangle,
  Gauge,
  CalendarClock,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSafeReducedMotion } from '@/hooks/use-safe-reduced-motion';
import { StatCard, type StatCardTone } from '@/components/charts/stat-card';
import { staggerContainer, staggerItem } from '@/components/fleet/motion';
import type { VehicleStatistics } from '@/types/fleet';

interface VehicleStatisticsProps {
  statistics?: VehicleStatistics;
  loading?: boolean;
}

export function VehicleStatisticsCards({ statistics, loading }: VehicleStatisticsProps) {
  const reduceMotion = useSafeReducedMotion();
  const insuranceExpiring = statistics?.insuranceExpiring ?? 0;
  const serviceDueSoon = statistics?.serviceDueSoon ?? 0;

  const cards: Array<{
    title: string;
    value: string | number;
    icon: LucideIcon;
    tone: StatCardTone;
    hint?: string;
  }> = [
    {
      title: 'Total Vehicles',
      value: statistics?.totalVehicles ?? 0,
      icon: Truck,
      tone: 'primary',
      hint: 'Fleet',
    },
    {
      title: 'Available',
      value: statistics?.available ?? 0,
      icon: CheckCircle,
      tone: 'success',
      hint: 'Ready',
    },
    {
      title: 'On Trip',
      value: statistics?.onTrip ?? 0,
      icon: Route,
      tone: 'info',
      hint: 'Active',
    },
    {
      title: 'Maintenance',
      value: statistics?.maintenance ?? 0,
      icon: Wrench,
      tone: 'warning',
      hint: 'Service',
    },
    {
      title: 'Retired',
      value: statistics?.retired ?? 0,
      icon: Archive,
      tone: 'neutral',
      hint: 'Inactive',
    },
    {
      title: 'Insurance Due',
      value: insuranceExpiring,
      icon: AlertTriangle,
      tone: insuranceExpiring > 0 ? 'warning' : 'success',
      hint: insuranceExpiring > 0 ? 'Renew' : 'Valid',
    },
    {
      title: 'Service Due',
      value: serviceDueSoon,
      icon: CalendarClock,
      tone: serviceDueSoon > 0 ? 'warning' : 'success',
      hint: serviceDueSoon > 0 ? 'Schedule' : 'OK',
    },
    {
      title: 'Avg Mileage',
      value: statistics
        ? Math.round(statistics.averageMileage).toLocaleString('en-US')
        : '—',
      icon: Gauge,
      tone: 'neutral',
      hint: 'km',
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      {cards.map((card) => (
        <motion.div key={card.title} variants={staggerItem} className="h-full min-w-0">
          <StatCard
            title={card.title}
            value={card.value}
            icon={card.icon}
            loading={loading}
            tone={card.tone}
            hint={card.hint}
            size="compact"
            className="h-full"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
