'use client';

import {
  CheckCircle2,
  Clock,
  DollarSign,
  Wallet,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { StatCard, type StatCardTone } from '@/components/charts/stat-card';
import { staggerContainer, staggerItem } from '@/components/drivers/motion';

interface ExpenseStatisticsCardsProps {
  stats?: {
    totalExpenses: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  loading?: boolean;
  layout?: 'full' | 'panel';
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ExpenseStatisticsCards({ stats, loading, layout = 'full' }: ExpenseStatisticsCardsProps) {
  const reduceMotion = useReducedMotion();
  const compact = layout === 'panel';
  const pending = stats?.pending ?? 0;
  const rejected = stats?.rejected ?? 0;

  const cards: Array<{
    title: string;
    value: string;
    icon: LucideIcon;
    tone: StatCardTone;
    hint?: string;
  }> = [
    {
      title: 'Total Expenses',
      value: stats ? formatCurrency(stats.totalExpenses) : '—',
      icon: Wallet,
      tone: 'primary',
      hint: 'All time',
    },
    {
      title: 'Pending',
      value: stats ? formatCurrency(pending) : '—',
      icon: Clock,
      tone: pending > 0 ? 'warning' : 'neutral',
      hint: pending > 0 ? 'Review' : 'Clear',
    },
    {
      title: 'Approved',
      value: stats ? formatCurrency(stats.approved) : '—',
      icon: CheckCircle2,
      tone: 'success',
      hint: 'Paid',
    },
    {
      title: 'Rejected',
      value: stats ? formatCurrency(rejected) : '—',
      icon: XCircle,
      tone: rejected > 0 ? 'danger' : 'neutral',
      hint: rejected > 0 ? 'Action' : 'None',
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
