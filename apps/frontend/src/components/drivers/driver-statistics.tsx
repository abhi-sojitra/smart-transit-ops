'use client';

import {
  Users,
  UserCheck,
  Route,
  Ban,
  AlertTriangle,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { StatCard, type StatCardTone } from '@/components/charts/stat-card';
import { staggerContainer, staggerItem } from '@/components/drivers/motion';
import type { DriverStatistics } from '@/types/driver';

interface DriverStatisticsProps {
  statistics?: DriverStatistics;
  loading?: boolean;
}

function safetyTone(score?: number): StatCardTone {
  if (score == null) return 'neutral';
  if (score >= 85) return 'success';
  if (score >= 70) return 'warning';
  return 'danger';
}

function safetyChip(score?: number) {
  if (score == null) return undefined;
  if (score >= 85) return 'Healthy';
  if (score >= 70) return 'Monitor';
  return 'Critical';
}

export function DriverStatisticsCards({ statistics, loading }: DriverStatisticsProps) {
  const reduceMotion = useReducedMotion();
  const avgScore = statistics?.averageSafetyScore;
  const suspended = statistics?.suspended ?? 0;
  const expiring = statistics?.licenseExpiring ?? 0;

  const cards: Array<{
    title: string;
    value: string | number;
    icon: LucideIcon;
    tone: StatCardTone;
    hint?: string;
  }> = [
    {
      title: 'Total Drivers',
      value: statistics?.totalDrivers ?? 0,
      icon: Users,
      tone: 'primary',
      hint: 'Roster',
    },
    {
      title: 'Available',
      value: statistics?.available ?? 0,
      icon: UserCheck,
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
      title: 'Suspended',
      value: suspended,
      icon: Ban,
      tone: suspended > 0 ? 'danger' : 'neutral',
      hint: suspended > 0 ? 'Attention' : 'Clear',
    },
    {
      title: 'License Expiring',
      value: expiring,
      icon: AlertTriangle,
      tone: expiring > 0 ? 'warning' : 'success',
      hint: expiring > 0 ? 'Renew' : 'Valid',
    },
    {
      title: 'Avg Safety Score',
      value: statistics ? `${statistics.averageSafetyScore}%` : '—',
      icon: Shield,
      tone: safetyTone(avgScore),
      hint: safetyChip(avgScore),
    },
  ];

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
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
