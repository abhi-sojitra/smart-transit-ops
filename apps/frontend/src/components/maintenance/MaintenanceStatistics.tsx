'use client';

import {
  AlertTriangle,
  Clock3,
  DollarSign,
  Timer,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { StatCard, type StatCardTone } from '@/components/charts/stat-card';
import { staggerContainer, staggerItem } from '@/components/drivers/motion';
import type { MaintenanceStatistics } from '@/types/maintenance';

interface MaintenanceStatisticsProps {
  stats?: MaintenanceStatistics;
  loading?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function MaintenanceStatisticsCards({ stats, loading }: MaintenanceStatisticsProps) {
  const reduceMotion = useReducedMotion();
  const overdue = stats?.overdue ?? 0;
  const inShop = stats?.vehiclesInShop ?? 0;

  const cards: Array<{
    title: string;
    value: string | number;
    icon: LucideIcon;
    tone: StatCardTone;
    hint?: string;
  }> = [
    {
      title: 'Active Maintenance',
      value: stats?.active ?? 0,
      icon: Wrench,
      tone: 'info',
      hint: 'Live',
    },
    {
      title: 'Vehicles in Shop',
      value: inShop,
      icon: AlertTriangle,
      tone: inShop > 0 ? 'warning' : 'success',
      hint: inShop > 0 ? 'In service' : 'Clear',
    },
    {
      title: 'Overdue',
      value: overdue,
      icon: Clock3,
      tone: overdue > 0 ? 'danger' : 'success',
      hint: overdue > 0 ? 'Attention' : 'On track',
    },
    {
      title: 'Monthly Cost',
      value: formatCurrency(stats?.costThisMonth ?? 0),
      icon: DollarSign,
      tone: 'primary',
      hint: 'This month',
    },
    {
      title: 'Avg Repair Time',
      value: `${stats?.averageRepairTimeDays ?? 0}d`,
      icon: Timer,
      tone: 'neutral',
      hint: 'Turnaround',
    },
  ];

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
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
            className="h-full"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
