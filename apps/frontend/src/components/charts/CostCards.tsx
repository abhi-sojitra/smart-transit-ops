'use client';

import { StatCard } from '@/components/charts/stat-card';
import { DollarSign, Droplets, Fuel, Gauge, Wallet } from 'lucide-react';
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
  const monthlyCost = stats?.monthlyFuelCost?.at(-1)?.cost ?? 0;
  const compact = layout === 'panel';

  return (
    <div
      className={
        layout === 'panel'
          ? 'grid grid-cols-2 gap-3 [&>*]:min-w-0'
          : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0'
      }
    >
      <StatCard
        title="Total Fuel Cost"
        value={stats ? formatCurrency(stats.totalFuelCost) : '—'}
        icon={DollarSign}
        loading={loading}
        size={compact ? 'compact' : 'default'}
      />
      <StatCard
        title="Total Fuel Quantity"
        value={stats ? `${stats.totalFuelQuantity.toFixed(0)} L` : '—'}
        icon={Droplets}
        loading={loading}
        size={compact ? 'compact' : 'default'}
      />
      <StatCard
        title="Avg Price / L"
        value={stats ? formatAvgPricePerLiter(stats) : '—'}
        icon={Gauge}
        loading={loading}
        size={compact ? 'compact' : 'default'}
      />
      <StatCard
        title="Monthly Fuel Cost"
        value={stats ? formatCurrency(monthlyCost) : '—'}
        icon={Fuel}
        loading={loading}
        size={compact ? 'compact' : 'default'}
      />
    </div>
  );
}

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

export function ExpenseStatisticsCards({ stats, loading, layout = 'full' }: ExpenseStatisticsCardsProps) {
  const compact = layout === 'panel';

  return (
    <div
      className={
        layout === 'panel'
          ? 'grid grid-cols-2 gap-3 [&>*]:min-w-0'
          : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0'
      }
    >
      <StatCard
        title="Total Expenses"
        value={stats ? formatCurrency(stats.totalExpenses) : '—'}
        icon={Wallet}
        loading={loading}
        size={compact ? 'compact' : 'default'}
      />
      <StatCard
        title="Pending"
        value={stats ? formatCurrency(stats.pending) : '—'}
        icon={DollarSign}
        loading={loading}
        size={compact ? 'compact' : 'default'}
      />
      <StatCard
        title="Approved"
        value={stats ? formatCurrency(stats.approved) : '—'}
        icon={DollarSign}
        loading={loading}
        size={compact ? 'compact' : 'default'}
      />
      <StatCard
        title="Rejected"
        value={stats ? formatCurrency(stats.rejected) : '—'}
        icon={DollarSign}
        loading={loading}
        size={compact ? 'compact' : 'default'}
      />
    </div>
  );
}
