'use client';

import {
  Activity,
  CheckCircle2,
  Clock3,
  DollarSign,
  MapPinned,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { StatCard, type StatCardTone } from '@/components/charts/stat-card';
import { staggerContainer, staggerItem } from '@/components/drivers/motion';
import type { TripStatistics } from '@transitops/shared-types';

interface TripStatisticsProps {
  stats?: TripStatistics;
  loading?: boolean;
}

export function TripStatisticsCards({ stats, loading }: TripStatisticsProps) {
  const reduceMotion = useReducedMotion();
  const active = stats?.activeTrips ?? 0;
  const pending = stats?.pendingTrips ?? 0;

  const cards: Array<{
    title: string;
    value: string | number;
    icon: LucideIcon;
    tone: StatCardTone;
    hint?: string;
  }> = [
    {
      title: 'Active Trips',
      value: active,
      icon: Activity,
      tone: active > 0 ? 'info' : 'neutral',
      hint: active > 0 ? 'Live' : 'Idle',
    },
    {
      title: 'Pending Trips',
      value: pending,
      icon: Clock3,
      tone: pending > 0 ? 'warning' : 'neutral',
      hint: pending > 0 ? 'Draft' : 'Clear',
    },
    {
      title: 'Completed',
      value: stats?.completedTrips ?? 0,
      icon: CheckCircle2,
      tone: 'success',
      hint: 'Done',
    },
    {
      title: 'Revenue',
      value: stats ? `$${Math.round(stats.revenue).toLocaleString()}` : '$0',
      icon: DollarSign,
      tone: 'primary',
      hint: 'Total',
    },
    {
      title: 'Distance',
      value: stats ? `${Math.round(stats.distanceTravelled).toLocaleString()} mi` : '0 mi',
      icon: MapPinned,
      tone: 'neutral',
      hint: 'Travelled',
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
        <motion.div key={card.title} variants={staggerItem}>
          <StatCard
            title={card.title}
            value={card.value}
            icon={card.icon}
            loading={loading}
            tone={card.tone}
            hint={card.hint}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
