'use client';

import {
  DollarSign,
  Droplets,
  Fuel,
  Gauge,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { StatCard, type StatCardTone } from '@/components/charts/stat-card';
import { staggerContainer, staggerItem } from '@/components/drivers/motion';
import type { FuelStatistics } from '@transitops/shared-types';

interface FuelStatisticsCardsProps {
  stats?: FuelStatistics;
  loading?: boolean;
  layout?: 'full' | 'panel';
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAvgPricePerLiter(stats: FuelStatistics) {
  if (stats.totalFuelQuantity <= 0) return '—';
  const avg = stats.totalFuelCost / stats.totalFuelQuantity;
  return `$${avg.toFixed(2)}/L`;
}

export function FuelStatisticsCards({ stats, loading, layout = 'full' }: FuelStatisticsCardsProps) {
  const reduceMotion = useReducedMotion();
  const monthlyCost = stats?.monthlyFuelCost?.at(-1)?.cost ?? 0;
  const compact = layout === 'panel';

  const cards: Array<{
    title: string;
    value: string;
    icon: LucideIcon;
    tone: StatCardTone;
    hint?: string;
  }> = [
    {
      title: 'Total Fuel Cost',
      value: stats ? formatCurrency(stats.totalFuelCost) : '—',
      icon: DollarSign,
      tone: 'primary',
      hint: 'Spend',
    },
    {
      title: 'Total Fuel Quantity',
      value: stats ? `${stats.totalFuelQuantity.toFixed(0)} L` : '—',
      icon: Droplets,
      tone: 'info',
      hint: 'Volume',
    },
    {
      title: 'Avg Price / L',
      value: stats ? formatAvgPricePerLiter(stats) : '—',
      icon: Gauge,
      tone: 'warning',
      hint: 'Rate',
    },
    {
      title: 'Monthly Fuel Cost',
      value: stats ? formatCurrency(monthlyCost) : '—',
      icon: Fuel,
      tone: monthlyCost > 0 ? 'success' : 'neutral',
      hint: 'Latest',
    },
  ];

  return (
    <motion.div
      className={
        layout === 'panel'
          ? 'grid grid-cols-2 gap-3 [&>*]:min-w-0'
          : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0'
      }
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
            size={compact ? 'compact' : 'default'}
            className="h-full"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
